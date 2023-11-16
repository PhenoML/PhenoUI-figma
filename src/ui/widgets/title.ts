import {html, TemplateResult} from "lit-html";

export function title(text: string): TemplateResult {
    return html`
        <div class="row">
            <div class="title">${text}</div>
        </div>
    `;
}