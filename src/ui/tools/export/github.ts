import {MessageBus} from "../../../shared/MessageBus";
import {Github, GithubFile} from "../../Github";
import {extractImages} from "./export";
import {Octokit} from 'octokit';

export async function commitToGithub(bus: MessageBus, name: string, payload: any, github: Github) {
    if (!await github.isLoggedIn) {
        console.log('not logged in');
        return;
    }

    const [type, folder] = (() => {
        switch (payload.type) {
            case 'figma-component':
                return ['Widget', 'widgets'];
            case 'figma-image':
                return ['Image', null];
            default:
                return ['Screen', 'screens'];
        }
    })();

    const files: GithubFile[] = [];

    const images = extractImages(payload);
    for (const image of images) {
        const uploadMethod = image.__userData.method ?? image.uploadMethod ?? 'embed';
        // if the image method is set to embed, skip uploading
        if (uploadMethod === 'embed') {
            continue;
        }

        const filename = `${image.__info.name}.${image.format}`;
        const path = `assets/images/${filename}`;
        const exists = await github.fileExists(path);

        if (uploadMethod === 'link' && exists) {
            image.data = path;
            continue;
        }

        files.push({
            path,
            content: image.data,
            isBinary: image.format !== 'svg',
        });
        image.data = path;
    }

    if (folder) {
        files.push({
            path: `${folder}/${name}.json`,
            content: JSON.stringify(payload, null, 2),
        });
    }

    const message = `[${github._user?.login.toUpperCase()}] ${type}: ${name}`;

    while (true) {
        try {
            await github.commitFiles(files, message);
            break;
        } catch (e: any) {
            // if the status is 422, wait for 10 seconds and try again
            if (e.status === 422) {
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }
}