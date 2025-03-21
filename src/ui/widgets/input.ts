import {html, TemplateResult} from "lit-html";
import {live} from "lit-html/directives/live.js";
import {linkProperty, minusSign, plusSign, unlinkProperty} from './icons';
import {PropertyBinding, UserDataGroup, UserDataValue} from '../../plugin/Strapi';

type AutocompleteState = {
    debounce: boolean,
    queuedChange: boolean,
    container?: HTMLElement,
    input?: HTMLInputElement,
}

type AutocompleteProvider = (value: string) => Promise<string[]>;

type InputData = {
    id: string,
    name?: string,
    label: string,
    icon?: TemplateResult | string,
    placeholder?: string,
    value?: UserDataValue,
    properties?: string[],
    onUpdate?: (id: string, value: Exclude<UserDataValue, PropertyBinding>, refreshLayerView: boolean) => void,
    onUpdatePropertyBinding?: (id: string, value: string) => void,
    provider?: AutocompleteProvider,
}

type DropdownData = {
    options: { value: string, label: string }[],
} & InputData;

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
            state.queuedChange = false;
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

function _makeLinkProperty(data: InputData): TemplateResult | null {
    if (data.properties && data.properties.length > 0) {
        return html`
            <div class="input-icon">
                ${linkProperty}
            </div>
            <select
                    id="${data.id}"
                    class="select-link-property"
                    @change="${function (this: HTMLInputElement, _e: Event) {
                        if (this.value && data.onUpdatePropertyBinding) {
                            data.onUpdatePropertyBinding(data.id, this.value);
                        }
                    }}"
            >
                <option value=""></option>
                ${data.properties.map(p => html`<option id="${p}" value="${p}">${p.split(/#(?!.*#)/)[0]}</option>`)}
            </select>
        `;
    }

    return null;
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
            ${data.icon ? html`<div class="input-icon">${data.icon}</div>` : null}
            <input
                id="${data.id}"
                class="text-input"
                type="${type}"
                aria-label = "${data.label}, ${data.placeholder}"
                placeholder="${data.placeholder}"
                .value="${live(data.value || '')}"
                @focus="${handleFocus}"
                @blur="${data.provider ? handleFocus : null}"
                @input="${data.provider ? handleInput : null}"
                @change="${function (this: HTMLInputElement, _e: Event) {
                    if (data.onUpdate) {
                        data.onUpdate(data.id, this.value, false);
                    }
                }}"
                @keypress="${function (this: HTMLInputElement, e: KeyboardEvent) {
                    if (e.target && e.code === 'Enter') {
                        this.blur();
                    }
                }}"
            / >
            ${_makeLinkProperty(data)}
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

export function groupInput(data: InputData): TemplateResult {
    const props = (data.value as UserDataGroup).properties;
    return html`
        <div class="group-input-container">
            <div class="group-property-container" title="${data.label}" aria-label="${data.label}">
                <div class="group-property-container">
                    <div class="group-icon">${data.icon}</div>
                    <span class="group-title">${data.name!.charAt(0).toUpperCase()}${data.name?.slice(1)}</span>
                </div>
                <div 
                    class="icon-button"
                    @click="${function (this: HTMLElement, _e: MouseEvent) {
                        if (data.onUpdate) {
                            props.push({ type:'string', description: '', value: '' });
                            data.onUpdate(data.id, { type: 'group', properties: props }, true);
                        }
                    }}"
                >
                    ${plusSign}
                </div>
            </div>
                
            ${props.map(p => html`
                <div class="group-property-container" title="${p.description}" aria-label="${p.description}">
                    ${textInput({
                        id: `key:${p.description}`,
                        label: 'Key',
                        icon: 'K',
                        placeholder: 'key',
                        value: p.description,
                        onUpdate: (_, value: Exclude<UserDataValue, PropertyBinding>) => {
                            if (data.onUpdate) {
                                p.description = value as string;
                                data.onUpdate(data.id, { type: 'group', properties: props }, false);
                            }
                        },
                    
                    })}
                    ${(() => {
                        return textInput({
                            id: `value:${p.description}`,
                            label: 'Value',
                            icon: 'V',
                            placeholder: 'value',
                            value: p.value || p.default as UserDataValue,
                            onUpdate: (_, value: Exclude<UserDataValue, PropertyBinding>) => {
                                if (data.onUpdate) {
                                    p.value = value as string;
                                    data.onUpdate(data.id, { type: 'group', properties: props }, false);
                                }
                            },
                        })
                    })()}
                    <div
                        class="icon-button"
                        @click="${function (this: HTMLElement, _e: MouseEvent) {
                            if (data.onUpdate) {
                                props.splice(props.indexOf(p), 1);
                                data.onUpdate(data.id, { type: 'group', properties: props }, true);
                            }
                        }}"
                    >
                        ${minusSign}
                    </div>
                </div>
            `)}
        </div>
    `;
}

export function boundedPropertyInput(data: InputData): TemplateResult {
    return html`
        <div class="input-container" title="${data.placeholder}" aria-label="${data.placeholder}">
            ${data.icon ? html`<div class="input-icon">${data.icon}</div>` : html`<div class="text-container">${data.label}</div>`}
            <div class="bound-property-pill-container">
                <div class="bound-property-pill">
                    <div class="input-icon bound-icon">${linkProperty}</div>
                    ${(data.value as any).id.split(/#(?!.*#)/)[0]}
                </div>
            </div>
            <div 
                    class="input-icon unlink-icon"
                    @click="${function (this: HTMLElement, _e: MouseEvent) {
                        if (data.onUpdate) {
                            data.onUpdate(data.id, (data.value as any)?.value ?? null, true);
                        }
                    }}"
            >
                ${unlinkProperty}
            </div>
        </div>
    `;
}

export function selectInput(data: DropdownData): TemplateResult {
    return html`
        <div class="input-container" title="${data.label}" aria-label="${data.label}">
            <div class="input-icon">
                ${data.icon}
            </div>
            <select
                id="${data.id}"
                class="select-input"
                .value="${live(data.value)}"
                @change="${function (this:HTMLInputElement, _e: Event) {
                    if (data.onUpdate) {
                        data.onUpdate(data.id, this.value, false);
                    }
                }}"
            >
                ${data.options.map(o => 
                        html`<option id="${o.value}-${data.value}" value="${o.value}" ?selected="${o.value === data.value}">${o.label}</option>`
                )}
            </select>
        </div>
    `;
}

export function booleanInput(data: InputData): TemplateResult {
    return html`
        <div class="input-container" title="${data.placeholder}" aria-label="${data.placeholder}">
            ${data.icon ? html`<div class="input-icon">${data.icon}</div>` : html`<div class="text-container">${data.label}</div>`}
            <div class="bool-input-container">
                <input
                    id="${data.id}"
                    class="bool-input"
                    type="checkbox"
                    .checked="${Boolean(data.value)}"
                    @change="${function (this:HTMLInputElement, _e: Event) {
                        if (data.onUpdate) {
                            data.onUpdate(data.id, this.checked, false);
                        }
                    }}"
                / >
                <label for="${data.id}">${data.label}</label>
            </div>
            ${_makeLinkProperty(data)}
        </div>
    `;
}