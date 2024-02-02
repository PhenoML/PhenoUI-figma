import {AvailableScreens} from "../shared/AvailableScreens";
import {MessageBus} from "../shared/MessageBus";
import {LayerMetadata} from "../shared/Metadata";
import {getLocalData, getMetadata} from "./metadata";
import {LayerScreenData} from "../shared/MessageBusTypes";
import {AvailableTabs} from "../shared/AvailableTabs";
import {LayerData} from "../ui/tools/layer";

export function showEmptyScreen(bus: MessageBus) {
    bus.execute('updateScreen', { screen: AvailableScreens.empty });
}

export function showErrorScreen(bus: MessageBus, title: string, description: string) {
    bus.execute('updateScreen', {
        screen: AvailableScreens.error,
        error: {
            title,
            description,
        }
    });
}

export async function showStrapiLoginScreen(bus: MessageBus, api: PluginAPI, error?: string) {
    bus.execute('updateScreen', {
        screen: AvailableScreens.strapi_login,
        credentials: {
            id: api.root.id,
            server: await getLocalData(LayerMetadata.strapiServer) as string,
            user: await getLocalData(LayerMetadata.strapiUser) as string,
            error,
        }
    });
}

export function showGithubLoginScreen(bus: MessageBus, api: PluginAPI, error?: string) {
    const node = api.currentPage.selection[0];
    bus.execute('updateScreen', {
        screen: AvailableScreens.github_login,
        credentials: {
            id: api.root.id,
            layerName: node.name,
            error,
        },
    });
}

function _tabToLayerScreen(tab: AvailableTabs): AvailableScreens {
    switch (tab) {
        case AvailableTabs.figma:
            return AvailableScreens.figma_layer;
        case AvailableTabs.github:
            return AvailableScreens.github_layer;
        case AvailableTabs.strapi:
            return AvailableScreens.strapi_layer;
    }
}

export function showLayerScreen(bus: MessageBus, data: LayerData, tab: AvailableTabs) {

    bus.execute('updateScreen', Object.assign({ screen: _tabToLayerScreen(tab) }, data) as LayerScreenData);
}

