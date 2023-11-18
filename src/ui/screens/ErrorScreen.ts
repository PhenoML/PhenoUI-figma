import {Screen} from "./Screen";
import {MessageBus} from "../../shared/MessageBus";
import {TemplateResult} from "lit-html/development/lit-html";
import {html} from "lit-html";

export type ErrorData = {
    error: {
        title: string,
        description: string,
    }
}

export class ErrorScreen implements Screen {
    updateTemplate(data: ErrorData, _bus?: MessageBus): TemplateResult[] {
        const template = html`
            <section>
                <div class="row"></div>
                <div class="row">
                    <div class="error-title">${data.error.title}</div>
                </div>
                <div class="row">
                    <div class="error-description">${data.error.description}</div>
                </div>
            </section>
        `;

        return [template];
    }
}