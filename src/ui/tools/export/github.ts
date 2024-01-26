import {MessageBus} from "../../../shared/MessageBus";
import {Github, GithubFile} from "../../Github";
import {extractImages} from "./export";

export async function commitToGithub(bus: MessageBus, name: string, payload: any, github: Github) {
    if (!await github.isLoggedIn) {
        console.log('not logged in');
        return;
    }

    const [type, folder] = payload.type === 'figma-component' ? ['Widget', 'widgets'] : ['Screen', 'screens'];

    const files: GithubFile[] = [];

    const images = extractImages(payload);
    for (const image of images) {
        const filename = `${image.name}.${image.format}`;
        const path = `assets/images/${filename}`;
        files.push({
            path,
            content: image.data,
            isBinary: image.format !== 'svg',
        });
        image.data = path;
    }

    files.push({
        path: `${folder}/${name}.json`,
        content: JSON.stringify(payload, null, 2),
    });

    const message = `[${github._user?.login.toUpperCase()}] ${type}: ${name}`;
    console.log(message);

    await github.commitFiles(files, message);

}