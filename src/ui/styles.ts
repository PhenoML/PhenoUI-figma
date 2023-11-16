import {html, TemplateResult} from "lit-html";

export function getStyles(): TemplateResult[] {
    return [html`
        <style>
            body {
                background-color: var(--figma-color-bg);
                color: var(--figma-color-text);
                font-family: Inter, sans-serif;
                font-size: 11px;
            }

            .button {

            }
        </style>
    `];
}