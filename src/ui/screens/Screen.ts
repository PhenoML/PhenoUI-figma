import {TemplateResult} from "lit-html";
import {MessageBus} from "../../shared/MessageBus";
import {UIManager} from "../UIManager";

export abstract class Screen {
    _manager: UIManager;
    constructor(manager: UIManager) {
        this._manager = manager;
    }

    renderComplete(_parent: HTMLElement) {
        const main = _parent.querySelector('main');
        if (main) {
            const style = getComputedStyle(main);
            this._manager.bus.execute('resizeUi', { height: main.scrollHeight + 8 });
        }
    }

    template?: TemplateResult[];
    abstract updateTemplate(data: any, bus: MessageBus): TemplateResult[] | Promise<TemplateResult[]>;
}