import {LayerMetadata} from "../../../shared/Metadata";
import {Strapi, TypeSpec, UserDataSpec} from "../../Strapi";
import {getMetadata} from "../../metadata";
import {execute} from "../../execute";
import {getUserData} from "./userdata";

enum MappingAction {
    literal = '!',
    valuePath = '#',
    nodePath = '$',
    inherit = '@',
    execute = '%',
    source = '*',
}

export type MappingString = `${MappingAction}${string}`;

type MappingSpecObj = {
    [key: string]: MappingString | MappingSpec | MappingString[] | MappingSpec[] | number | boolean | null;
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
            if (node.parent && node.parent.type === 'COMPONENT_SET') {
                return node.parent.name;
            }
            return node.name;
        case 'COMPONENT_SET':
            return node.name;

        case 'FRAME':
            return 'Frame'

        case 'INSTANCE':
            const main = (node.mainComponent as UINode);
            if (main.parent && main.parent.type === 'COMPONENT_SET') {
                return main.parent.name;
            }
            return main.name;

        default:
            return `${node.type.charAt(0).toUpperCase()}${node.type.slice(1).toLowerCase()}`;
    }
}

export function resolvePath(obj: any, path: string[]): { value: any, parent: any } {
    let parent = null;
    let value = obj;
    for (const comp of path) {
        if (!comp) {
            continue;
        }
        const openBracket = comp.indexOf('[');
        const closeBracket = comp.indexOf(']');
        if (openBracket !== -1 && closeBracket !== -1) {
            const base = comp.substring(0, openBracket);
            const index = comp.substring(openBracket + 1, closeBracket);
            if (!(base in value) || !(index in value[base])) {
                return { value: null, parent };
            }
            parent = value[base];
            value = value[base][index];
        } else {
            if (!(comp in value)) {
                return { value: null, parent };
            }
            parent = value;
            value = value[comp];
        }
    }
    return { value, parent };
}

export async function fetchValue(cache: Map<string, any>, strapi: Strapi, node: UINode, mapping: MappingString, rawNodes: boolean = false): Promise<any> {
    const operator = mapping.substring(0, 1);
    const path = mapping.substring(1);
    switch (operator) {
        case MappingAction.literal:
            try {
                return JSON.parse(path);
            } catch (e) {
                return path;
            }

        case MappingAction.valuePath:
            return JSON.parse(JSON.stringify(resolvePath(node, path.split('.')).value));

        case MappingAction.nodePath:
            const solved = resolvePath(node, path.split('.'));
            const fetched = solved.value;
            if (!rawNodes) {
                if (Array.isArray(fetched)) {
                    const value = [];
                    for (const n of fetched) {
                        if (n.visible) {
                            const exported = await exportNode(cache, strapi, n);
                            value.push(exported);
                        }
                    }
                    return value;
                } else if (fetched) {
                    if (fetched.visible) {
                        return await exportNode(cache, strapi, fetched);
                    }
                    return null;
                }
            }
            return fetched;

        case MappingAction.inherit:
            const spec = await strapi.getTypeSpec(path, cache);
            if (!spec) {
                return null;
            }
            return await _processSpec(cache, strapi, node, spec.mappings);

        case MappingAction.execute:
            return await execute(cache, strapi, node, path);

        case MappingAction.source:
            const components = path.split(MappingAction.source);
            const source: any = resolvePath(node, components[0].split('.')).value;
            const r = await fetchValue(cache, strapi, source, components[1] as MappingString);
            return r;

        default:
            throw `ERROR parsing - Unrecognized mapping operator [${operator}] for mapping ${mapping}`;
    }
}

function _isObject(val: any): boolean {
    return typeof val === 'object' && !Array.isArray(val) && val !== null;
}

async function _processSpec(cache: Map<string, any>, strapi: Strapi, node: UINode, spec: MappingSpec): Promise<any> {
    if (Array.isArray(spec)) {
        const result = [];
        for (const entry of spec) {
            if (typeof entry as any === 'string') {
                result.push(await fetchValue(cache, strapi, node, entry as MappingString));
            } else if (typeof entry as any === 'number' || entry === null || entry === true || entry === false) {
                result.push(entry);
            } else {
                result.push(await _processSpec(cache, strapi, node, entry as MappingSpec));
            }
        }
        return result;
    }

    const result: any = {};
    for (const key of Object.keys(spec)) {
        const entry: MappingEntry = spec[key];
        const keyPath = key.split('.');
        let base = result;
        let prop = keyPath.shift() as string;
        while (keyPath.length) {
            if (!_isObject(base[prop])) {
                base[prop] = {} as any;
            }
            base = base[prop];
            prop = keyPath.shift() as string;
        }

        let val;
        if (typeof entry as any === 'string') {
            val = await fetchValue(cache, strapi, node, entry as MappingString);
        } else if (typeof entry as any === 'number' || entry === null || entry === true || entry === false) {
            val = entry;
        } else {
            val = await _processSpec(cache, strapi, node, entry as MappingSpec);
        }

        if (_isObject(val) && _isObject(base[prop])) {
            base[prop] = Object.assign(base[prop], val);
        } else {
            base[prop] = val;
        }
    }
    return result;
}

