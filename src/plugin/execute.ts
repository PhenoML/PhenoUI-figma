import {Strapi} from "./Strapi";
import {fetchValue, MappingString, resolvePath, UINode} from "./export";

const funcRegex = /([^(]+)\((.*)\)\s*$/;
const splitArgsRegex = /,(?![^()[\]]+[)\]])/;

const builtInMethods: { [key: string]: Function } = {
    hello: (subject: string) => {
        const r = `Hello ${subject}!`
        console.log(r);
        return r;
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
            return await builtInMethods[funcPath](...args);
        } else {
            const funcComps = funcPath.split('.');
            const solved = resolvePath(node, funcComps);
            return await solved.value.apply(solved.parent, args);
        }
    }
    return null;
}
