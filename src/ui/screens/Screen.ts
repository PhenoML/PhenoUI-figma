import {TemplateResult} from "lit-html";
import {MessageBus} from "../../shared/MessageBus";

export abstract class Screen {
    abstract template?: TemplateResult[];
    abstract updateTemplate(data: any, bus: MessageBus): TemplateResult[];
}