import {html, TemplateResult} from "lit-html";

type ButtonData = {
    id: string,
    label: string,
    disabled?: boolean,
    onClick?: (id: string) => void,
}

export function button(data: ButtonData): TemplateResult {
    return html`
        <button
            id="${data.id}" 
            type="button" 
            class="button"
            @click="${() => data.onClick ? data.onClick(data.id) : null}"
            ?disabled="${data.disabled}"
        >
            <span class="button-label">${data.label}</span>
        </button>
    `;
}