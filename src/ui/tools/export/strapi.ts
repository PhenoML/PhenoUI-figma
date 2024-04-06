import {MessageBus} from "../../../shared/MessageBus";
import {StrapiEndpoints} from "../../../plugin/Strapi";
import {LayerMetadata} from "../../../shared/Metadata";
import {extractAnimations, extractImages} from "./export";

// @ts-ignore
import qs from 'qs';

async function _strapiAssetExists(bus: MessageBus, name: string, jwt: string): Promise<{ id: string, url: string } | null> {
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
        return result[0];
    }
    return null;
}

type UploadAssetsCallbacks = {
    getUploadMethod: (asset: any) => string;
    getAssetName: (asset: any) => string;
    setAssetData: (asset: any, data: string) => void;
    getAssetBlob: (asset: any) => Blob;
}

async function _uploadAssetsToStrapi(bus: MessageBus, assets: any[], callbacks: UploadAssetsCallbacks) {
    const jwt = await bus.execute('getStrapiJwt', undefined);
    const server = await bus.execute('getStrapiServer', undefined);
    const url = await bus.execute('getStrapiUrlForEndpoint', { collection: StrapiEndpoints.upload });

    for (const asset of assets) {
        const uploadMethod = callbacks.getUploadMethod(asset);
        // if the image method is set to embed, skip uploading
        if (uploadMethod === 'embed') {
            continue;
        }

        const filename = callbacks.getAssetName(asset);
        const existing = await _strapiAssetExists(bus, filename, jwt);
        // if the method is set to link and the image exists, set the link as the data and skip uploading
        if (uploadMethod == 'link' && existing) {
            callbacks.setAssetData(asset, new URL(existing.url, server).href);
            continue;
        }
        const query = existing ? `?id=${existing.id}` : '';

        const form = new FormData();
        const blob = callbacks.getAssetBlob(asset);
        form.append('files', blob, filename);

        const response = await fetch(`${url}${query}`, {
            method: 'post',
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            body: form,
        });

        const result = await response.json();
        const assetResult = Array.isArray(result) ? result[0] : result;
        if (assetResult) {
            callbacks.setAssetData(asset, new URL(assetResult.url, server).href);
        }
    }
}

async function _uploadImagesToStrapi(bus: MessageBus, images: any[]) {
    await _uploadAssetsToStrapi(bus, images, {
        getUploadMethod: (image: any) => image.__userData.method ?? image.uploadMethod ?? 'embed',
        getAssetName: (image: any) => `${image.__info.name}.${image.format}`,
        setAssetData: (image: any, data: string) => image.data = data,
        getAssetBlob: (image: any) => {
            if (image.format === 'svg') {
                return new Blob([image.data], { type: 'image/svg+xml' });
            } else {
                const bytes = Uint8Array.from(atob(image.data), (c) => c.charCodeAt(0));
                return new Blob([bytes], { type: `image/${image.format}` });
            }
        },
    });
}

async function _uploadAnimationsToStrapi(bus: MessageBus, animations: any[]) {
    await _uploadAssetsToStrapi(bus, animations, {
        getUploadMethod: (animation: any) => {
            const method = animation.__userData.method ?? 'embed';
            console.log(method);
            return method;
        },
        getAssetName: (animation: any) => `${animation.__info.name}.json`,
        setAssetData: (animation: any, data: string) => animation.__userData.animation.fields.data = data,
        getAssetBlob: (animation: any) => new Blob([animation.__userData.animation.fields.data], {type: 'application/json'}),
    });
}

export async function uploadToStrapi(bus: MessageBus, name: string, payload: any) {
    const collection: StrapiEndpoints = payload.type === 'figma-component' ? StrapiEndpoints.widgets : StrapiEndpoints.screens;
    const categoryCollection: StrapiEndpoints = payload.type === 'figma-component' ? StrapiEndpoints.widgetCategories : StrapiEndpoints.screenCategories;
    const categoryUid = await bus.execute('getLocalData', LayerMetadata.strapiUser);
    const categoryData = await bus.execute('getCategory', { collection: categoryCollection, uid: categoryUid });
    const category = categoryData ? categoryData.id : (await bus.execute('createCategory', { collection: categoryCollection, uid: categoryUid })).id;
    const slug = `${categoryUid.toLowerCase().replace(/ /g, '-')}-${name.toLowerCase().replace(/ /g, '-')}`;

    // upload images first
    const images = extractImages(payload);
    await _uploadImagesToStrapi(bus, images);

    // upload animations
    const animations = extractAnimations(payload);
    await _uploadAnimationsToStrapi(bus, animations);

    if (payload.type !== 'figma-image') {
        let data: any;
        if (payload.type === 'figma-component') {
            data = {
                name,
                category,
                slug,
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
                slug,
                spec: payload,
            }
        }
        await bus.execute('uploadToStrapi', {collection, payload: data});
    }
}