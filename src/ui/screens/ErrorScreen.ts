import {Screen} from "./Screen";
import {MessageBus} from "../../shared/MessageBus";
import {TemplateResult} from "lit-html/development/lit-html";
import {html} from "lit-html";
import {UIManager} from "../UIManager";

export type ErrorData = {
    error: {
        title: string,
        description: string,
    }
}

export class ErrorScreen extends Screen {
    updateTemplate(data: ErrorData, _bus?: MessageBus): TemplateResult[] {
        const template = html`
            <section>
                <div class="row-full"></div>
                <div class="row-full">
                    <div class="error-title">${data.error.title}</div>
                </div>
                <div class="row-full">
                    <div class="error-description">${data.error.description}</div>
                </div>
            </section>
        `;

        this.template = [template];

        return this.template;
    }
}