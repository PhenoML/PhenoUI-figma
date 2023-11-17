import {html, TemplateResult} from "lit-html";
import {live} from "lit-html/directives/live.js";

type InputData = {
    id: string,
    label: string,
    icon?: TemplateResult | string,
    placeholder?: string,
    value?: string,
    onUpdate?: (id: string, value: string) => void,
}

function label(text: string): TemplateResult {
    return html`<div class="label">${text}</div>`;
}

function _input(type: string, data: InputData) {
    return html`
        <div class="input-container" title="${data.label}" aria-label="${data.label}">
            ${data.icon ? html`<div class="input-icon">${data.icon}</div>` : html`<div class="text-container">${data.label}</div>`}
            <input
                id="${data.id}"
                class="text-input"
                type="${type}"
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
    `;
}

export function passwordInput(data: InputData): TemplateResult {
    return _input('password', data);
}

export function textInput(data: InputData): TemplateResult {
    return _input('text', data);
}