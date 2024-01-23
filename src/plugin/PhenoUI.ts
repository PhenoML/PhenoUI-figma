import {MessageBus} from "../shared/MessageBus";
import {LayerMetadata} from "../shared/Metadata";
import {
    showEmptyScreen,
    showErrorScreen, showGithubLoginScreen,
    showLayerScreen,
    showStrapiLoginScreen
} from "./screens";
import {UINode, exportToFlutter, findNode, figmaTypeToWidget, getUserData, getTypeSpec} from "./export";
import {ForbiddenError, Strapi} from "./Strapi";
import {getMetadata, updateMetadata} from "./metadata";
import {
    ExportData,
    PerformStrapiLoginData,
    TypeListData,
    UpdateMetadataData,
    UploadData,
    GetMetadataData,
    SetTabData, CategoryData
} from "../shared/MessageBusTypes";
import {AvailableTabs} from "../shared/AvailableTabs";

export class PhenoUI {
    api: PluginAPI;
    bus: MessageBus;
    strapi: Strapi;
    tab: AvailableTabs = AvailableTabs.figma;

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

        showStrapiLoginScreen(this.bus, this.api);
        return false;
    }

    setupLocalEvents(): void {
        this.api.on('run', evt => this.isLoggedIn() ? this.handleOpen(evt) : null);
        this.api.on('selectionchange', () => this.isLoggedIn() ? this.handleSelectionChange(this.api.currentPage.selection) : null);
        // future Dario... there are some changes we want to look for, like name changes, etc. I think that the best way
        // to fix this is to make a method that updates the layer data without querying strapi for updates triggered by
        // figma, and hit strapi for user triggered events. Another option could be to explicitly allow users to decide
        // when to update the strapi data (via a refresh button or similar). I do think this is the best UX option.
        // future future Dario... for now simply update the data without hitting strapi
        this.api.on('documentchange', evt => this.isLoggedIn() ? this.handleDocumentChange(this.api.currentPage.selection, evt.documentChanges, true) : null);
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
            } else if (node.type === 'TEXT') {
                console.log(node.getStyledTextSegments([
                    'fontSize',
                    'fontName',
                    'fontWeight',
                    'textDecoration',
                    'textCase',
                    'lineHeight',
                    'letterSpacing',
                    'fills',
                    'listOptions',
                    'indentation',
                    'hyperlink',
                ]));
            } else if (node.type === 'INSTANCE') {
                console.log(node.componentProperties);
            }
        }
    }

    handleOpen(evt: RunEvent): void {
        this.handleSelectionChange(figma.currentPage.selection);
    }

    handleSelectionChange(selection: readonly UINode[], useDefaultCache: boolean = false): void {
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
            this._callLayerScreenUpdate(selection[0], useDefaultCache);
        } else {
            // no object selected
            showEmptyScreen(this.bus);
        }
    }

    handleDocumentChange(selection: readonly UINode[], changes: DocumentChange[], useDefaultCache: boolean = false): void {
        for (const change of changes) {
            if (change.origin === 'LOCAL' && change.type === 'PROPERTY_CHANGE' && change.properties.length === 1 && change.properties[0] === 'pluginData') {
                continue;
            }

            if ('node' in change && selection.find(n => n.id === change.node.id)) {
                this.handleSelectionChange(selection, useDefaultCache);
                break;
            }
        }
    }

    async performStrapiLogin(data: PerformStrapiLoginData) {
        const success = await this.strapi.performLogin(this.bus, data.server, data.user, data.password);
        if (success) {
            this.handleSelectionChange(figma.currentPage.selection);
        }
    }

    updateMetadata(data: UpdateMetadataData) {
        const node = data.id === null ? this.api.root : findNode(this.api, data.id);
        if (node) {
             updateMetadata(node, data.key, data.value);
        } else {
            // just ignore... this could happen because the message passing is async and so the node could be deleted before we get this message
            console.warn(`Node with id [${data.id}] could not be found to update its metadata`);
        }
    }

    updateComponentProperty(data: UpdateMetadataData) {
        const node = data.id === null ? this.api.root : findNode(this.api, data.id);
        if (node) {
            if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
                node.editComponentProperty(data.key, { defaultValue: data.value as string | boolean });
            } else if (node.type === 'INSTANCE') {
                node.setProperties({[data.key]: data.value as string | boolean});
            } else {
                console.warn(`Node with id [${data.id}] is not a component or instance and so it cannot have component properties`);
            }
        } else {
            // just ignore... this could happen because the message passing is async and so the node could be deleted before we get this message
            console.warn(`Node with id [${data.id}] could not be found to update its component property`);
        }
    }

    async setTab(data: SetTabData) {
        if (data.tab !== this.tab) {
            this.tab = data.tab;
            if (this.tab === AvailableTabs.github) {
                const loggedIn = await this.bus.execute('isGithubLoggedIn', undefined);
                if (!loggedIn) {
                    showGithubLoginScreen(this.bus, this.api);
                    return;
                }
            }
            this.handleSelectionChange(figma.currentPage.selection);
        }
    }

    strapiLogout() {
        this.strapi.logout();
        this.handleSelectionChange(figma.currentPage.selection);
    }

    getMetadata(data: GetMetadataData): string | number | boolean | null {
        const node = data.id === null ? this.api.root : findNode(this.api, data.id);
        if (node) {
            return getMetadata(node, data.key);
        } else {
            // just ignore... this could happen because the message passing is async and so the node could be deleted before we get this message
            console.warn(`Node with id [${data.id}] could not be found to get its metadata`);
            return null;
        }
    }

    updateLayerView() {
        this.handleSelectionChange(figma.currentPage.selection);
    }

    async exportToFlutter(data: ExportData): Promise<any> {
        if (!this.isLoggedIn()) {
            return null;
        }

        const node = findNode(this.api, data.id);
        if (!node) {
            throw new Error(`Could not find node with ID [${data.id}] for export.`);
        }

        return exportToFlutter(this.strapi, node);
    }

    async uploadToStrapi(data: UploadData) {
        await this.strapi.uploadData(data.collection, data.payload);
    }

    async getCategory(data: CategoryData) {
        return await this.strapi.getCategory(data.collection, data.uid);
    }

    async createCategory(data: CategoryData) {
        return await this.strapi.createCategory(data.collection, data.uid);
    }

    async getTypeList(data: TypeListData): Promise<string[]> {
        if (!this.isLoggedIn()) {
            return [];
        }

        try {
            return this.strapi.getTypeList(data.search, data.limit);
        } catch (e: unknown) {
            if (e instanceof ForbiddenError) {
                showStrapiLoginScreen(this.bus, this.api, e.message);
            } else {
                showErrorScreen(this.bus, 'ERROR', (e as Error).message);
            }

            return [];
        }
    }

    async _callLayerScreenUpdate(node: UINode, useDefaultCache: boolean = false): Promise<void> {
        const defaultType = figmaTypeToWidget(node);
        const customType = getMetadata(node, LayerMetadata.widgetOverride) as string;
        const type = customType || defaultType;

        try {
            let typeData = await getTypeSpec(type, node, this.strapi, undefined, useDefaultCache);

            if (typeData && typeData.userData) {
                typeData.userData = getUserData(node, type, typeData.userData);
            }

            showLayerScreen(this.bus, {
                layer: {
                    id: node.id,
                    name: node.name,
                    widgetDefault: defaultType,
                    widgetOverride: customType,
                    typeData,
                    exportable: Boolean((node.parent && node.parent.type === 'PAGE') || node.type === 'COMPONENT' || node.type === 'COMPONENT_SET'),
                }
            }, this.tab);
        } catch (e: unknown) {
            if (e instanceof ForbiddenError) {
                showStrapiLoginScreen(this.bus, this.api, e.message);
            } else {
                showErrorScreen(this.bus, 'ERROR', (e as Error).message);
            }
        }
    }

}
