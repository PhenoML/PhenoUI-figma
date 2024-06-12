export enum LayerMetadata {
    strapiServer = 'com.phenoui.strapi.auth.server',
    strapiUser = 'com.phenoui.strapi.auth.user',
    strapiJWT = 'com.phenoui.strapi.auth.token',

    strapiCategory = 'com.phenoui.strapi.category',
    currentPage = 'com.phenoui.figma.current.page',

    widgetOverride = 'com.phenoui.layer.widget_override',

    githubAccessToken = 'com.phenoui.github.auth.token',
}

export const MetadataDefaults = {
    [LayerMetadata.strapiServer]: 'http://localhost:1337',
} as const;

export type MetadataDefaultsType = typeof MetadataDefaults[keyof typeof MetadataDefaults];