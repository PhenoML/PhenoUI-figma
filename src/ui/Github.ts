import {Octokit} from 'octokit';
import {OctokitResponse} from '@octokit/types';
import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types';
import {MessageBus} from '../shared/MessageBus';
import {LayerMetadata} from "../shared/Metadata";

export class GithubBadResponseError extends Error {}

export type GithubFile = {
    path: string,
    content: string|Uint8Array,
    isBinary?: boolean,
}

// from https://stackoverflow.com/questions/12710001
// note: `buffer` arg can be an ArrayBuffer or a Uint8Array
async function bufferToBase64(buffer: Uint8Array | ArrayBuffer): Promise<string> {
    // use a FileReader to generate a base64 data URI:
    const base64url: string = await new Promise(r => {
        const reader = new FileReader()
        reader.onload = () => r(reader.result as string)
        reader.readAsDataURL(new Blob([buffer]))
    });
    // remove the `data:...;base64,` part from the start
    return base64url.slice(base64url.indexOf(',') + 1);
}

export class Github {
    loginPromise: Promise<boolean>;
    bus: MessageBus;
    octokit?: Octokit;
    _user?: RestEndpointMethodTypes['users']['getAuthenticated']['response']['data'];
    _repo?: RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][0];

    _branchCommitSha: string | null = null;
    _branchCommitShaTimeout: number | null = null;
    get branchCommitSha(): Promise<string> {
        if (this._branchCommitSha) {
            return Promise.resolve(this._branchCommitSha);
        }
        return this._getBranch().then((branch) => {
            this.branchCommitSha = branch.commit.sha;
            return this._branchCommitSha as string;
        });
    }

    set branchCommitSha(sha: string) {
        if (this._branchCommitShaTimeout) {
            window.clearTimeout(this._branchCommitShaTimeout);
        }
        this._branchCommitSha = sha;
        this._branchCommitShaTimeout = window.setTimeout(() => {
            this._branchCommitSha = null;
            this._branchCommitShaTimeout = null;
        }, 1000 * 60 * 2); // 2 minutes
    }

    get user(): Promise<RestEndpointMethodTypes['users']['getAuthenticated']['response']['data'] | undefined> {
        return this.loginPromise.then(() => this._user);
    }

    get repo(): Promise<RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][0] | undefined> {
        return this.loginPromise.then(() => this._repo);
    }

    get isLoggedIn(): Promise<boolean> {
        return this.loginPromise;
    }

    constructor(bus: MessageBus) {
        this.bus = bus;
        this.loginPromise = this._tryLogin();
    }

    async login(authToken: string): Promise<boolean> {
        this.loginPromise = this._tryLogin(authToken);
        return this.loginPromise;
    }

    async logout(): Promise<void> {
        this.octokit = undefined;
        this._user = undefined;
        this._repo = undefined;
        await this._setAuthToken(this.bus, '');
        this.loginPromise = Promise.resolve(false);
    }

    async fileExists(path: string): Promise<boolean> {
        if (!await this.isLoggedIn) {
            return false;
        }

        try {
            await this.octokit!.rest.repos.getContent({
                owner: this._repo!.owner.login,
                repo: this._repo!.name,
                path,
                ref: `heads/${this._user!.login}`,
            });
            return true;
        } catch (e: unknown) {
            return false;
        }
    }

    async commitFiles(files: GithubFile[], message: string): Promise<void> {
        if (!await this.isLoggedIn) {
            return;
        }

        const sha = await this.branchCommitSha;
        const commit = await this._getCommit(sha);

        const blobs = await Promise.all(files.map(async (file) => {
            const content = ArrayBuffer.isView(file.content) ? await bufferToBase64(file.content) : file.content;
            const blob = this._checkResponse(await this.octokit!.rest.git.createBlob({
                owner: this._repo!.owner.login,
                repo: this._repo!.name,
                content,
                encoding: ArrayBuffer.isView(file.content) || file.isBinary ? 'base64' : 'utf-8',
            }));
            return {
                path: file.path,
                sha: blob.data.sha,
            };
        }));

        const tree = this._checkResponse(await this.octokit!.rest.git.createTree({
            owner: this._repo!.owner.login,
            repo: this._repo!.name,
            tree: blobs.map((blob) => ({
                path: blob.path,
                mode: '100644',
                type: 'blob',
                sha: blob.sha,
            })),
            base_tree: commit.tree.sha,
        }));

        const newCommit = this._checkResponse(await this.octokit!.rest.git.createCommit({
            owner: this._repo!.owner.login,
            repo: this._repo!.name,
            message,
            tree: tree.data.sha,
            parents: [commit.sha],
        }));

        this._checkResponse(await this.octokit!.rest.git.updateRef({
            owner: this._repo!.owner.login,
            repo: this._repo!.name,
            ref: `heads/${this._user!.login}`,
            sha: newCommit.data.sha,
        }));

        this.branchCommitSha = newCommit.data.sha;
    }

    async createPullRequest(title: string, body?: string): Promise<boolean> {
        if (!await this.isLoggedIn || !this.octokit) {
            return false;
        }

        // create a branch name from the use login name and current UNIX timestamp
        const branchName = `${this._user!.login}-${Date.now()}`;

        // create a branch based on the user's branch to base this PR off of
        await this._createBranch(branchName, await this.branchCommitSha);
        const branch = await this._getBranch(branchName);

        this._checkResponse(await this.octokit!.rest.pulls.create({
            owner: this._repo!.owner.login,
            repo: this._repo!.name,
            title,
            body,
            head: branch.name,
            base: 'develop',
        }));

        return true;
    }

    async _tryLogin(authToken?: string): Promise<boolean> {
        authToken = authToken || await this._getAuthToken(this.bus);
        if (!authToken) {
            return false;
        }

        this.octokit = new Octokit({ auth: authToken });

        const userResponse = await this.octokit.rest.users.getAuthenticated();
        if (userResponse.status !== 200) {
            this.octokit = undefined;
            return false;
        }
        this._user = userResponse.data;

        try {
            await this._initGithub();
        } catch (e: unknown) {
            this.octokit = undefined;
            return false;
        }

        await this._setAuthToken(this.bus, authToken);

        return true;
    }

    async _getAuthToken(bus: MessageBus): Promise<string> {
        return (await bus.execute('getLocalData', LayerMetadata.githubAccessToken)) || '';
    }

    async _setAuthToken(bus: MessageBus, token: string): Promise<void> {
        await bus.execute('setLocalData', {
            key: LayerMetadata.githubAccessToken,
            value: token,
        });
    }

    _checkResponse<T>(response: OctokitResponse<T>): OctokitResponse<T> {
        if (response.status < 200 || response.status >= 300) {
            throw new GithubBadResponseError(`Bad response from Github: ${response.status}`);
        }
        return response;
    }

    async _initGithub(): Promise<void> {
        if (!this.octokit) {
            return;
        }

        const repos = this._checkResponse(await this.octokit.rest.repos.listForAuthenticatedUser({
            type: 'private'
        }));
        this._repo = repos.data[0];

        const branches = this._checkResponse(await this.octokit.rest.repos.listBranches({
            owner: this._repo!.owner.login,
            repo: this._repo!.name,
        }));
        const hasBranch = branches.data.some((branch) => branch.name === this._user!.login);
        if (!hasBranch) {
            // create a branch based on the `develop` branch
            await this._createBranch(this._user!.login, branches.data.find((branch) => branch.name === 'develop')!.commit.sha);
        }
    }

    async _createBranch(branch: string, sha: string): Promise<RestEndpointMethodTypes['git']['createRef']['response']['data']> {
        return this._checkResponse(await (this.octokit as Octokit).rest.git.createRef({
            owner: this._repo!.owner.login,
            repo: this._repo!.name,
            ref: `refs/heads/${branch}`,
            sha,
        })).data;
    }

    async _getBranch(branchName: string = this._user!.login): Promise<RestEndpointMethodTypes['repos']['getBranch']['response']['data']> {
        const branch = this._checkResponse(await this.octokit!.rest.repos.getBranch({
            owner: this._repo!.owner.login,
            repo: this._repo!.name,
            branch: branchName,
        }));
        return branch.data;
    }

    async _getCommit(commit_sha: string): Promise<RestEndpointMethodTypes['git']['getCommit']['response']['data']> {
        const commit = this._checkResponse(await this.octokit!.rest.git.getCommit({
            owner: this._repo!.owner.login,
            repo: this._repo!.name,
            commit_sha,
        }));
        return commit.data;
    }
}

