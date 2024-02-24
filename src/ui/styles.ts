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
            
            option {
                background-color: var(--figma-color-bg);
                color: var(--figma-color-text);
            }
            
            /*svg {*/
            /*    max-width: 14px;*/
            /*    max-height: 14px;*/
            /*}*/
            
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
                padding: 2px 32px 2px 8px;
            }
            
            .row-full {
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
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
            
            .label {
                font-weight: 600;
            }
            
            .text-container {
                padding: 0 8px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .bold {
                font-weight: 600;
            }
            
            .input-container {
                position: relative;
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
                
                > svg {
                    max-width: 14px;
                    max-height: 14px;
                }
            }

            .text-input {
                width: 100%;
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
            
            .autocomplete-container {
                position: absolute;
                width: 100%;
                top: 100%;
                left: 0;
                outline-offset: -1px;
                outline: 1px solid var(--figma-color-border);
                margin-top: 4px;
                z-index: 1;
                background-color: var(--figma-color-bg);
            }

            .autocomplete-item + .autocomplete-item {
                border-top: 1px solid var(--figma-color-border);
            }
            
            .autocomplete-item {
                display: flex;
                height: 32px;
                align-items: center;
                padding-left: 33px;
                color: var(--figma-color-text-secondary);
                user-select: none;
            }

            .autocomplete-item:hover {
                color: var(--figma-color-text-hover);
                background-color: var(--figma-color-bg-hover);
            }
            
            .select-input {
                width: 100%;
                height: 26px;
                flex-grow: 1;
                border: none;
                background-color: transparent;
                font-family: Inter, sans-serif;
                font-size: 11px;
                color: var(--figma-color-text);
            }
            
            .select-input:focus {
                outline: none;
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
            
            .button:enabled:active {
                background-color: var(--figma-color-bg-pressed);
            }
            
            .button:disabled {
                opacity: 0.5;
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
            
            .loading-animation {
                width: 200px;
                height: 200px;
                
                > svg {
                    max-width: 100%;
                    max-height: 100%;
                }
            }
            
            .tab-container {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                height: 32px;
                padding: 0 4px;
            }
            
            .tab-container:hover {
                outline-offset: -1px;
                outline: 1px solid var(--figma-color-border);
            }
            
            .tab-icon {
                width: 18px;
                height: 18px;
                margin: 0 4px;
            }
            
            .tab-title {
                margin: 0 4px;
                user-select: none;
            }
            
            .tab-selected {
                background-color: var(--figma-color-bg-tertiary);
            }
        </style>
    `];
}