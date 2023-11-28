import {Screen} from "./Screen";
import {html, nothing, TemplateResult} from "lit-html";
import {MessageBus} from "../../shared/MessageBus";
import {LayerMetadata} from "../../shared/Metadata";
import {title} from "../widgets/title";
import {booleanInput, numberInput, textInput} from "../widgets/input";
import {flutter} from "../widgets/icons";
import {button} from "../widgets/button";
import {StrapiEndpoints, TypeSpec, UserType} from "../../plugin/Strapi";
import {AvailableScreens} from "../../shared/AvailableScreens";


enum ExportMode {
    json,
    strapiUpload,
}

export type LayerData = {
    layer: {
        id: string,
        name: string,
        widgetDefault: string,
        widgetOverride?: string,
        typeData?: TypeSpec | null,
        isRoot?: boolean,
    }
}

export class LayerScreen extends Screen {
    exporting: boolean = false;
    updateTemplate(data: LayerData, bus: MessageBus): TemplateResult[] {
        const template = html`
            <section>
                <div class="row">
                    ${title(data.layer.name)}
                </div>
            </section>
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
                            onClick: async (id: string) => await this.exportToFlutter(id, bus, data.layer.name, ExportMode.json),
                        })}
                    </div>
                </div>
                ${!data.layer.isRoot ? nothing : html`
                    <div class="row-full">
                        <div class="container">
                            ${button({
                                id: data.layer.id,
                                label: 'Upload to strapi',
                                onClick: async (id: string) => await this.exportToFlutter(id, bus, data.layer.name, ExportMode.strapiUpload),
                            })}
                        </div>
                    </div>
                `}
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
            for (const key of Object.keys(userData)) {
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

            default:
                return html`
                    <div class="error-description">ERROR: Unknown type [${name}]</div>
                `
        }
    }

    async _downloadExport(name: string, payload: any) {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const blobURL = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        // link.className = 'button button--primary';
        link.href = blobURL;
        link.download = `${name}.json`;
        link.click();
        link.setAttribute('download', `${name},json`);
        // artificially wait for a bit to wait for the download screen to appear
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async _uploadToStrapi(bus: MessageBus, name: string, payload: any) {
        await bus.execute('uploadToStrapi', { collection: StrapiEndpoints.screens, name, payload });
    }

    async exportToFlutter(id: string, bus: MessageBus, name: string, mode: ExportMode) {
        if (!this.exporting) {
            const loading = this._manager._getScreen(AvailableScreens.loading);
            this._manager.renderScreen(loading, this._manager.root);
            this.exporting = true;
            const payload = await bus.execute('exportToFlutter', { id });
            if (payload) {
                switch (mode) {
                    case ExportMode.json:
                        await this._downloadExport(name, payload);
                        break;

                    case ExportMode.strapiUpload:
                        await this._uploadToStrapi(bus, name, payload);
                        break;

                    default:
                        throw 'not implemented';
                }
            }
            this._manager.renderScreen(this, this._manager.root);
            this.exporting = false;
        }
    }
}