import {Octokit} from 'octokit';
import {OctokitResponse} from '@octokit/types';
import {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types';
import {MessageBus} from '../shared/MessageBus';
import {LayerMetadata} from "../shared/Metadata";

export class GithubBadResponseError extends Error {}

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

    async commitFiles(files: Array<{path: string, content: string|Uint8Array}>, message: string): Promise<void> {
        if (!await this.isLoggedIn) {
            return;
        }

        const branch = await this._getBranch();
        const commit = await this._getCommit(branch.commit.sha);

        const blobs = await Promise.all(files.map(async (file) => {
            const content = ArrayBuffer.isView(file.content) ? await bufferToBase64(file.content) : file.content;
            const blob = this._checkResponse(await this.octokit!.rest.git.createBlob({
                owner: this._repo!.owner.login,
                repo: this._repo!.name,
                content,
                encoding: ArrayBuffer.isView(file.content) ? 'base64' : 'utf-8',
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
            ref: `heads/${branch.name}`,
            sha: newCommit.data.sha,
        }));
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
        return await bus.execute('getMetadata', {
            id: null,
            key: LayerMetadata.githubAccessToken,
        });
    }

    async _setAuthToken(bus: MessageBus, token: string): Promise<void> {
        await bus.execute('updateMetadata', {
            id: null,
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
            this._checkResponse(await this.octokit.rest.git.createRef({
                owner: this._repo!.owner.login,
                repo: this._repo!.name,
                ref: `refs/heads/${this._user!.login}`,
                sha: branches.data.find((branch) => branch.name === 'develop')!.commit.sha,
            }));
        }
    }

    async _getBranch(): Promise<RestEndpointMethodTypes['repos']['getBranch']['response']['data']> {
        const branch = this._checkResponse(await this.octokit!.rest.repos.getBranch({
            owner: this._repo!.owner.login,
            repo: this._repo!.name,
            branch: this._user!.login,
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

