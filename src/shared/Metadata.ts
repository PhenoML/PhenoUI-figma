export enum LayerMetadata {
    strapiServer = 'com.phenoui.strapi.auth.server',
    strapiUser = 'com.phenoui.strapi.auth.user',
    strapiJWT = 'com.phenoui.strapi.auth.token',
    widgetOverride = 'com.phenoui.layer.widget_override',
}

export const MetadataDefaults = {
    [LayerMetadata.strapiServer]: 'http://localhost:1337',
} as const;

export type MetadataDefaultsType = typeof MetadataDefaults[keyof typeof MetadataDefaults];