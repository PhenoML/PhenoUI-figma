import {html, TemplateResult} from "lit-html";

export function title(text: string): TemplateResult {
    return html`
        <div class="title">${text}</div>
    `;
}