import {AvailableScreens} from "../shared/AvailableScreens";
import {MessageBus} from "../shared/MessageBus";
import {LayerMetadata} from "../shared/Metadata";
import {LayerData} from "../ui/screens/LayerScreen";
import {LayerScreenData} from "../shared/MessageBusTypes";

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

export function showLoginScreen(bus: MessageBus, api: PluginAPI, error?: string) {
    bus.execute('updateScreen', {
        screen: AvailableScreens.login,
        credentials: {
            id: api.root.id,
            server: api.root.getPluginData(LayerMetadata.strapiServer),
            user: api.root.getPluginData(LayerMetadata.strapiUser),
            error,
        }
    });
}

export function showLayerScreen(bus: MessageBus, data: LayerData) {
    bus.execute('updateScreen', Object.assign({ screen: AvailableScreens.layer }, data) as LayerScreenData);
}

