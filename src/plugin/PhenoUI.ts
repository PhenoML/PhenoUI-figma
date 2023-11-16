import {MessageBus} from "../shared/MessageBus";
import {AvailableScreens} from "../shared/AvailableScreens";
import {LayerMetadata} from "../shared/Metadata";

export class PhenoUI {
    api: PluginAPI;
    bus: MessageBus;

    constructor(api: PluginAPI, bus: MessageBus) {
        this.api = api;
        this.bus = bus;
        this.bus.executors.push(this);
        this.setupLocalEvents();
    }

    setupLocalEvents(): void {
        this.api.on('run', evt => this.handleOpen(evt));
        this.api.on('selectionchange', () => this.handleSelectionChange(this.api.currentPage.selection));
        this.api.on('documentchange', evt => this.handleDocumentChange(this.api.currentPage.selection, evt.documentChanges));
    }

    printTypes(nodes: readonly SceneNode[]): void {
        for (const node of nodes) {
            console.log(node);
            console.log(`${node.name} => ${node.type}`);
            if (node.type === 'FRAME') {
                for (const key in node) {
                    if (key.toLowerCase().includes('layout')) {
                        console.log(`\t${key} => `, (node as any)[key]);
                    }
                }
            }
        }
    }

    handleOpen(evt: RunEvent): void {
        this.handleSelectionChange(figma.currentPage.selection);

    }

    handleSelectionChange(selection: readonly SceneNode[]): void {
        this.printTypes(selection);
        if (selection.length > 1) {
            // multiple objects selected
        } else if (selection.length === 1) {
            // single object selected
            this._callLayerScreenUpdate(selection[0]);
        } else {
            // no object selected
        }
    }

    handleDocumentChange(selection: readonly SceneNode[], changes: DocumentChange[]): void {
        for (const change of changes) {
            if ('node' in change && selection.find(n => n.id === change.node.id)) {
                this.handleSelectionChange(selection);
                break;
            }
        }
    }

    updateMetadata(id: string, key: string, value: any) {
        console.log('updateMetadata', key, value);
        const node = this.api.currentPage.findOne(n => n.id === id);
        if (node) {
             this._updateMetadata(node, key, value);
        } else {
            // just ignore... this could happen because the message passing is async and so the node could be deleted before we get this message
            console.warn(`Node with id [${id}] could not be found to update its metadata`);
        }
    }

    _updateMetadata(node: SceneNode, key: string, value: any) {
        if (!node.getPluginData(key)) {
            node.setRelaunchData({ open: ''});
        }
        node.setPluginData(key, value);
    }

    _figmaTypeToWidget(node: SceneNode): string {
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

    _callLayerScreenUpdate(node: SceneNode): void {
        const data = {
            screen: AvailableScreens.layer,
            layer: {
                id: node.id,
                name: node.name,
                widgetDefault: this._figmaTypeToWidget(node),
                widgetOverride: node.getPluginData(LayerMetadata.widgetOverride),
            }
        }

        this.bus.execute('updateScreen', data);
    }

}
