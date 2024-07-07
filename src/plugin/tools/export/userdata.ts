import {PropertyBinding, UserDataSpec} from "../../Strapi";
import {getMetadata} from "../../metadata";
import {findNode, UINode} from "./export";

export function getComponentProperty(node: UINode, key: string) {
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        const k = node.componentPropertyDefinitions[key] ? key : key.split(/#(?!.*#)/)[0];
        if (node.componentPropertyDefinitions[k]) {
            return {
                value: node.componentPropertyDefinitions[k].defaultValue,
                valueType: node.componentPropertyDefinitions[k].type,
            };
        }
    } else {
        const instanceNode = node as InstanceNode;
        const k = instanceNode.componentProperties[key] ? key : key.split(/#(?!.*#)/)[0];
        if (instanceNode.componentProperties[k]) {
            return {
                value: instanceNode.componentProperties[k].value,
                valueType: instanceNode.componentProperties[k].type,
            };
        }
    }
    return undefined;
}

function _getVariantOptions(node: UINode, key: string) {
    let componentNode: any = node;
    while (componentNode.type !== 'COMPONENT_SET' && componentNode.parent) {
        if ('mainComponent' in componentNode) {
            componentNode = componentNode.mainComponent;
        } else {
            componentNode = componentNode.parent;
        }
    }
    if (componentNode) {
        const k = componentNode.componentPropertyDefinitions[key] ? key : key.split(/#(?!.*#)/)[0];
        const variantOptions = componentNode.componentPropertyDefinitions[k].variantOptions;
        if (variantOptions) {
            const options = [];
            for (const option of variantOptions) {
                options.push({
                    value: option,
                    label: option,
                });
            }
            return options;
        }
    }
    return [];

}

export function getUserData(node: UINode, type: string, userData: UserDataSpec, parentType?: string) {
    for (const key of Object.keys(userData)) {
        // skip the layout object
        // sorry future Dario, this is a hack and should probably be switched to use a dedicated field in strapi
        if (key === '__layout__') {
            continue;
        }

        const valueKey = parentType ? `${type}_${parentType}_${key}` : `${type}_${key}`;
        const value = getMetadata(node, valueKey);
        // make a copy of the object to avoid overwriting the original one
        userData[key] = Object.assign({}, userData[key]);
        const data = userData[key];
        switch (data.type) {
            case 'number':
                if (typeof value === 'string') {
                    if (Boolean(value)) {
                        data.value = parseFloat(value as string);
                    }
                } else {
                    data.value = value as number;
                }
                break;

            case 'componentProperty':
                const propNode = findNode(figma, data.nodeId);
                if (propNode) {
                    Object.assign(data, getComponentProperty(propNode, data.key));
                    if (data.valueType === 'VARIANT') {
                        data.options = _getVariantOptions(propNode, data.key);
                    }
                }
                break;

            case 'union':
                data.fields = getUserData(node, type, data.fields, parentType ? `${parentType}_${key}` : key);
                break;

            default:
                data.value = value as string | boolean | PropertyBinding;
                break;
        }
    }

    return userData;
}