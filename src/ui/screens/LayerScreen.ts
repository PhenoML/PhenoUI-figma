import {Screen} from "./Screen";
import {html, TemplateResult} from "lit-html";
import {MessageBus} from "../../shared/MessageBus";
import {LayerMetadata} from "../../shared/Metadata";
import {live} from "lit-html/directives/live.js";
import {title} from "../widgets/title";
import {textInput} from "../widgets/input";
import {flutter} from "../widgets/icons";
import {button} from "../widgets/button";

type LayerData = {
    layer: {
        id: string,
        name: string,
        widgetDefault: string,
        widgetOverride?: string,
    }
}

export class LayerScreen extends Screen {
    exporting: boolean = false;
    template?: TemplateResult[];
    updateTemplate(data: LayerData, bus: MessageBus): TemplateResult[] {
        const template = html`
            <section>
                <div class="row">
                    ${title(data.layer.name)}
                </div>
                <div class="row">
                    <div class="container">
                        ${button({
                            id: data.layer.id,
                            label: 'Export to Flutter UI',
                            onClick: async (id: string) => await this.exportToFlutter(id, bus),
                        })}
                    </div>
                </div>
            </section>
            <section>
                <div class="row">
                    <div class="text-container bold">Flutter Properties</div>
                </div>
                <div class="row">
                    ${textInput({
                        id: data.layer.id,
                        label: 'Flutter Widget Class Name',
                        icon: flutter,
                        placeholder: data.layer.widgetDefault,
                        value: data.layer.widgetOverride,
                        onUpdate: (id, value) => bus.execute('updateMetadata', id, LayerMetadata.widgetOverride, value),
                    })}
                </div>
            </section>
        `;

        this.template = [template];

        return this.template;
    }

    async exportToFlutter(id: string, bus: MessageBus) {
        if (!this.exporting) {
            this.exporting = true;
            const payload = await bus.execute('exportToFlutter', id);
            if (payload) {
                // initiate download
                console.log(payload);
            }
            this.exporting = false;
        }
    }
}