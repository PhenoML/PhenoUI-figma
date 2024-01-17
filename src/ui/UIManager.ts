import {MessageBus} from "../shared/MessageBus";
import {LayerScreen as FigmaLayerScreen} from "./screens/figma/LayerScreen";
import {LayerScreen as StrapiLayerScreen} from "./screens/strapi/LayerScreen";
import {LayerScreen as GithubLayerScreen} from "./screens/github/LayerScreen";
import {html, render, RootPart, TemplateResult} from "lit-html";
import {AvailableScreens} from "../shared/AvailableScreens";
import {getStyles} from "./styles";
import {EmptyScreen} from "./screens/EmptyScreen";
import {Screen} from "./screens/Screen";
import {ErrorScreen} from "./screens/ErrorScreen";
import {LoginScreen as StrapiLoginScreen} from "./screens/strapi/LoginScreen";
import {LoginScreen as GithubLoginScreen} from "./screens/github/LoginScreen";
import {LoadingScreen} from "./screens/LoadingScreen";

import {Github} from './Github';

type ScreenData = {
    screen: AvailableScreens,
}

export class UIManager {
    root: HTMLElement;
    bus: MessageBus;
    github: Github;

    // screens
    screens: Map<AvailableScreens, Screen> = new Map();

    constructor(root: HTMLElement, bus: MessageBus) {
        this.root = root;
        this.bus = bus;
        this.github = new Github(bus);
        this.bus.executors.push(this);
        this._initScreens();
    }

    _initScreens() {
        this.screens.set(AvailableScreens.error, new ErrorScreen(this));
        this.screens.set(AvailableScreens.strapi_login, new StrapiLoginScreen(this));
        this.screens.set(AvailableScreens.github_login, new GithubLoginScreen(this));
        this.screens.set(AvailableScreens.empty, new EmptyScreen(this));
        this.screens.set(AvailableScreens.figma_layer, new FigmaLayerScreen(this));
        this.screens.set(AvailableScreens.strapi_layer, new StrapiLayerScreen(this));
        this.screens.set(AvailableScreens.github_layer, new GithubLayerScreen(this));
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

    async isGithubLoggedIn() {
        return await this.github.isLoggedIn;
    }
}