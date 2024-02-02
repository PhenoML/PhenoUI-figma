import {MessageBus} from "../../../shared/MessageBus";
import {StrapiEndpoints} from "../../../plugin/Strapi";
import {LayerMetadata} from "../../../shared/Metadata";
import {extractImages} from "./export";

// @ts-ignore
import qs from 'qs';

async function _strapiImageExists(bus: MessageBus, name: string, jwt: string): Promise<{ id: string, url: string } | null> {
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

async function _uploadImagesToStrapi(bus: MessageBus, images: any[]) {
    const jwt = await bus.execute('getStrapiJwt', undefined);
    const server = await bus.execute('getStrapiServer', undefined);
    const url = await bus.execute('getStrapiUrlForEndpoint', { collection: StrapiEndpoints.upload });
    for (const image of images) {
        // if the image method is set to embed, skip uploading
        if (image.__userData.method === 'embed') {
            continue;
        }

        const filename = `${image.name}.${image.format}`;
        const existing = await _strapiImageExists(bus, filename, jwt);
        // if the method is set to link and the image exists, set the link as the data and skip uploading
        if (image.__userData.method === 'link' && existing) {
            image.data = new URL(existing.url, server).href;
            continue;
        }
        const query = existing ? `?id=${existing.id}` : '';

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
    console.log(data);
    await bus.execute('uploadToStrapi', { collection, payload: data });
}