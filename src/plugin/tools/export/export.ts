import {LayerMetadata} from "../../../shared/Metadata";
import {Strapi, TypeSpec, UserDataSpec} from "../../Strapi";
import {getMetadata} from "../../metadata";
import {execute} from "../../execute";
import {getUserData} from "./userdata";

export enum MappingAction {
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
export type MappingEntry = MappingSpecObj[keyof MappingSpecObj];
type MappingSpecArr = MappingEntry[];
export type MappingSpec = MappingSpecObj | MappingSpecArr;

export type UINode = DocumentNode | SceneNode | PageNode;

export function findNode(api: PluginAPI, id: string): UINode | null {
    if (id === api.root.id) {
        return api.root;
    } else if (id === api.currentPage.id || id === LayerMetadata.currentPage) {
        return api.currentPage;
    }
    return api.getNodeById(id) as (UINode | null);
}

export function findComponentOrInstance(node: UINode): UINode | null {
    if (node.type === 'COMPONENT') {
        if (node.parent && node.parent.type === 'COMPONENT_SET') {
            return node.parent as UINode;
        }
        return node;
    } else if (node.type === 'INSTANCE' || node.type === 'COMPONENT_SET') {
        return node as UINode;
    }

    if (node.parent) {
        return findComponentOrInstance(node.parent as UINode);
    }

    return null;
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
            if (!spec || rawNodes) {
                return spec;
            }
            return await processSpec(cache, strapi, node, spec.mappings);

        case MappingAction.execute:
            return await execute(cache, strapi, node, path);

        case MappingAction.source:
            const components = path.split(MappingAction.source);
            const source: any = resolvePath(node, components[0].split('.')).value;
            return await fetchValue(cache, strapi, source, components[1] as MappingString);

        default:
            throw `ERROR parsing - Unrecognized mapping operator [${operator}] for mapping ${mapping}`;
    }
}

function _isObject(val: any): boolean {
    return typeof val === 'object' && !Array.isArray(val) && val !== null;
}

