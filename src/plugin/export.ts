import {LayerMetadata} from "../shared/Metadata";
import {Strapi} from "./Strapi";
import {MessageBus} from "../shared/MessageBus";
import {showErrorScreen} from "./screens";
import {getMetadata} from "./metadata";

enum MappingAction {
    literal = '!',
    valuePath = '#',
    nodePath = '$',
    inherit = '@',
}

type MappingString = `${MappingAction}${string}`;

type MappingSpecObj = {
    [key: string]: MappingString | MappingSpec | MappingString[] | MappingSpec[];
}
type MappingEntry = MappingSpecObj[keyof MappingSpecObj];
type MappingSpecArr = MappingEntry[];
type MappingSpec = MappingSpecObj | MappingSpecArr;

export type UINode = DocumentNode | SceneNode;

export function findNode(api: PluginAPI, id: string): UINode | null {
    if (id === api.root.id) {
        return api.root;
    }
    return api.getNodeById(id) as (UINode | null);
}

export function figmaTypeToWidget(node: UINode): string {
    switch (node.type) {
        case 'COMPONENT':
            return node.name;

        case 'FRAME':
            return 'Frame'

        case 'INSTANCE':
            return (node.mainComponent as UINode).name;

        default:
            return `${node.type.charAt(0).toUpperCase()}${node.type.slice(1).toLowerCase()}`;
    }
}

function _resolvePath(obj: any, path: string[]): any {
    let value = obj;
    for (const comp of path) {
        const openBracket = comp.indexOf('[');
        const closeBracket = comp.indexOf(']');
        if (openBracket !== -1 && closeBracket !== -1) {
            const base = comp.substring(0, openBracket);
            const index = comp.substring(openBracket + 1, closeBracket);
            if (!(base in value) || !(index in value[base])) {
                return null;
            }
            value = value[base][index];
        } else {
            if (!(comp in value)) {
                return null;
            }
            value = value[comp];
        }
    }
    return value;
}

async function _fetchValue(cache: Map<string, any>, strapi: Strapi, node: UINode, mapping: MappingString) {
    const operator = mapping.substring(0, 1);
    const path = mapping.substring(1);
    const components = path.split('.');
    switch (operator) {
        case MappingAction.literal:
            return path;

        case MappingAction.valuePath:
            return _resolvePath(node, components);

        case MappingAction.nodePath:
            const fetched = _resolvePath(node, components);
            if (Array.isArray(fetched)) {
                const value = [];
                for (const n of fetched) {
                    const exported = await exportNode(cache, strapi, n);
                    value.push(exported);
                }
                return value;
            }
            return await exportNode(cache, strapi, fetched);

        case MappingAction.inherit:
            const spec = await strapi.getTypeSpec(path, cache);
            if (!spec) {
                return null;
            }
            return await _processSpec(cache, strapi, node, spec.mappings);

        default:
            throw `ERROR parsing - Unrecognized mapping operator [${operator}] for mapping ${mapping}`;
    }
}

async function _processSpec(cache: Map<string, any>, strapi: Strapi, node: UINode, spec: MappingSpec): Promise<any> {
    if (Array.isArray(spec)) {
        const result = [];
        for (const entry of spec) {
            if (typeof entry as any === 'string') {
                result.push(await _fetchValue(cache, strapi, node, entry as MappingString));
            } else {
                result.push(await _processSpec(cache, strapi, node, entry as MappingSpec));
            }
        }
        return result;
    }

    const result: any = {};
    for (const key of Object.keys(spec)) {
        const entry: MappingEntry = spec[key];
        if (typeof entry as any === 'string') {
            result[key] = await _fetchValue(cache, strapi, node, entry as MappingString);
        } else {
            result[key] = await _processSpec(cache, strapi, node, entry as MappingSpec);
        }
    }
    return result;
}

export async function exportNode(cache: Map<string, any>, strapi: Strapi, node: UINode) {
    try {
        console.log(node);
        const type = getMetadata(node, LayerMetadata.widgetOverride) as string || figmaTypeToWidget(node);
        const spec = await strapi.getTypeSpec(type, cache);
        if (!spec) {
            return null;
        }

        return _processSpec(cache, strapi, node, spec.mappings);
    } catch (e) {
        console.log(e);
        throw e;
    }
}

export async function exportToFlutter(api: PluginAPI, strapi: Strapi, id: string): Promise<any> {
    const node = findNode(api, id);
    if (!node) {
        throw new Error(`Could not find node with ID [${id}] for export.`);
    }

    const cache = new Map<string, any>();
    return await exportNode(cache, strapi, node);
}

