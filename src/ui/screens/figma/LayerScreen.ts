import {Screen} from "../Screen";
import {html, nothing, TemplateResult} from "lit-html";
import {MessageBus} from "../../../shared/MessageBus";
import {LayerMetadata} from "../../../shared/Metadata";
import {booleanInput, boundedPropertyInput, groupInput, numberInput, selectInput, textInput} from "../../widgets/input";
import {flutter} from "../../widgets/icons";
import {button} from "../../widgets/button";
import {PropertyBinding, UserDataValue, UserType} from "../../../plugin/Strapi";
import {getHeader} from '../../widgets/header';
import {AvailableTabs} from "../../../shared/AvailableTabs";
import {LayerData} from "../../tools/layer";
import {exportLayer, ExportLayerMode} from "../../tools/export/export";
import lottie from 'lottie-web';
import animation from '../../svg/loading_animation.json';
import {lottieInput} from '../../widgets/lottie';

export class LayerScreen extends Screen {
    updateTemplate(data: LayerData, bus: MessageBus): TemplateResult[] {
        console.log(data);
        const template = html`
            ${getHeader(data.layer.name, AvailableTabs.figma, bus)}
            <section>
                <div class="row">
                    <div class="text-container bold">Properties</div>
                </div>
                <div class="row">
                    ${textInput({
                        id: data.layer.id,
                        label: 'Flutter Widget Class Name',
                        icon: flutter,
                        placeholder: data.layer.widgetDefault,
                        value: data.layer.widgetOverride,
                        onUpdate: async (id, value) => {
                            await bus.execute('updateMetadata', {
                                id,
                                key: LayerMetadata.widgetOverride,
                                value
                            });
                            await bus.execute('updateLayerView', undefined);
                        },
                        provider: async (value) => {
                            return await bus.execute('getTypeList', {
                                search: value,
                                limit: 4,
                            });
                        }
                    })}
                </div>
                ${this.getCustomDataFields(bus, data)}
            </section>
            ${data.layer.exportable && data.layer.widgetDefault == 'Frame' ? this.resizeButtons(bus, data.layer.id) : undefined}
            <section>
                <div class="row-full">
                    <div class="container">
                        ${button({
                            id: data.layer.id,
                            label: 'Export to JSON',
                            onClick: async (id: string) => await exportLayer(this._manager, bus, id, data.layer.name, ExportLayerMode.json, this),
                        })}
                    </div>
                </div>
            </section>
        `;

        this.template = [template];

        return this.template;
    }

    _makeRow(bus: MessageBus, layerId: string, layerType: string, name: string, content: UserType | {key: string, value: UserType}[]): TemplateResult {
        if (Array.isArray(content)) {
            return html`
                <div class="row">
                    ${content.map((item) => this._getUserField(bus, layerId, layerType, item.key, item.value))}
                </div>
            `;
        }

        switch (content.type) {
            case 'group':
                return html`
                    <div class="group-container">
                        <div class="row-full">
                            ${this._getUserField(bus, layerId, layerType, name, content)}
                        </div>
                    </div>
                `;

            case 'lottie':
                return this._getUserField(bus, layerId, layerType, name, content);

            default:
                return html`
                    <div class="row">
                        ${this._getUserField(bus, layerId, layerType, name, content)}
                    </div>
                `;
        }
    }

    getCustomDataFields(bus: MessageBus, data: LayerData): TemplateResult[] | typeof nothing {
        if (data.layer.typeData && data.layer.typeData.userData) {
            const userData = data.layer.typeData.userData;
            const rows: TemplateResult[] = [];
            const layerType = data.layer.widgetOverride || data.layer.widgetDefault;
            const keys = Object.keys(userData);

            if ('__layout__' in userData) {
                // handle custom layout
                for (const row of userData['__layout__'] as any) {
                    if (Array.isArray(row)) {
                        const items = row.map((key: string) => ({key, value: userData[key]}));
                        rows.push(this._makeRow(bus, data.layer.id, layerType, '', items));
                    } else {
                        rows.push(this._makeRow(bus, data.layer.id, layerType, row, userData[row]))
                    }
                }
            } else {
                // default layout
                keys.sort((a, b) => {
                    const aV = userData[a];
                    const bV = userData[b];
                    if (aV.type === 'group') {
                        return 1;
                    } else if (bV.type === 'group') {
                        return -1;
                    } else if (aV.type === 'componentProperty' && bV.type !== 'componentProperty') {
                        return 1;
                    } else if (aV.type !== 'componentProperty' && bV.type === 'componentProperty') {
                        return -1;
                    } else if (aV.type !== 'componentProperty' && bV.type !== 'componentProperty') {
                        return 0;
                    } else {
                        return (aV as any).propertyId > (bV as any).propertyId ? 1 : -1;
                    }
                });

                for (const key of keys) {
                    rows.push(this._makeRow(bus, data.layer.id, layerType, key, userData[key]));
                }
            }
            return rows;
        }
        return nothing;
    }

