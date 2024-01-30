import {UserDataSpec} from "../../Strapi";
import {getMetadata} from "../../metadata";
import {UINode} from "./export";

function _getComponentProperty(node: UINode, key: string) {
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

export function getUserData(node: UINode, type: string, userData: UserDataSpec) {
    for (const key of Object.keys(userData)) {
        const value = getMetadata(node, `${type}_${key}`);
        const data = userData[key];
        switch (data.type) {
            case 'number':
                data.value = parseFloat(value as string);
                break;

            case 'componentProperty':
                Object.assign(data, _getComponentProperty(node, data.key));
                if (data.valueType === 'VARIANT') {
                    data.options = _getVariantOptions(node, data.key);
                }
                break;

            default:
                data.value = value;
                break;
        }
    }

    return userData;
}