export async function processSpec(cache: Map<string, any>, strapi: Strapi, node: UINode, spec: MappingSpec): Promise<any> {
    if (Array.isArray(spec)) {
        const result = [];
        for (const entry of spec) {
            if (typeof entry as any === 'string') {
                result.push(await fetchValue(cache, strapi, node, entry as MappingString));
            } else if (typeof entry as any === 'number' || entry === null || entry === true || entry === false) {
                result.push(entry);
            } else {
                result.push(await processSpec(cache, strapi, node, entry as MappingSpec));
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
            val = await processSpec(cache, strapi, node, entry as MappingSpec);
        }

        if (_isObject(val) && _isObject(base[prop])) {
            base[prop] = Object.assign({}, base[prop], val);
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
        const entry = withValues[key];
        result[key] = entry.value;
        if (result[key] === '' || result[key] === null || result[key] === undefined) {
            result[key] = entry.default;
            if (entry.type === 'group') {
                result[key] = {
                    type: 'group',
                    properties: result[key] || [],
                }
            } else if (entry.type === 'union') {
                const fields = entry.fields;
                const fieldKeys = Object.keys(fields);
                const fieldValues = fieldKeys.map(k => ({ [k]: fields[k].value ?? fields[k].default }));
                result[key] = {
                    type: 'union',
                    fields: Object.assign({}, ...fieldValues),
                }
                console.log('Union', result[key]);
            }
        }
    }
    return result;
}

export async function getTypeSpec(type: string, node: UINode, strapi: Strapi, cache?: Map<string, any>, useDefaultCache: boolean = false): Promise<TypeSpec | null> {
    let typeData = await strapi.getTypeSpec(type, cache, useDefaultCache);
    if (!typeData && (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET')) {
        let componentType: string;
        switch (node.type) {
            case 'COMPONENT':
                componentType = 'FigmaComponent';
                break;

            case 'COMPONENT_SET':
                componentType = 'FigmaComponentSet';
                break;

            default:
                componentType = 'FigmaComponentInstance';
                break;
        }

        typeData = await strapi.getTypeSpec(componentType, cache, useDefaultCache);
    } else if (!typeData) {
        typeData = await strapi.getTypeSpec('_missing_type', cache, useDefaultCache);
        if (typeData) {
            typeData.mappings = [
                `@${figmaTypeToWidget(node)}`,
                {
                    type: `!${type}`
                }
            ];
            await strapi.resolveSpecMappings(typeData, cache, useDefaultCache);
        }
    }

    if (typeData && (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET')) {
        const componentProps: UserDataSpec = _findComponentPropertiesRecursive(node);

        // if the node has a component parent, add a boolean property to allow the user to override the component's
        // properties via the parent
        const baseComponent = findComponentOrInstance(node);
        if (baseComponent && baseComponent.parent) {
            const parentComponent = findComponentOrInstance(baseComponent.parent as UINode);
            if (parentComponent && parentComponent.id !== baseComponent.id) {
                componentProps['overrideComponentProperties'] = {
                    type: 'boolean',
                    default: true,
                    description: 'Use ancestors properties',
                };
            }
        }

        typeData.userData = Object.assign({}, typeData.userData, componentProps);
    }
    return typeData;
}

function _findComponentPropertiesRecursive(node: UINode): UserDataSpec {
    const componentProps: UserDataSpec = {};

    if (node.type === 'COMPONENT' || node.type === 'INSTANCE' || node.type === 'COMPONENT_SET') {
        const properties = node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' ? node.componentPropertyDefinitions : node.componentProperties;
        for (let key in properties) {
            key = properties[key].type === 'VARIANT' ? `${key}#variant` : key;
            const [description, propertyId] = key.split(/#(?!.*#)/);
            componentProps[key] = {
                description,
                type: 'componentProperty',
                key,
                nodeId: node.id,
                propertyId,
            }
        }
    }
    if (node.type !== 'COMPONENT_SET' && 'children' in node) {
        for (const child of node.children) {
            const childProps = _findComponentPropertiesRecursive(child as UINode);
            if (Object.keys(childProps).length) {
                // only assign the child properties if they are not already defined
                for (const key of Object.keys(childProps)) {
                    if (!(key in componentProps)) {
                        componentProps[key] = childProps[key];
                    }
                }
            }
        }
    }
    return componentProps;
}

export async function exportNode(cache: Map<string, any>, strapi: Strapi, node: UINode, overrideType?: string) {
    try {
        const type = overrideType || getMetadata(node, LayerMetadata.widgetOverride) as string || figmaTypeToWidget(node);
        const spec = await getTypeSpec(type, node, strapi, cache);
        if (!spec) {
            return null;
        }

        let result = await processSpec(cache, strapi, node, spec.mappings);
        // if the result is an array, merge all the objects in order
        if (Array.isArray(result)) {
            result = Object.assign({}, ...result);
        }

        const infoSpec = await getTypeSpec('__info', { type: 'FRAME' } as any, strapi, cache) as TypeSpec;
        result['__info'] = await processSpec(cache, strapi, node, infoSpec.mappings);

        const userData = _getUserDataExport(node, type, spec.userData);
        if (userData) {
            result['__userData'] = userData;
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

function _exportValue(value: any, cache: Set<BaseNode>): any {
    // if it's a null, string, number, or boolean, just return it
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    // if it's an array, export each value
    if (Array.isArray(value)) {
        return value.map(v => _exportValue(v, cache));
    }



    // if it's an object, export each value
    if (typeof value === 'object') {
        const result: any = {};
        if ('type' in value && typeof value.type === 'string') {
            if (cache.has(value)) {
                return value.id;
            }
            cache.add(value);
            for (const key in value) {
                if (key === 'parent' || key === 'mainComponent' || key === 'masterComponent') {
                    result[key] = value[key].id;
                } else if (key === 'defaultVariant') {
                    result[key] = {
                        id: value[key].id,
                        name: value[key].name,
                    };
                } else {
                    try {
                        result[key] = _exportValue(value[key], cache);
                    } catch (_) {
                        result[key] = null;
                    }
                }
            }
        } else {
            for (const key of Object.keys(value)) {
                result[key] = _exportValue(value[key], cache);
            }
        }
        return result;
    }

    return null;
}

export function exportRawJson(node: UINode): any {
    try {
        const cache: Set<BaseNode> = new Set();
        return _exportValue(node, cache);
    } catch (e) {
        console.log(e);
        return null;
    }
}

