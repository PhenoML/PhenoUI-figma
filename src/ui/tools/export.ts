import {MessageBus} from "../../shared/MessageBus";
import {AvailableScreens} from "../../shared/AvailableScreens";
import {UIManager} from "../UIManager";
import {Screen} from "../screens/Screen";
import {StrapiEndpoints} from "../../plugin/Strapi";
import {getMetadata} from "../../plugin/metadata";
import {LayerMetadata} from "../../shared/Metadata";
import {Github} from "../Github";


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
    const collection: StrapiEndpoints = payload.type === 'figma-component' ? StrapiEndpoints.widgets : StrapiEndpoints.screens;
    const categoryCollection: StrapiEndpoints = payload.type === 'figma-component' ? StrapiEndpoints.widgetCategories : StrapiEndpoints.screenCategories;
    const categoryUid = payload.type === 'figma-component' ? await bus.execute('getMetadata', { id: null, key: LayerMetadata.strapiUser}) : 'debug'; // debug hardcoded for now
    const categoryData = await bus.execute('getCategory', { collection: categoryCollection, uid: categoryUid });
    const category = categoryData ? categoryData.id : (await bus.execute('createCategory', { collection: categoryCollection, uid: categoryUid })).id;
    let data: any;
    if (payload.type === 'figma-component') {
        data = {
            name,
            category,
            defaultVariant: 'default',
            variants: {
                default: payload,
            },
        }
        if ('__userData' in payload) {
            data['arguments'] = payload.__userData;
            delete payload.__userData;
        }
    } else {
        data = {
            name,
            category,
            spec: payload,
        }
    }
    await bus.execute('uploadToStrapi', { collection, payload: data });
}

async function _commitToGithub(bus: MessageBus, name: string, payload: any, github: Github) {
    if (!await github.isLoggedIn) {
        console.log('not logged in');
        return;
    }

    // for now, only widget uploads are supported
    if (payload.type !== 'figma-component') {
        console.log('only figma components are supported for now');
        return;
    }

    const message = `[${github._user?.login.toUpperCase()}] Widget: ${name}`;
    console.log(message);

    await github.commitFiles([{
        path: `widgets/${name}.json`,
        content: JSON.stringify(payload, null, 2),
    }], message);

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

                case ExportLayerMode.githubCommit:
                    await _commitToGithub(bus, name, payload, from._manager.github);
                    break;

                default:
                    throw 'not implemented';
            }
        }
        manager.renderScreen(from, manager.root);
        _exporting = false;
    }
}