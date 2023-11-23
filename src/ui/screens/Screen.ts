import {TemplateResult} from "lit-html";
import {MessageBus} from "../../shared/MessageBus";
import {UIManager} from "../UIManager";

export abstract class Screen {
    _manager: UIManager;
    constructor(manager: UIManager) {
        this._manager = manager;
    }

    renderComplete(_parent: HTMLElement) {}

    template?: TemplateResult[];
    abstract updateTemplate(data: any, bus: MessageBus): TemplateResult[];
}