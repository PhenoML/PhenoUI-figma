import {html, TemplateResult} from "lit-html";

export function info(text: string): TemplateResult {
    return html`
        <div class="info">${text}</div>
    `;
}