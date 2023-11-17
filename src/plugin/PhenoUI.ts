import {MessageBus} from "../shared/MessageBus";
import {AvailableScreens} from "../shared/AvailableScreens";
import {LayerMetadata, MetadataDefaults} from "../shared/Metadata";

type UINode = DocumentNode | SceneNode;

export class PhenoUI {
    api: PluginAPI;
    bus: MessageBus;
    strapiJWT?: string;

    constructor(api: PluginAPI, bus: MessageBus) {
        this.api = api;
        this.bus = bus;
        this.bus.executors.push(this);

        this.strapiJWT = this.api.root.getPluginData(LayerMetadata.strapiJWT);

        this.setupLocalEvents();
    }

    isLoggedIn(): boolean {
        if (this.strapiJWT) {
            return true;
        }

        this.showLoginScreen();
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
            this.bus.execute('updateScreen', {
                screen: AvailableScreens.error,
                error: {
                    title: 'ERROR',
                    description: 'This plugin cannot work while multiple objects are selected. Please select a single object to continue.',
                }
            });
        } else if (selection.length === 1) {
            // single object selected
            this._callLayerScreenUpdate(selection[0]);
        } else {
            // no object selected
            this.bus.execute('updateScreen', { screen: AvailableScreens.empty });
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

    showLoginScreen(error?: string) {
        this.bus.execute('updateScreen', {
            screen: AvailableScreens.login,
            credentials: {
                id: this.api.root.id,
                server: this.api.root.getPluginData(LayerMetadata.strapiServer),
                user: this.api.root.getPluginData(LayerMetadata.strapiUser),
                error,
            }
        });
    }

    async performLogin(server: string, user: string, password: string) {
        if (user && password) {
            server = server.trim() || MetadataDefaults[LayerMetadata.strapiServer];
            const url = `${server.endsWith('/') ? server.substring(0, server.length - 1) : server}/api/auth/local`;
            console.log(url);
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({identifier: user, password}),
                });

                const result = await response.json();
                if (result.jwt) {
                    this.strapiJWT = result.jwt;
                    this._updateMetadata(this.api.root, LayerMetadata.strapiJWT, this.strapiJWT);
                    this.handleSelectionChange(figma.currentPage.selection);
                }else if (result.error) {
                    this.showLoginScreen(result.error.message);
                } else {
                    this.showLoginScreen('UNKNOWN ERROR, CONTACT DARIO!');
                }
            } catch (e: any) {
                this.showLoginScreen(`ERROR contacting server: ${e.message}`);
            }
        } else {
            this.showLoginScreen('Please enter all the required fields');
        }
    }

    updateMetadata(id: string, key: string, value: any) {
        console.log('updateMetadata', key, value);
        const node = this._findNode(id);
        if (node) {
             this._updateMetadata(node, key, value);
        } else {
            // just ignore... this could happen because the message passing is async and so the node could be deleted before we get this message
            console.warn(`Node with id [${id}] could not be found to update its metadata`);
        }
    }

    async exportToFlutter(id: string): Promise<any> {
        if (!this.isLoggedIn()) {
            return null;
        }

        const node = this._findNode(id);
        if (!node) {
            this.bus.execute('updateScreen', {
                screen: AvailableScreens.error,
                error: {
                    title: 'ERROR',
                    description: `Could not find node with ID [${id}] for export.`,
                }
            });
            return null;
        }

        return await this._exportNode(node);
    }

    async _exportNode(node: UINode): Promise<any> {
        const type = node.getPluginData(LayerMetadata.widgetOverride) || this._figmaTypeToWidget(node);
        
    }

    _findNode(id: string): UINode | null {
        if (id === this.api.root.id) {
            return this.api.root;
        }
        return this.api.currentPage.findOne(n => n.id === id);
    }

    _updateMetadata(node: UINode, key: string, value: any) {
        if (!node.getPluginData(key)) {
            node.setRelaunchData({ open: ''});
        }
        node.setPluginData(key, value);
    }

    _figmaTypeToWidget(node: UINode): string {
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

    _callLayerScreenUpdate(node: UINode): void {
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
