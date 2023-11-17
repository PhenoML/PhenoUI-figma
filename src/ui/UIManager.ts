import {MessageBus} from "../shared/MessageBus";
import {LayerScreen} from "./screens/LayerScreen";
import {html, render, TemplateResult} from "lit-html";
import {AvailableScreens} from "../shared/AvailableScreens";
import {getStyles} from "./styles";
import {EmptyScreen} from "./screens/EmptyScreen";
import {Screen} from "./screens/Screen";

type ScreenData = {
    screen: AvailableScreens,
}

export class UIManager {
    root: HTMLElement;
    bus: MessageBus;

    // screens
    screens: Map<AvailableScreens, Screen> = new Map();

    constructor(root: HTMLElement, bus: MessageBus) {
        this.root = root;
        this.bus = bus;
        this.bus.executors.push(this);
        this._initScreens();
    }

    _initScreens() {
        this.screens.set(AvailableScreens.error, {} as Screen);
        this.screens.set(AvailableScreens.empty, new EmptyScreen());
        this.screens.set(AvailableScreens.layer, new LayerScreen());
    }

    _getScreen(screen: AvailableScreens): Screen {
        if (this.screens.has(screen)) {
            return this.screens.get(screen) as Screen;
        }
        return this.screens.get(AvailableScreens.error) as Screen;
    }

    render(template: TemplateResult[], root: HTMLElement) {
        render(html`
            ${getStyles()}
            <main>
                ${template}
            </main>
        `, root);
    }

    updateScreen(data: ScreenData) {
        const screen = this._getScreen(data.screen);
        this.render(screen.updateTemplate(data, this.bus), this.root);
    }
}