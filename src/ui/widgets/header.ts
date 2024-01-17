import {TemplateResult} from "lit-html/development/lit-html";
import {html} from "lit-html";
import {figma, github, strapi} from "./icons";
import {AvailableTabs} from "../../shared/AvailableTabs";
import {MessageBus} from "../../shared/MessageBus";

export function getHeader(title: string, selection: AvailableTabs, bus: MessageBus): TemplateResult {
    return html`
        <section>
            <div class="row" style="height: 16px;">
                <div class="title">${title}</div>
            </div>
            <div class="row-full">
                <div class="tab-container ${selection === AvailableTabs.figma ? 'tab-selected' : ''}"
                    @click="${async () => await bus.execute('setTab', { tab: AvailableTabs.figma })}"
                >
                    <div class="tab-icon">${figma}</div>
                    <div class="tab-title">figma</div>
                </div>
                <div class="tab-container ${selection === AvailableTabs.strapi ? 'tab-selected' : ''}"
                     @click="${async () => await bus.execute('setTab', { tab: AvailableTabs.strapi })}"
                >
                    <div class="tab-icon">${strapi}</div>
                    <div class="tab-title">strapi</div>
                </div>
                <div class="tab-container ${selection === AvailableTabs.github ? 'tab-selected' : ''}"
                     @click="${async () => await bus.execute('setTab', { tab: AvailableTabs.github })}"
                >
                    <div class="tab-icon">${github}</div>
                    <div class="tab-title">github</div>
                </div>
            </div>
        </section>
    `;
}