import {MessageBus} from "../shared/MessageBus";
import {LayerScreen} from "./screens/figma/LayerScreen";
import {html, render, RootPart, TemplateResult} from "lit-html";
import {AvailableScreens} from "../shared/AvailableScreens";
import {getStyles} from "./styles";
import {EmptyScreen} from "./screens/EmptyScreen";
import {Screen} from "./screens/Screen";
import {ErrorScreen} from "./screens/ErrorScreen";
import {LoginScreen} from "./screens/strapi/LoginScreen";
import {LoadingScreen} from "./screens/LoadingScreen";

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
        this.screens.set(AvailableScreens.error, new ErrorScreen(this));
        this.screens.set(AvailableScreens.login, new LoginScreen(this));
        this.screens.set(AvailableScreens.empty, new EmptyScreen(this));
        this.screens.set(AvailableScreens.layer, new LayerScreen(this));
        this.screens.set(AvailableScreens.loading, new LoadingScreen(this));
    }

    _getScreen(screen: AvailableScreens): Screen {
        if (this.screens.has(screen)) {
            return this.screens.get(screen) as Screen;
        }
        return this.screens.get(AvailableScreens.error) as Screen;
    }

    render(template: TemplateResult[], root: HTMLElement) {
        return render(html`
            ${getStyles()}
            <main>
                ${template}
            </main>
        `, root);
    }

    renderScreen(screen: Screen, root: HTMLElement) {
        const part = this.render(screen.template as TemplateResult[], root);
        screen.renderComplete(part.parentNode as HTMLElement);
    }

    updateScreen(data: ScreenData) {
        const screen = this._getScreen(data.screen);
        screen.updateTemplate(data, this.bus)
        this.renderScreen(screen, this.root);
    }
}