    _getUserField(bus: MessageBus, layerID: string, widgetType: string, name: string, data: UserType): TemplateResult {
        const key = `${widgetType}_${name}`;
        const onUpdate = async (_id: string, value: Exclude<UserDataValue, PropertyBinding>, refreshLayerView: boolean) => {
            await bus.execute('updateMetadata', {
                id: layerID,
                key,
                value
            });
            // Future Dario: this introduces a delay in the UI update that makes it look like the data was not updated
            // properly.
            if (refreshLayerView) {
                await bus.execute('updateLayerView', undefined);
            }
        };

        const onUpdateComponentProperty = async (_id: string, value: Exclude<UserDataValue, PropertyBinding>) => {
            await bus.execute('updateComponentProperty', {
                id: layerID,
                key: (data as any).key,
                value
            });
        };

        const onUpdatePropertyBinding = async (_id: string, value: string) => {
            await bus.execute('updateMetadata', {
                id: layerID,
                key,
                value: {
                    type: 'binding',
                    id: value,
                }
            });
            await bus.execute('updateLayerView', undefined);
        };

        switch (data.type) {
            case 'string': {
                const inputData = {
                    id: key,
                    label: data.description,
                    icon: name.charAt(0).toUpperCase(),
                    placeholder: data.default as string || data.description,
                    value: data.value,
                    properties: data.properties,
                    onUpdate,
                    onUpdatePropertyBinding,
                };
                if (data.value !== null && typeof data.value === 'object' && !Array.isArray(data.value)) {
                    return boundedPropertyInput(inputData);
                }
                return textInput(inputData);
            }

            case 'boolean': {
                const inputData = {
                    id: key,
                    label: data.description,
                    icon: name.charAt(0).toUpperCase(),
                    placeholder: data.description,
                    value: data.value ?? data.default ?? undefined,
                    properties: data.properties,
                    onUpdate,
                    onUpdatePropertyBinding,
                }
                if (data.value !== null && typeof data.value === 'object' && !Array.isArray(data.value)) {
                    return boundedPropertyInput(inputData);
                }
                return booleanInput(inputData);
            }

            case 'number':
                return numberInput({
                    id: key,
                    label: data.description,
                    icon: name.charAt(0).toUpperCase(),
                    value: data.value ?? data.default ?? undefined,
                    onUpdate,
                });

            case 'select':
                return selectInput({
                    id: key,
                    label: data.description,
                    icon: name.charAt(0).toUpperCase(),
                    value: data.value || data.default || undefined,
                    options: data.options,
                    onUpdate,
                });

            case 'group':
                return groupInput({
                    id: key,
                    name: name,
                    label: data.description,
                    icon: '{;}',
                    value: data.value || { type: 'group', properties: data.default || [] },
                    onUpdate,
                    onUpdatePropertyBinding,
                });

            case 'componentProperty':
                if (data.valueType === 'TEXT') {
                    return textInput({
                        id: key,
                        label: data.description,
                        icon: name.charAt(0).toUpperCase(),
                        placeholder: data.description,
                        value: data.value,
                        onUpdate: onUpdateComponentProperty,
                    });
                } else if (data.valueType === 'BOOLEAN') {
                    return booleanInput({
                        id: key,
                        label: data.description,
                        icon: name.charAt(0).toUpperCase(),
                        placeholder: data.description,
                        value: data.value,
                        onUpdate: onUpdateComponentProperty,
                    });
                } else if (data.valueType === 'VARIANT') {
                    return selectInput({
                        id: key,
                        label: data.description,
                        icon: name.charAt(0).toUpperCase(),
                        value: data.value || data.default || undefined,
                        options: data.options as [],
                        onUpdate: onUpdateComponentProperty,
                    });
                }
                return html`<div class="error-description">ERROR: Unknown component [${data.type}] valueType [${data.valueType}]</div>`;

            case 'lottie':
                return lottieInput(bus, {
                    id: layerID,
                    description: data.description,
                    value: data.value,
                    onUpdate,
                });

            default:
                return html`
                    <div class="error-description">ERROR: Unknown type [${(data as any).type}]</div>
                `
        }
    }

    resizeButtons(bus: MessageBus, id : string): TemplateResult {
        return html`
            <section>
                <div class="row">
                    <div class="text-container bold">Resize</div>
                </div>
                <div class="row">
                    ${selectInput({
                        id,
                        label: 'Resize Frame',
                        icon: 'R',
                        value: undefined,
                        options: [
                            { value: '', label: '' },
                            { value: 'iPhone', label: 'iPhone' },
                            { value: 'iPhonePlus', label: 'iPhone Plus' },
                            { value: 'iPad', label: 'iPad' },
                            { value: 'iPadPro', label: 'iPad Pro' },
                            { value: 'iPadMini', label: 'iPad Mini' },
                            { value: 'iPadLS', label: 'iPad Landscape' },
                            { value: 'iPadProLS', label: 'iPad Pro Landscape' },
                            { value: 'iPadMiniLS', label: 'iPad Mini Landscape' },
                        ],
                        onUpdate: async (id, value) => await this.resizeFrame(bus, id, value as string),
                    })}
                </div>
            </section>
        `;
    }

    async resizeFrame(bus: MessageBus, id: string, key: string): Promise<void> {
        const sizeMap: any = {
            iPhone: { width: 393, height: 852 },
            iPhonePlus: { width: 430, height: 932 },
            iPad: { width: 834, height: 1194 },
            iPadPro: { width: 1024, height: 1366 },
            iPadMini: { width: 744, height: 1133 },
            iPadLS: { width: 1194, height: 834 },
            iPadProLS: { width: 1366, height: 1024 },
            iPadMiniLS: { width: 1133, height: 744 },
        };
        if (key && key in sizeMap) {
            await bus.execute('resizeLayer', {
                id,
                width: sizeMap[key].width,
                height: sizeMap[key].height,

            });
        }
    }
}