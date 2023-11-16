import {Screen} from "./Screen";
import {html, TemplateResult} from "lit-html";
import {MessageBus} from "../../shared/MessageBus";
import {LayerMetadata} from "../../shared/Metadata";
import {live} from "lit-html/directives/live.js";

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
            <div class="layer_name">${data.layer.name}</div>
            <div class="label">Flutter Widget</div>
            <input
                    id="${data.layer.id}"
                    type="text"
                    placeholder="${data.layer.widgetDefault}"
                    .value="${live(data.layer.widgetOverride || '')}"
                    @keypress="${(e: KeyboardEvent) => {
                        if (e.target && e.code === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                        }
                    }}"
                    @blur="${(e: FocusEvent) => bus.execute('updateMetadata', data.layer.id, LayerMetadata.widgetOverride, (e.target as HTMLInputElement).value)}"
            / >
        `;

        this.template = [template];

        return this.template;
    }
}