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
                max-width: 14px;
                max-height: 14px;
            }
            
            .centered {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .container {
                display: flex;
                flex-grow: 1;
                padding: 0 8px;
            }
            
            .logo {
                width: 160px;
                height: auto;
            }
            
            .error-title {
                display: flex;
                justify-content: center;
                flex-grow: 1;
                font-size: 13px;
                font-weight: 600;
                color: var(--figma-color-text-danger);
            }
            
            .error-description {
                font-weight: 400;
                color: var(--figma-color-text-danger-secondary);
            }
            
            .row {
                height: 32px;
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 2px 8px;
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
                outline-offset: -1px;
                outline: 1px solid var(--figma-color-border);
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
            
            .button {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-grow: 1;
                background-color: transparent;
                border: none;
                outline: 1px solid var(--figma-color-border-strong);
                outline-offset: -1px;
                border-radius: 6px;
                padding: 0 12px;
            }
            
            .button:focus {
                outline-offset: -2px;
                outline: 2px solid var(--figma-color-border-selected);
            }
            
            .button:active {
                background-color: var(--figma-color-bg-pressed);
            }
            
            .button-label {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 32px;
                color: var(--figma-color-text);
                font-family: Inter, sans-serif;
                font-size: 11px;
            }
        </style>
    `];
}