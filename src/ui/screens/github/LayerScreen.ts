import {Screen} from "../Screen";
import {html, TemplateResult} from "lit-html";
import {MessageBus} from "../../../shared/MessageBus";
import {button} from "../../widgets/button";
import {getHeader} from '../../widgets/header';
import {AvailableTabs} from "../../../shared/AvailableTabs";
import {LayerData} from "../../tools/layer";
import {exportLayer, ExportLayerMode} from "../../tools/export";
import {AvailableScreens} from "../../../shared/AvailableScreens";
import {ScreenData} from "../../../shared/MessageBusTypes";

export class LayerScreen extends Screen {
    updateTemplate(data: LayerData, bus: MessageBus): TemplateResult[] {
        const template = html`
            ${getHeader(data.layer.name, AvailableTabs.github, bus)}
            <section>
                <div class="row-full">
                    <div class="container">
                        ${button({
                            id: data.layer.id,
                            label: 'Commit to github',
                            onClick: async (id: string) => await exportLayer(this._manager, bus, id, data.layer.name, ExportLayerMode.githubCommit, this),
                            disabled: !Boolean(data.layer.exportable),
                        })}
                    </div>
                </div>
            </section>
            <section>
                <div class="row-full">
                    <div class="container">
                        ${button({
                            id: data.layer.id,
                            label: 'PR all changes',
                            onClick: () => console.log('TODO: implement github PR'),
                        })}
                    </div>
                </div>
            </section>
            <section>
                <div class="row-full">
                    <div class="container">
                        ${button({
                            id: data.layer.id,
                            label: 'Log out of github',
                            onClick: async () => {
                                await this._manager.github.logout();
                                this._manager.updateScreen({
                                    screen: AvailableScreens.github_login,
                                    credentials: {
                                        id: data.layer.id,
                                        layerName: data.layer.name,
                                    }
                                } as ScreenData)
                            },
                        })}
                    </div>
                </div>
            </section>
        `;

        this.template = [template];

        return this.template;
    }
}