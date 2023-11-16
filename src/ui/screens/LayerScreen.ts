import {Screen} from "./Screen";
import {html, TemplateResult} from "lit-html";
import {MessageBus} from "../../shared/MessageBus";
import {LayerMetadata} from "../../shared/Metadata";
import {live} from "lit-html/directives/live.js";
import {title} from "../widgets/title";
import {textInput} from "../widgets/input";
import {flutter} from "../widgets/icons";

type LayerData = {
    layer: {
        id: string,
        name: string,
        widgetDefault: string,
        widgetOverride?: string,
    }
}

export class LayerScreen extends Screen {
    template?: TemplateResult[];
    updateTemplate(data: LayerData, bus: MessageBus): TemplateResult[] {
        const template = html`
            <section>
                ${title(data.layer.name)}
            </section>
            <section>
                <div class="row">
                    <div class="text-container bold">Flutter Properties</div>
                </div>
                ${textInput({
                    id: data.layer.id,
                    label: 'Flutter Widget Class Name',
                    icon: flutter,
                    placeholder: data.layer.widgetDefault,
                    value: data.layer.widgetOverride,
                    onUpdate: (id, value) => bus.execute('updateMetadata', id, LayerMetadata.widgetOverride, value),
                })}
            </section>
        `;

        this.template = [template];

        return this.template;
    }
}