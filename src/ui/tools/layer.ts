import {TypeSpec} from "../../plugin/Strapi";

export type LayerData = {
    layer: {
        id: string,
        name: string,
        widgetDefault: string,
        widgetOverride?: string,
        typeData?: TypeSpec | null,
        exportable?: boolean,
    }
}