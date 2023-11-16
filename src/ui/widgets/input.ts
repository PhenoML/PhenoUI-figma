import {html, TemplateResult} from "lit-html";
import {live} from "lit-html/directives/live.js";

type InputData = {
    id: string,
    label: string,
    icon?: TemplateResult,
    placeholder?: string,
    value?: string,
    onUpdate?: (id: string, value: string) => void,
}

function label(text: string): TemplateResult {
    return html`<div class="label">${text}</div>`;
}

export function textInput(data: InputData): TemplateResult {
    if (data.icon) {

    }

    return html`
        <div class="row">
            <div class="input-container" title="${data.label}" aria-label="${data.label}">
                ${data.icon ? html`<div class="input-icon">${data.icon}</div>` : html`<div class="text-container">${data.label}</div>`}
                <input
                    id="${data.id}"
                    class="text-input"
                    type="text"
                    placeholder="${data.placeholder}"
                    .value="${live(data.value || '')}"
                    @keypress="${(e: KeyboardEvent) => {
                        if (e.target && e.code === 'Enter') {
                            (e.target as HTMLInputElement).blur();
                        }
                    }}"
                    @blur="${(e: FocusEvent) => data.onUpdate ? data.onUpdate(data.id, (e.target as HTMLInputElement).value) : null}"
                / >
            </div>
        </div>
    `;
}