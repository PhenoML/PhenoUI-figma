import {MessageBus} from "../../shared/MessageBus";
import {AvailableScreens} from "../../shared/AvailableScreens";
import {UIManager} from "../UIManager";
import {Screen} from "../screens/Screen";
import {StrapiEndpoints} from "../../plugin/Strapi";
import {LayerMetadata} from "../../shared/Metadata";
import {Github} from "../Github";
// @ts-ignore
import qs from 'qs';


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

function _extractImages(bus: MessageBus, payload: any): any[] {
    console.log(payload);
    const images = []
    if (payload.type === 'figma-image') {
        images.push(payload);
    }

    if ('children' in payload) {
        for (const child of payload.children) {
            images.push(..._extractImages(bus, child));
        }
    }

    if ('variants' in payload) {
        for (const key of Object.keys(payload.variants)) {
            images.push(..._extractImages(bus, payload.variants[key]));
        }
    }

    return images;
}

async function _strapiImageExists(bus: MessageBus, name: string, jwt: string): Promise<string | null> {
    const query = qs.stringify({
        filters: {
            name: {
                $eq: name,
            }
        }
    });
    const url = await bus.execute('getStrapiUrlForEndpoint', { collection: StrapiEndpoints.files, options: { query } });
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    });

    const result = await response.json();
    if (result.length > 0) {
        return result[0].id;
    }
    return null;
}

async function _uploadImagesToStrapi(bus: MessageBus, images: any[]) {
    const jwt = await bus.execute('getStrapiJwt', undefined);
    const server = await bus.execute('getStrapiServer', undefined);
    const url = await bus.execute('getStrapiUrlForEndpoint', { collection: StrapiEndpoints.upload });
    for (const image of images) {
        const filename = `${image.name}.${image.format}`;
        const existing = await _strapiImageExists(bus, filename, jwt);
        const query = existing ? `?id=${existing}` : '';

        const form = new FormData();
        if (image.format === 'svg') {
            const blob = new Blob([image.data], { type: 'image/svg+xml' });
            form.append('files', blob, filename);
        } else {
            const bytes = Uint8Array.from(atob(image.data), (c) => c.charCodeAt(0));
            const blob = new Blob([bytes], { type: `image/${image.format}` });
            form.append('files', blob, filename);
        }

        const response = await fetch(`${url}${query}`, {
            method: 'post',
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            body: form,
        });

       const result = await response.json();
       const imageResult = Array.isArray(result) ? result[0] : result;
       if (imageResult) {
           image.data = new URL(imageResult.url, server).href;
       }
    }
}

async function _uploadToStrapi(bus: MessageBus, name: string, payload: any) {
    const collection: StrapiEndpoints = payload.type === 'figma-component' ? StrapiEndpoints.widgets : StrapiEndpoints.screens;
    const categoryCollection: StrapiEndpoints = payload.type === 'figma-component' ? StrapiEndpoints.widgetCategories : StrapiEndpoints.screenCategories;
    const categoryUid = payload.type === 'figma-component' ? await bus.execute('getMetadata', { id: null, key: LayerMetadata.strapiUser}) : 'debug'; // debug hardcoded for now
    const categoryData = await bus.execute('getCategory', { collection: categoryCollection, uid: categoryUid });
    const category = categoryData ? categoryData.id : (await bus.execute('createCategory', { collection: categoryCollection, uid: categoryUid })).id;

    // upload images first
    const images = _extractImages(bus, payload);
    await _uploadImagesToStrapi(bus, images);

    let data: any;
    if (payload.type === 'figma-component') {
        data = {
            name,
            category,
            defaultVariant: payload.defaultVariant,
            variants: payload.variants,
        }
        if ('__userData' in payload) {
            data['arguments'] = payload.__userData;
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