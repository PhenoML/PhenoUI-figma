import {UINode} from "./export";

export function updateMetadata(node: UINode, key: string, value: string | number | boolean) {
    if (!node.getPluginData(key)) {
        node.setRelaunchData({ open: ''});
    }
    node.setPluginData(key, JSON.stringify(value));
}

export function getMetadata(node: UINode, key: string): string | number | boolean {
    try {
        return JSON.parse(node.getPluginData(key));
    } catch (e) {
        console.log(e);
        updateMetadata(node, key, '');
        return '';
    }
}