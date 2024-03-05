import {MessageBus} from "../../../shared/MessageBus";
import {AvailableScreens} from "../../../shared/AvailableScreens";
import {UIManager} from "../../UIManager";
import {Screen} from "../../screens/Screen";
import {uploadToStrapi} from "./strapi";
import {commitToGithub} from "./github";



export enum ExportLayerMode {
    json,
    strapiUpload,
    githubCommit,
}

let _exporting = false;

async function _downloadExport(name: string, payload: any) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const blobURL = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    // link.className = 'button button--primary';
    link.href = blobURL;
    link.download = `${name}.json`;
    link.click();
    link.setAttribute('download', `${name},json`);
    // artificially wait for a bit to wait for the download screen to appear
    await new Promise(resolve => setTimeout(resolve, 1000));
}

export function extractImages(payload: any): any[] {
    const images = []
    if (payload.type === 'figma-image') {
        images.push(payload);
    }

    if ('children' in payload) {
        for (const child of payload.children) {
            images.push(...extractImages(child));
        }
    } else if ('child' in payload) {
        images.push(...extractImages(payload.child));
    }

    if ('variants' in payload) {
        for (const key of Object.keys(payload.variants)) {
            images.push(...extractImages(payload.variants[key]));
        }
    }

    return images;
}

export async function exportLayer(manager: UIManager, bus: MessageBus, id: string, name: string, mode: ExportLayerMode, from: Screen) {
    if (!_exporting) {
        const loading = manager._getScreen(AvailableScreens.loading);

        manager.renderScreen(loading, manager.root);
        _exporting = true;
        const payload = await bus.execute('exportToFlutter', { id });
        if (payload) {
            switch (mode) {
                case ExportLayerMode.json:
                    await _downloadExport(name, payload);
                    break;

                case ExportLayerMode.strapiUpload:
                    await uploadToStrapi(bus, name, payload);
                    break;

                case ExportLayerMode.githubCommit:
                    await commitToGithub(bus, name, payload, from._manager.github);
                    break;

                default:
                    throw 'not implemented';
            }
        }
        manager.renderScreen(from, manager.root);
        _exporting = false;
    }
}