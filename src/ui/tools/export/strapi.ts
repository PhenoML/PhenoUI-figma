import {MessageBus} from "../../../shared/MessageBus";
import {ForbiddenError, StrapiEndpoints} from "../../../plugin/Strapi";
import {LayerMetadata} from "../../../shared/Metadata";
import {extractAnimations, extractImages} from "./export";

// @ts-ignore
import qs from 'qs';

async function _strapiAssetExists(bus: MessageBus, name: string, tag: string, jwt: string): Promise<{ id: string, url: string } | null> {
    const path = `${tag}/${name}`;
    const url = await bus.execute('getStrapiUrlForEndpoint', { collection: StrapiEndpoints.media + '/tag', options: { id: path } });
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new ForbiddenError('Unauthorized, please login again');
        } else if (response.status === 404) {
            return null;
        }
    }

    return await response.json();
}

type UploadAssetsCallbacks = {
    getUploadMethod: (asset: any) => string;
    getAssetName: (asset: any) => string;
    setAssetData: (asset: any, data: string) => void;
    getAssetBlob: (asset: any) => Blob;
}

async function _uploadAssetsToStrapi(bus: MessageBus, assets: any[], tag: string, callbacks: UploadAssetsCallbacks) {
    const jwt = await bus.execute('getStrapiJwt', undefined);
    const server = await bus.execute('getStrapiServer', undefined);
    const url = await bus.execute('getStrapiUrlForEndpoint', { collection: StrapiEndpoints.media });

    for (const asset of assets) {
        const uploadMethod = callbacks.getUploadMethod(asset);
        // if the image method is set to embed, skip uploading
        if (uploadMethod === 'embed') {
            continue;
        }

        const filename = callbacks.getAssetName(asset);
        const existing = await _strapiAssetExists(bus, filename, tag, jwt);
        // if the method is set to link and the image exists, set the link as the data and skip uploading
        if (uploadMethod == 'link' && existing) {
            callbacks.setAssetData(asset, existing.id);
            continue;
        }
        const endpoint = existing ? `/id/${existing.id}` : `/tag/${tag}/${filename}`;

        const form = new FormData();
        const blob = callbacks.getAssetBlob(asset);
        form.append('name', filename);
        form.append('file', blob, filename);

        const response = await fetch(`${url}${endpoint}`, {
            method: existing ? 'PATCH' : 'POST',
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            body: form,
        });

        const result = await response.json();
        const assetResult = Array.isArray(result) ? result[0] : result;
        if (assetResult) {
            callbacks.setAssetData(asset, assetResult.id);
        }
    }
}

async function _uploadImagesToStrapi(bus: MessageBus, images: any[], tag: string) {
    await _uploadAssetsToStrapi(bus, images, tag, {
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

async function _uploadAnimationsToStrapi(bus: MessageBus, animations: any[], tag: string) {
    await _uploadAssetsToStrapi(bus, animations, tag, {
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
    const collection: StrapiEndpoints = payload.type === 'figma-component' ? StrapiEndpoints.widgets : StrapiEndpoints.layouts;
    let categoryUid = await bus.execute('getMetadata', {
        id: LayerMetadata.currentPage,
        key: LayerMetadata.strapiCategory
    });
    if (!categoryUid) {
        categoryUid = await bus.execute('getLocalData', LayerMetadata.strapiUser);
    }

    // upload images first
    const images = extractImages(payload);
    await _uploadImagesToStrapi(bus, images, categoryUid);

    // upload animations
    const animations = extractAnimations(payload);
    await _uploadAnimationsToStrapi(bus, animations, categoryUid);

    if (payload.type !== 'figma-image') {
        let data: any;
        if (payload.type === 'figma-component') {
            data = {
                name,
                defaultVariant: payload.defaultVariant,
                variants: payload.variants,
            }
            if ('__userData' in payload) {
                data['arguments'] = payload.__userData;
            }
        } else {
            data = {
                name,
                data: payload,
            }
        }
        await bus.execute('uploadToStrapi', {collection, payload: data, tag: categoryUid});
    }
}