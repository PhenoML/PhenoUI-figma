import {UINode} from "./export";

export function updateMetadata(node: UINode, key: string, value: any) {
    if (!node.getPluginData(key)) {
        node.setRelaunchData({ open: ''});
    }
    node.setPluginData(key, value);
}