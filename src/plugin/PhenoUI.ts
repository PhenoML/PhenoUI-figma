
export class PhenoUI {
    constructor() {

    }

    printTypes(nodes: readonly SceneNode[]): void {
        for (const node of nodes) {
            console.log(node);
            console.log(`${node.name} => ${node.type}`);
            node as ComponentNode
        }
    }

    handleOpen(evt: RunEvent): void {
        console.log(evt);
        this.printTypes(figma.currentPage.selection);
    }

    sayHello(name: string) {
        console.log(`Hello from the plugin, ${name}!`);
    }

}
