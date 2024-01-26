import {Screen} from "../Screen";
import {html, TemplateResult} from "lit-html";
import {MessageBus} from "../../../shared/MessageBus";
import {button} from "../../widgets/button";
import {getHeader} from '../../widgets/header';
import {AvailableTabs} from "../../../shared/AvailableTabs";
import {LayerData} from "../../tools/layer";
import {exportLayer, ExportLayerMode} from "../../tools/export/export";

export class LayerScreen extends Screen {
    async updateTemplate(data: LayerData, bus: MessageBus): Promise<TemplateResult[]> {
        const template = html`
            ${getHeader(data.layer.name, AvailableTabs.strapi, bus)}
            <section>
                <div class="row-full">
                    <div class="container">
                        ${button({
                            id: data.layer.id,
                            label: 'Upload to strapi',
                            onClick: async (id: string) => await exportLayer(this._manager, bus, id, data.layer.name, ExportLayerMode.strapiUpload, this),
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
                            label: 'Log out of strapi',
                            onClick: async (id: string) => await bus.execute('strapiLogout', undefined),
                        })}
                    </div>
                </div>
                <div class="row-full">
                    <div class="text-container">${await bus.execute('getStrapiServer', undefined)}</div>
                </div>
            </section>
        `;

        this.template = [template];

        return this.template;
    }
}