import {Screen} from "./Screen";
import {MessageBus} from "../../shared/MessageBus";
import {html, TemplateResult, nothing} from "lit-html";
import {logoPhenoML} from "../widgets/logoPhenoML";
import {title} from "../widgets/title";
import {passwordInput, textInput} from "../widgets/input";
import {LayerMetadata, MetadataDefaults} from "../../shared/Metadata";
import {button} from "../widgets/button";

type LoginData = {
    credentials: {
        id: string,
        server?: string,
        user?: string,
        error?: string,
    }
}

export class LoginScreen implements Screen {
    working: boolean = false;
    updateTemplate(data: LoginData, bus: MessageBus): TemplateResult[] {
        const template = html`
            <section>
                <div class="row centered">
                    <div class="logo">${logoPhenoML}</div>
                </div>
                <div class="row">
                    ${title('please connect to strapi')}
                </div>
            </section>
            <section>
                <div class="row">
                    <div class="text-container bold">Credentials</div>
                </div>
                <div class="row">
                    ${textInput({
                        id: 'server',
                        label: 'strapi server url',
                        icon: 'S',
                        placeholder: MetadataDefaults[LayerMetadata.strapiServer],
                        value: data.credentials.server,
                        onUpdate: (_id, value) => bus.execute('updateMetadata', data.credentials.id, LayerMetadata.strapiServer, value),
                    })}
                </div>
                <div class="row">
                    ${textInput({
                        id: 'user',
                        label: 'user name',
                        icon: 'U',
                        placeholder: 'user name',
                        value: data.credentials.user,
                        onUpdate: (id, value) => bus.execute('updateMetadata', data.credentials.id, LayerMetadata.strapiUser, value),
                    })}
                </div>
                <div class="row">
                    ${passwordInput({
                        id: 'password',
                        label: 'password',
                        icon: 'P',
                        placeholder: 'password',
                    })}
                </div>
                <div class="row">
                    ${data.credentials.error ? html`<div class="error-description">${data.credentials.error}</div>` : nothing}
                </div>
                <div class="row">
                    <div class="container">
                        ${button({
                            id: data.credentials.id,
                            label: 'Login',
                            onClick: async (id: string) => await this._login(id, bus),
                        })}
                    </div>
                </div>
            </section>
        `;

        return [template];
    }

    async _login(_: string, bus: MessageBus) {
        if (!this.working) {
            this.working = true;
            // get values
            const serverElement = document.getElementById('server');
            const userElement = document.getElementById('user');
            const passwordElement = document.getElementById('password');

            if (serverElement && userElement && passwordElement) {
                const server = (serverElement as HTMLInputElement).value;
                const user = (userElement as HTMLInputElement).value;
                const password = (passwordElement as HTMLInputElement).value;
                await bus.execute('performLogin', server, user, password);
            }

            this.working = false;
        }
    }
}