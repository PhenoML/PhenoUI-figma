import {MessageBus} from "../shared/MessageBus";
import {LayerMetadata, MetadataDefaults} from "../shared/Metadata";
import {showEmptyScreen, showErrorScreen, showLayerScreen, showLoginScreen} from "./screens";
import {UINode, exportToFlutter, findNode, figmaTypeToWidget} from "./export";
import {ForbiddenError, Strapi} from "./Strapi";
import { updateMetadata } from "./metadata";
import {ExportData, PerformLoginData, TypeListData, UpdateMetadataData} from "../shared/MessageBusTypes";

export class PhenoUI {
    api: PluginAPI;
    bus: MessageBus;
    strapi: Strapi;

    constructor(api: PluginAPI, bus: MessageBus) {
        this.api = api;
        this.bus = bus;
        this.bus.executors.push(this);

        this.strapi = new Strapi(this.api);

        this.setupLocalEvents();
    }

    isLoggedIn(): boolean {
        if (this.strapi.isLoggedIn()) {
            return true;
        }

        showLoginScreen(this.bus, this.api);
        return false;
    }

    setupLocalEvents(): void {
        this.api.on('run', evt => this.isLoggedIn() ? this.handleOpen(evt) : null);
        this.api.on('selectionchange', () => this.isLoggedIn() ? this.handleSelectionChange(this.api.currentPage.selection) : null);
        this.api.on('documentchange', evt => this.isLoggedIn() ? this.handleDocumentChange(this.api.currentPage.selection, evt.documentChanges) : null);
    }

    printTypes(nodes: readonly UINode[]): void {
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

    handleSelectionChange(selection: readonly UINode[]): void {
        this.printTypes(selection);
        if (selection.length > 1) {
            // multiple objects selected
            showErrorScreen(
                this.bus,
                'ERROR',
                'This plugin cannot work while multiple objects are selected. Please select a single object to continue.'
            );
        } else if (selection.length === 1) {
            // single object selected
            this._callLayerScreenUpdate(selection[0]);
        } else {
            // no object selected
            showEmptyScreen(this.bus);
        }
    }

    handleDocumentChange(selection: readonly UINode[], changes: DocumentChange[]): void {
        for (const change of changes) {
            if ('node' in change && selection.find(n => n.id === change.node.id)) {
                this.handleSelectionChange(selection);
                break;
            }
        }
    }

    async performLogin(data: PerformLoginData) {
        const success = await this.strapi.performLogin(this.bus, data.server, data.user, data.password);
        if (success) {
            this.handleSelectionChange(figma.currentPage.selection);
        }
    }

    updateMetadata(data: UpdateMetadataData) {
        const node = findNode(this.api, data.id);
        if (node) {
             updateMetadata(node, data.key, data.value);
        } else {
            // just ignore... this could happen because the message passing is async and so the node could be deleted before we get this message
            console.warn(`Node with id [${data.id}] could not be found to update its metadata`);
        }
    }

    async exportToFlutter(data: ExportData): Promise<any> {
        if (!this.isLoggedIn()) {
            return null;
        }

        return exportToFlutter(this.api, this.strapi, data.id);
    }

    async getTypeList(data: TypeListData): Promise<string[]> {
        if (!this.isLoggedIn()) {
            return [];
        }

        try {
            return this.strapi.getTypeList(data.search, data.limit);
        } catch (e: unknown) {
            if (e instanceof ForbiddenError) {
                showLoginScreen(this.bus, this.api, e.message);
            } else {
                showErrorScreen(this.bus, 'ERROR', (e as Error).message);
            }

            return [];
        }
    }

    _callLayerScreenUpdate(node: UINode): void {
        showLayerScreen(this.bus, {
            layer: {
                id: node.id,
                name: node.name,
                widgetDefault: figmaTypeToWidget(node),
                widgetOverride: node.getPluginData(LayerMetadata.widgetOverride),
            }
        });
    }

}
