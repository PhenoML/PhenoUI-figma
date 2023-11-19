import {html, TemplateResult} from "lit-html";
import {live} from "lit-html/directives/live.js";

type AutocompleteState = {
    debounce: boolean,
    queuedChange: boolean,
    container?: HTMLElement,
    input?: HTMLInputElement,
}

type AutocompleteProvider = (value: string) => Promise<string[]>;

type InputData = {
    id: string,
    label: string,
    icon?: TemplateResult | string,
    placeholder?: string,
    value?: string | number | boolean,
    onUpdate?: (id: string, value: string | number | boolean) => void,
    provider?: AutocompleteProvider,
}

async function autocompleteFocus(el: HTMLInputElement, event: FocusEvent, state: AutocompleteState, provider: AutocompleteProvider) {
    const parent = el.parentElement as HTMLElement;
    const container = parent.querySelector('.autocomplete-container') as HTMLElement;
    if (event.type === 'focus') {
        state.input = el;
        state.container = container;
        container.style.display = 'block';
        const itemElements = parent.querySelectorAll('.autocomplete-item');
        itemElements.forEach(e => (e as HTMLElement).style.display = 'none');
    } else {
        container.style.display = 'none';
        state.input = undefined;
        state.container = undefined;
    }
}

async function autocompleteInput(el: HTMLInputElement, state: AutocompleteState, provider: AutocompleteProvider) {
    if (!state.debounce) {
        state.debounce = true;
        const items = await provider(el.value);
        const parent = el.parentElement as HTMLElement;
        const itemElements: HTMLElement[] = Array.from(parent.querySelectorAll('.autocomplete-item'));
        for (let i = 0, n = itemElements.length; i < n; ++i) {
            if (i < items.length) {
                itemElements[i].style.display = 'flex';
                itemElements[i].innerText = items[i];
            } else {
                itemElements[i].style.display = 'none';
            }
        }

        state.debounce = false;

        if (state.queuedChange) {
            await autocompleteInput(el, state, provider);
        }
    } else {
        state.queuedChange = true;
    }
}

function autocompleteSelection(el: HTMLElement, state: AutocompleteState) {
    if (state.input) {
        state.input.value = el.innerText;
        state.input.blur();
    }
}

function _input(type: string, data: InputData) {
    const state: AutocompleteState = {
        debounce: false,
        queuedChange: false,
    }

    async function handleFocus(this: HTMLInputElement, e: FocusEvent) {
        if (e.type === 'focus') {
            this.select();
        }

        if (data.provider) {
            await autocompleteFocus(this, e, state, data.provider as AutocompleteProvider);
        }
    }

    async function handleInput(this: HTMLInputElement, _e: InputEvent) {
        await autocompleteInput(this, state, data.provider as AutocompleteProvider)
    }

    function handleMouseDown(this: HTMLElement, e: MouseEvent) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        autocompleteSelection(this, state);
    }

    return html`
        <div class="input-container" title="${data.label}" aria-label="${data.label}">
            ${data.icon ? html`<div class="input-icon">${data.icon}</div>` : html`<div class="text-container">${data.label}</div>`}
            <input
                id="${data.id}"
                class="text-input"
                type="${type}"
                placeholder="${data.placeholder}"
                .value="${live(data.value || '')}"
                @focus="${handleFocus}"
                @blur="${data.provider ? handleFocus : null}"
                @input="${data.provider ? handleInput : null}"
                @change="${(e: Event) => {
                    if (data.onUpdate) {
                        data.onUpdate(data.id, (e.target as HTMLInputElement).value);
                    }
                }}"
                @keypress="${(e: KeyboardEvent) => {
                    if (e.target && e.code === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                    }
                }}"
            / >
            <div class="autocomplete-container" style="display:none;">
                <div class="autocomplete-item" @mousedown="${handleMouseDown}">text</div>
                <div class="autocomplete-item" @mousedown="${handleMouseDown}">text</div>
                <div class="autocomplete-item" @mousedown="${handleMouseDown}">text</div>
                <div class="autocomplete-item" @mousedown="${handleMouseDown}">text</div>
            </div>
        </div>
    `;
}

export function passwordInput(data: InputData): TemplateResult {
    return _input('password', data);
}

export function textInput(data: InputData): TemplateResult {
    return _input('text', data);
}

export function numberInput(data: InputData): TemplateResult {
    return _input('number', data);
}

export function booleanInput(data: InputData): TemplateResult {
    return html`
        <div class="input-container">
            <div class="input-icon">
                <input
                    id="${data.id}"
                    class="bool-input"
                    type="checkbox"
                    ?checked="${Boolean(data.value)}"
                    @change="${function (this:HTMLInputElement, _e: Event) {
                        if (data.onUpdate) {
                            data.onUpdate(data.id, this.checked);
                        }
                    }}"
                / >
            </div>
            <label>${data.label}</label>
        </div>
    `;
}