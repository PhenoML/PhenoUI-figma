import {html, TemplateResult} from "lit-html";

export function getStyles(): TemplateResult[] {
    return [html`
        <style>
            html, body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                background-color: var(--figma-color-bg);
                color: var(--figma-color-text);
                font-family: Inter, sans-serif;
                font-size: 11px;
            }
            
            main {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: stretch;
            }

            textarea:focus, input:focus{
                outline: none;
            }
            
            section {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                padding: 8px 0;
            }
            
            section + section {
                border-top: 1px solid var(--figma-color-border);
            }
            
            svg {
                width: 12px;
            }
            
            .centered {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .logo {
                width: 160px;
            }
            
            .row {
                height: 32px;
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 0 8px;
            }
            
            .title {
                text-align: center;
                font-weight: 600;
                flex-grow: 1;
                padding: 0 8px;
            }
            
            .label {
                font-weight: 600;
            }
            
            .text-container {
                padding: 0 8px;
                white-space:nowrap;
            }
            
            .bold {
                font-weight: 600;
            }
            
            .input-container {
                border: 1px solid transparent;
                display: flex;
                flex-grow: 1;
                align-items: center;
            }
            
            .input-container:hover {
                border: 1px solid var(--figma-color-border);
            }
            
            .input-container:focus-within {
                outline-offset: -2px;
                outline: 2px solid var(--figma-color-border-selected);
            }
            
            .input-icon {
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                fill: var(--figma-color-text-secondary);
                color: var(--figma-color-text-secondary);
                font-weight: 200;
            }

            .text-input {
                height: 26px;
                flex-grow: 1;
                border: none;
                background-color: transparent;
                font-family: Inter, sans-serif;
                font-size: 11px;
                color: var(--figma-color-text);
            }
            
            .text-input::placeholder {
                color: var(--figma-color-text-disabled);
            }
        </style>
    `];
}