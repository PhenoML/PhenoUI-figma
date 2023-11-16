import {MessageBus} from "../shared/MessageBus";
import {LayerScreen} from "./screens/LayerScreen";
import {render} from "lit-html";
import {AvailableScreens} from "../shared/AvailableScreens";
import {getStyles} from "./styles";

type ScreenData = {
    screen: AvailableScreens,
}

export class UIManager {
    root: HTMLElement;
    bus: MessageBus;

    // screens
    layer: LayerScreen = new LayerScreen();

    constructor(root: HTMLElement, bus: MessageBus) {
        this.root = root;
        this.bus = bus;
        this.bus.executors.push(this);
    }

    updateScreen(data: ScreenData) {
        switch (data.screen) {
            case AvailableScreens.layer:
                const template = [
                    ...getStyles(),
                    ...this.layer.updateTemplate(data as any, this.bus),
                ];
                render(template, this.root);
                break;
        }
    }
}