import {Screen} from "./Screen";
import {MessageBus} from "../../shared/MessageBus";
import {TemplateResult} from "lit-html/development/lit-html";
import {html} from "lit-html";
import {logoPhenoML} from "../widgets/logoPhenoML";

export class EmptyScreen implements Screen {
    updateTemplate(_data?: unknown, _bus?: MessageBus): TemplateResult[] {
        const template = html`
            <section class="centered">
                <div class="logo">${logoPhenoML}</div>
                <div class="row-full">
                    <div class="title">select an object to get started</div>
                </div>
                <div class="row-full"></div>
            </section>
        `;

        return [template];
    }
}