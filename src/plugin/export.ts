import {LayerMetadata} from "../shared/Metadata";
import {Strapi} from "./Strapi";
import {MessageBus} from "../shared/MessageBus";
import {showErrorScreen} from "./screens";


export type UINode = DocumentNode | SceneNode;

export function findNode(api: PluginAPI, id: string): UINode | null {
    if (id === api.root.id) {
        return api.root;
    }
    return api.currentPage.findOne(n => n.id === id);
}

export function figmaTypeToWidget(node: UINode): string {
    switch (node.type) {
        case 'COMPONENT':
            return node.name;

        case 'FRAME':
            if (node.layoutMode === 'NONE') {
                return 'container';
            }
            return 'autoLayout'

        default:
            return node.type.toLowerCase();
    }
}

export async function exportNode(bus: MessageBus, strapi: Strapi, node: UINode) {
    const type = node.getPluginData(LayerMetadata.widgetOverride) || figmaTypeToWidget(node);
    const mapping = strapi.getTypeMapping(bus, type);
    return JSON.stringify({ dario: 'is super cool!' });
}

export async function exportToFlutter(api: PluginAPI, bus: MessageBus, strapi: Strapi, id: string): Promise<any> {
    const node = findNode(api, id);
    if (!node) {
        showErrorScreen(
            bus,
            'ERROR',
            `Could not find node with ID [${id}] for export.`
        );
        return null;
    }

    return await exportNode(bus, strapi, node);
}

