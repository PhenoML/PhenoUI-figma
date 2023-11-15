import {html, render, TemplateResult} from "lit-html";
import {MessageBus} from "../shared/MessageBus";

function getStyles(): TemplateResult {
    return html`
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
    `;
}

async function main() {
    const messageBus = new MessageBus(window, [{sayHello: () => console.log('HELLO')}]);
    messageBus.printID('UI');
    messageBus.execute('sayHello', 'yolito');
    const template = html`
        ${getStyles()}
        <button>Export</button>
    `;

    render(template, document.body);
}

document.addEventListener('DOMContentLoaded', main);