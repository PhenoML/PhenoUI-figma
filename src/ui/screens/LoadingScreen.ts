import {Screen} from "./Screen";
import {MessageBus} from "../../shared/MessageBus";
import {html, TemplateResult} from "lit-html";
import {UIManager} from "../UIManager";
import lottie from 'lottie-web';
import animation from '../svg/loading_animation.json';


export class LoadingScreen extends Screen {
    constructor(manager: UIManager) {
        super(manager);
        this.updateTemplate();
    }
    updateTemplate(_data?: unknown, _bus?: MessageBus): TemplateResult[] {
        const template = html`
            <section class="centered">
                <div id="loading-animation" class="loading-animation"></div>
                <div class="row-full"></div>
            </section>
        `;

        this.template = [template];

        return this.template;
    }

    renderComplete(parent: HTMLElement) {
        super.renderComplete(parent);
        const animationNode = parent.querySelector('#loading-animation');
        lottie.loadAnimation({
            container: animationNode as HTMLElement, // the dom element that will contain the animation
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animation,
        });
    }
}