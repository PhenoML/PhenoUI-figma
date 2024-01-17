import {MessageBus} from "../../shared/MessageBus";
import {AvailableScreens} from "../../shared/AvailableScreens";
import {UIManager} from "../UIManager";
import {Screen} from "../screens/Screen";
import {StrapiEndpoints} from "../../plugin/Strapi";


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

async function _uploadToStrapi(bus: MessageBus, name: string, payload: any) {
    await bus.execute('uploadToStrapi', { collection: StrapiEndpoints.screens, name, payload });
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
                    await _uploadToStrapi(bus, name, payload);
                    break;

                default:
                    throw 'not implemented';
            }
        }
        manager.renderScreen(from, manager.root);
        _exporting = false;
    }
}