function _getUserDataExport(node: UINode, type: string, userData: UserDataSpec | null) {
    if (!userData) {
        return null;
    }
    const withValues = getUserData(node, type, userData);
    const result: { [key: string]: any } = {};
    for (const key of Object.keys(userData)) {
        result[key] = withValues[key].value ?? withValues[key].default;
    }
    return result;
}

export async function getTypeSpec(type: string, node: UINode, strapi: Strapi, cache?: Map<string, any>, useDefaultCache: boolean = false): Promise<TypeSpec | null> {
    let typeData = await strapi.getTypeSpec(type, cache, useDefaultCache);
    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET') {
        const properties = node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' ? node.componentPropertyDefinitions : node.componentProperties;
        if (Object.keys(properties).length) {
            typeData = Object.assign({}, typeData, {
                mappings: {},
                userData: {},
            });

            // the userData could be null, so we need to initialize it
            typeData.userData = typeData.userData || {};

            for (let key in properties) {
                key = properties[key].type === 'VARIANT' ? `${key}#variant` : key;
                const [description, propertyId] = key.split(/#(?!.*#)/);
                // @ts-ignore
                typeData.userData[key] = {
                    description,
                    type: 'componentProperty',
                    key,
                    propertyId,
                }
            }
        }
    }
    return typeData;
}

function _overrideSource(spec: MappingSpec, source: string): MappingSpec {
    if (Array.isArray(spec)) {
        const result = [];
        for (const entry of spec) {
            if (typeof entry as any === 'string') {
                result.push(`${MappingAction.source}${source}${MappingAction.source}${entry}`);
            } else {
                result.push(_overrideSource(entry as MappingSpec, source));
            }
        }
        return result as MappingSpec;
    }

    const result: any = {};
    for (const key of Object.keys(spec)) {
        const entry: MappingEntry = spec[key];
        if (typeof entry as any === 'string') {
            result[key] = `${MappingAction.source}${source}${MappingAction.source}${entry}`;
        } else {
            result[key] = _overrideSource(entry as MappingSpec, source);
        }
    }
    return result;
}

export async function exportNode(cache: Map<string, any>, strapi: Strapi, node: UINode) {
    try {
        console.log(node);
        const type = getMetadata(node, LayerMetadata.widgetOverride) as string || figmaTypeToWidget(node);
        const spec = await getTypeSpec(type, node, strapi, cache);
        if (!spec) {
            return null;
        }

        // if the node is a component, add frame mappings spec to the `component` field
        if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
            const frameSpec = await getTypeSpec('Frame', { type: 'FRAME' } as any, strapi, cache);
            if (frameSpec) {
                switch (node.type) {
                    case 'COMPONENT':
                        spec.mappings = Object.assign(spec.mappings, {
                            type: '!figma-component',
                            componentType: `!${type}`,
                            defaultVariant: '!default',
                            variants: {
                                default: frameSpec.mappings
                            },
                        });
                        break;

                    case 'COMPONENT_SET':
                        Object.assign(frameSpec.mappings, {
                            variantProperties: '#variantProperties',
                        });
                        const variants: any = {};
                        for (let i = 0, n = node.children.length; i < n; ++i) {
                            variants[node.children[i].name] = _overrideSource(frameSpec.mappings, `children[${i}]`);
                        }
                        spec.mappings = Object.assign(spec.mappings, {
                            type: '!figma-component',
                            componentType: `!${type}`,
                            defaultVariant: '#defaultVariant.name',
                            variants,
                        });
                        break;
                }
            }
        }

        const result = await _processSpec(cache, strapi, node, spec.mappings);
        const userData = _getUserDataExport(node, type, spec.userData);
        if (userData) {
            result['__userData'] = userData;
        }

        // if the node is a component set the parent dimensions elements and the parent layout to null
        if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
            for (const key of Object.keys(result.variants)) {
                result.variants[key]['dimensions']['parent']['x'] = null;
                result.variants[key]['dimensions']['parent']['y'] = null;
                result.variants[key]['dimensions']['parent']['width'] = null;
                result.variants[key]['dimensions']['parent']['height'] = null;
                result.variants[key]['layout']['parent']['layoutMode'] = null;
            }
        }

        return result;
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function exportToFlutter(strapi: Strapi, node: UINode): Promise<any> {
    const cache = new Map<string, any>();
    return await exportNode(cache, strapi, node);
}

