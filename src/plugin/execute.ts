import {Strapi, TypeSpec} from "./Strapi";
import {
    exportNode,
    fetchValue,
    figmaTypeToWidget,
    MappingAction,
    MappingEntry,
    MappingSpec,
    MappingString, processSpec,
    resolvePath,
    UINode
} from "./tools/export/export";

const funcRegex = /([^(]+)\((.*)\)\s*$/;
const splitArgsRegex = /,(?![^()[\]]+[)\]])/;

type ExecutionContext = {
    node: UINode,
    cache: Map<string, any>,
    strapi: Strapi,
}

const builtInMethods: { [key: string]: Function } = {
    hello: (context: ExecutionContext, subject: string) => {
        const r = `Hello ${subject}!`
        console.log(r);
        return r;
    },
    exportSVG: async (context: ExecutionContext, node: SceneNode) => {
        return await node.exportAsync({ format: 'SVG_STRING', useAbsoluteBounds: true });
    },
    exportPNG: async (context: ExecutionContext, node: SceneNode) => {
        const bytes = await node.exportAsync({ format: 'PNG', useAbsoluteBounds: true, constraint: { type: 'SCALE', value: 3 } });
        return figma.base64Encode(bytes);
    },
    exportJPEG: async (context: ExecutionContext, node: SceneNode) => {
        const bytes = await node.exportAsync({ format: 'JPG', useAbsoluteBounds: true, constraint: { type: 'SCALE', value: 3 } });
        return figma.base64Encode(bytes);
    },
    nativeType: (context: ExecutionContext, node: any) => figmaTypeToWidget(node),
    getVariants: async (context: ExecutionContext, node: FrameNode, baseSpec: TypeSpec) => {
        const variants: any = {};
        const mappings = Object.assign({}, baseSpec.mappings);
        for (let i = 0, n = node.children.length; i < n; ++i) {
            variants[node.children[i].name] = _overrideSource(mappings, `children[${i}]`);
        }
        return processSpec(context.cache, context.strapi, node, variants);
    },
    nodeAsType: async (context: ExecutionContext, node: UINode, type: string) => {
            return await exportNode(context.cache, context.strapi, node, type);
    }
}

export async function execute(cache: Map<string, any>, strapi: Strapi, node: UINode, instruction: string): Promise<any> {
    const components = funcRegex.exec(instruction);
    if (components) {
        const funcPath = components[1];
        const argsDefs = components[2].split(splitArgsRegex);
        const args = [];
        for (const def  of argsDefs) {
            if (def.trim()) {
                args.push(await fetchValue(cache, strapi, node, def.trim() as MappingString, true));
            }
        }

        if (funcPath in builtInMethods) {
            const context: ExecutionContext = {
                node,
                cache,
                strapi,
            }
            return await builtInMethods[funcPath](context, ...args);
        } else {
            const funcComps = funcPath.split('.');
            const solved = resolvePath(node, funcComps);
            if (solved) {
                return await solved.value.apply(solved.parent, args);
            }
        }
    }
    return null;
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
