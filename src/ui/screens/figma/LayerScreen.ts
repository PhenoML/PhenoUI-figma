import {Screen} from "../Screen";
import {html, nothing, TemplateResult} from "lit-html";
import {MessageBus} from "../../../shared/MessageBus";
import {LayerMetadata} from "../../../shared/Metadata";
import {booleanInput, numberInput, selectInput, textInput} from "../../widgets/input";
import {flutter} from "../../widgets/icons";
import {button} from "../../widgets/button";
import {UserType} from "../../../plugin/Strapi";
import {getHeader} from '../../widgets/header';
import {AvailableTabs} from "../../../shared/AvailableTabs";
import {LayerData} from "../../tools/layer";
import {exportLayer, ExportLayerMode} from "../../tools/export";

export class LayerScreen extends Screen {
    updateTemplate(data: LayerData, bus: MessageBus): TemplateResult[] {
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

    getCustomDataFields(bus: MessageBus, data: LayerData): TemplateResult[] | typeof nothing {
        if (data.layer.typeData && data.layer.typeData.userData) {
            const userData = data.layer.typeData.userData;
            const rows: TemplateResult[] = [];
            const layerType = data.layer.widgetOverride || data.layer.widgetDefault;
            const keys = Object.keys(userData);
            // keys.forEach(k => console.log(k));
            keys.sort((a, b) => {
                const aV = userData[a];
                const bV = userData[b];
                if (aV.type === 'componentProperty' && bV.type !== 'componentProperty') {
                    return 1;
                } else if (aV.type !== 'componentProperty' && bV.type === 'componentProperty') {
                    return -1;
                } else if (aV.type !== 'componentProperty' && bV.type !== 'componentProperty') {
                    return 0;
                } else {
                    return (aV as any).propertyId > (bV as any).propertyId ? 1 : -1;
                }
            });
            // keys.forEach(k => console.log(k));
            for (const key of keys) {
                rows.push(html`
                    <div class="row">
                        ${this._getUserField(bus, data.layer.id, layerType, key, userData[key])}
                    </div>
                `);
            }
            return rows;
        }
        return nothing;
    }

    _getUserField(bus: MessageBus, layerID: string, widgetType: string, name: string, data: UserType): TemplateResult {
        const key = `${widgetType}_${name}`;
        const onUpdate = (_id: string, value: string | number | boolean) => bus.execute('updateMetadata', {
            id: layerID,
            key,
            value
        });

        const onUpdateComponentProperty = async (_id: string, value: string | number | boolean) => bus.execute('updateComponentProperty', {
            id: layerID,
            key: (data as any).key,
            value
        });

        switch (data.type) {
            case 'string':
                return textInput({
                    id: key,
                    label: data.description,
                    icon: name.charAt(0).toUpperCase(),
                    placeholder: data.default as string || data.description,
                    value: data.value,
                    onUpdate,
                });

            case 'number':
                return numberInput({
                    id: key,
                    label: data.description,
                    icon: name.charAt(0).toUpperCase(),
                    value: data.value ?? data.default ?? undefined,
                    onUpdate,
                });

            case 'boolean':
                return booleanInput({
                    id: key,
                    label: data.description,
                    placeholder: data.description,
                    value: data.value ?? data.default ?? undefined,
                    onUpdate,
                });

            case 'select':
                return selectInput({
                    id: key,
                    label: data.description,
                    icon: name.charAt(0).toUpperCase(),
                    value: data.value ?? data.default ?? undefined,
                    options: data.options,
                    onUpdate,
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
                        placeholder: data.description,
                        value: data.value,
                        onUpdate: onUpdateComponentProperty,
                    });
                } else if (data.valueType === 'VARIANT') {
                    return selectInput({
                        id: key,
                        label: data.description,
                        icon: name.charAt(0).toUpperCase(),
                        value: data.value ?? data.default ?? undefined,
                        options: data.options as [],
                        onUpdate: onUpdateComponentProperty,
                    });
                }
                // fall through

            default:
                return html`
                    <div class="error-description">ERROR: Unknown type [${(data as any).type}]</div>
                `
        }
    }
}