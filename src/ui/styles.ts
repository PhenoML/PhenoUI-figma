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
                overflow-x: hidden;
                overflow-y: auto
                --webkit-user-drag: none;
                user-select: none;
            }
            
            body {
                scrollbar-gutter: both-edges;
            }

            ::-webkit-scrollbar {
                height: 12px;
                width: 8px;
                background: transparent;
            }

            ::-webkit-scrollbar-thumb {
                background: var(--figma-color-icon-onwarning-secondary);
                /*-webkit-border-radius: 1ex;*/
                border-radius: 1ex;
                border: 1px solid var(--figma-color-border-disabled-strong);
            }

            ::-webkit-scrollbar-corner{
                display: none;
            }
            
            main {
                width: 100%;
                /*height: 100%;*/
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
            
            label {
                user-select: none;
            }
            
            /*svg {*/
            /*    max-width: 14px;*/
            /*    max-height: 14px;*/
            /*}*/
            
            .centered {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
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
            
            .padding-top-8 {
                padding-top: 8px;
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
                min-height: 32px;
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 2px 32px 2px 8px;
            }
            
            .row-full {
                min-height: 32px;
                display: flex;
                flex-direction: row;
                align-items: center;
                padding: 2px 8px;
            }
            
            .flex-center {
                justify-content: center;
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
                user-select: none;
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
                min-height: 32px;
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

            .input-container .unlink-icon {
                visibility: hidden;
            }

            .input-container:hover .unlink-icon {
                visibility: visible;
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
                z-index: 1;
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
                z-index: 2;
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
            
            .select-link-property {
                position: absolute;
                bottom: -1px;
                right: 0;
                min-width: 23px;
                max-width: 23px;
                height: 100%;
                border: none;
                opacity: 0;
                z-index: 0;
            }

            .select-link-property:focus-within {
                outline: none;
                left: 23px;
                max-width: 100%;
                /*height: 1px;*/
            }

            .bool-input-container {
                display: flex;
                flex-grow: 1;
                width: 100%;
                align-items: center;
                z-index: 1;
            }

            .bool-input {
                margin-right: 6px;
            }
            
            .group-container {
                border-top: 1px solid var(--figma-color-border);
            }
            
            .group-container + :not(.group-container) {
                border-top: 1px solid var(--figma-color-border);
            }
            
            .group-input-container {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
            }

            .group-icon {
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                fill: var(--figma-color-text-secondary);
                color: var(--figma-color-text-secondary);
                font-weight: 200;
                letter-spacing: 1.5px;

                > svg {
                    max-width: 14px;
                    max-height: 14px;
                }
            }
            
            .group-title {
                font-weight: 600;
                margin-left: 6px;
            }
            
            .group-property-container {
                min-height: 32px;
                position: relative;
                border: 1px solid transparent;
                display: flex;
                flex-grow: 1;
                align-items: center;
            }
            
            .icon-button {
                width: 32px;
                height: 32px;
                min-width: 32px;
                min-height: 32px;
                max-width: 32px;
                max-height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                fill: var(--figma-color-icon-secondary);
                background-color: transparent;
                > svg {
                    width: 12px;
                    height: 12px;
                }
            }
            
            .icon-button:hover {
                fill: var(--figma-color-icon-secondary-hover);
                background-color: var(--figma-color-bg-hover);
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
                user-select: none;
            }
            
            .loading-animation {
                width: 200px;
                height: 200px;
                
                > svg {
                    max-width: 100%;
                    max-height: 100%;
                }
            }
            
            .lottie-player {
                min-height: 32px;
                position: relative;
                border: 1px solid transparent;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 8px;
                margin-bottom: 8px;
            }

            .lottie-player:hover {
                outline-offset: -1px;
                outline: 1px solid var(--figma-color-border);
            }

            .lottie-player:focus-within {
                outline-offset: -2px;
                outline: 2px solid var(--figma-color-border-selected);
            }

            .lottie-animation {
                width: 100px;
                height: 100px;

                > svg {
                    max-width: 100%;
                    max-height: 100%;
                }
            }
            
            .lottie-controls {
                display: flex;
                width: 100%;
                align-items: center;
                justify-content: center;
                height: 32px;
                font-size: 11px;
                font-weight: 600;
            }
            
            .lottie-play-bar {
                position: relative;
                flex-grow: 1;
                height: 100%;
                background-color: var(--figma-color-bg-secondary);
            }
            
            .lottie-play-progress {
                height: 100%;
                background-color: var(--figma-color-bg-selected);
            }
            
            .lottie-play-from {
                position: absolute;
                top: 0;
                height: 100%;
                width: 3px;
                border-right: 1px solid var(--figma-color-bg-component);
                background-color: var(--figma-color-icon);
                transform: translate(-100%, 0);
                cursor: ew-resize;
            }
            
            .lottie-play-from-area {
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                background: repeating-linear-gradient(
                        45deg,
                        var(--figma-color-bg),
                        var(--figma-color-bg) 10px,
                        var(--figma-color-bg-component-tertiary) 10px,
                        var(--figma-color-bg-component-tertiary) 20px
                );
            }

            .lottie-play-to-area {
                position: absolute;
                right: 0;
                top: 0;
                height: 100%;
                background: repeating-linear-gradient(
                        45deg,
                        var(--figma-color-bg),
                        var(--figma-color-bg) 10px,
                        var(--figma-color-bg-component-tertiary) 10px,
                        var(--figma-color-bg-component-tertiary) 20px
                );
                transform: rotate(180deg);
            }
            

            .lottie-play-to {
                position: absolute;
                top: 0;
                height: 100%;
                width: 3px;
                border-left: 1px solid var(--figma-color-bg-component);
                background-color: var(--figma-color-icon);
                cursor: ew-resize;
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
            
            .bound-property-pill-container {
                display: flex;
                flex-grow: 1;
            }
            
            .bound-property-pill {
                height: 100%;
                font-weight: 400;
                box-sizing: border-box;
                margin: 0;
                border: 1px solid transparent;
                border-radius: 14px;
                display: flex;
                align-items: center;
                padding: 4px 8px 4px 2px;
                background-color: var(--figma-color-bg-component-tertiary);
                user-select: none;
            }
            
            .bound-icon {
                height: unset;
                width: 22px;
                fill: var(--figma-color-icon-component);
            }
            
            .unlink-icon:hover {
                background-color: var(--figma-color-bg-hover);
            }
        </style>
    `];
}