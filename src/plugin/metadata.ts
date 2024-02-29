import {UINode} from "./tools/export/export";
import {PropertyBinding} from './Strapi';

export function updateMetadata(node: UINode, key: string, value: string | number | boolean | PropertyBinding) {
    if (!node.getPluginData(key)) {
        node.setRelaunchData({ open: ''});
    }
    node.setPluginData(key, JSON.stringify(value));
}

export function getMetadata(node: UINode, key: string): string | number | boolean | PropertyBinding {
    try {
        return JSON.parse(node.getPluginData(key));
    } catch (e) {
        console.error(e);
        updateMetadata(node, key, '');
        return '';
    }
}

export async function setLocalData(key: string, value: string | number | boolean) {
    await figma.clientStorage.setAsync(key, value);
}

export async function getLocalData(key: string): Promise<string | number | boolean> {
    return await figma.clientStorage.getAsync(key);
}
