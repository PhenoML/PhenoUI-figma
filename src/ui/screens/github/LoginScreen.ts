import {Screen} from "../Screen";
import {html, nothing, TemplateResult} from "lit-html";
import {MessageBus} from "../../../shared/MessageBus";
import {button} from "../../widgets/button";
import {getHeader} from '../../widgets/header';
import {AvailableTabs} from "../../../shared/AvailableTabs";
import {LayerData} from "../../tools/layer";
import {passwordInput} from "../../widgets/input";
import {AvailableScreens} from "../../../shared/AvailableScreens";
import {ScreenData} from "../../../shared/MessageBusTypes";

export type GithubLoginData = {
    credentials: {
        id: string,
        layerName: string,
        error?: string,
    }
};

export class LoginScreen extends Screen {
    working: boolean = false;
    updateTemplate(data: GithubLoginData, bus: MessageBus): TemplateResult[] {
        const template = html`
            ${getHeader(data.credentials.layerName, AvailableTabs.github, bus)}
            <section>
                <div class="row">
                    <div class="text-container bold">Please login:</div>
                </div>
                <div class="row">
                    ${passwordInput({
                        id: 'github-access-token',
                        label: 'access token',
                        icon: 'A',
                        placeholder: 'access token',
                    })}
                </div>
            </section>
            <section>
                <div class="row-full">
                    <div class="container">
                        ${button({
                            id: data.credentials.id,
                            label: 'Login',
                            onClick: async (id: string) => await this._login(id, bus, data),
                        })}
                    </div>
                </div>
                <div class="row">
                    ${data.credentials.error ? html`<div class="error-description">${data.credentials.error}</div>` : nothing}
                </div>
            </section>
        `;

        this.template = [template];

        return this.template;
    }

    async _login(_: string, bus: MessageBus, data: GithubLoginData) {
        if (!this.working) {
            this.working = true;
            try {
                const tokenElement = document.getElementById('github-access-token');
                const token = (tokenElement as HTMLInputElement).value;

                const loading = this._manager._getScreen(AvailableScreens.loading);
                this._manager.renderScreen(loading, this._manager.root);

                const success = await this._manager.github.login(token);
                if (success) {
                    await bus.execute('updateLayerView', undefined);
                } else {
                    this._manager.updateScreen({
                        screen: AvailableScreens.github_login,
                        credentials: {
                            id: data.credentials.id,
                            layerName: data.credentials.layerName,
                            error: 'Invalid access token',
                        }
                    } as ScreenData);
                }
            } catch (e: any) {
                this._manager.updateScreen({
                    screen: AvailableScreens.github_login,
                    credentials: {
                        id: data.credentials.id,
                        layerName: data.credentials.layerName,
                        error: e.message,
                    }
                } as ScreenData);
            }
            this.working = false;
        }
    }
}