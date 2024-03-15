import {AvailableScreens} from "./AvailableScreens";
import {ErrorData} from "../ui/screens/ErrorScreen";
import {StrapiLoginData} from "../ui/screens/strapi/LoginScreen";
import {PropertyBinding, StrapiEndpoints, UserDataGroup, UserDataValue} from "../plugin/Strapi";
import {LayerData} from "../ui/tools/layer";
import {AvailableTabs} from "./AvailableTabs";
import {GithubLoginData} from "../ui/screens/github/LoginScreen";

/** Screen Data **/
export type EmptyScreenData = { screen: AvailableScreens.empty };
export type ErrorScreenData = { screen: AvailableScreens.error } & ErrorData;
export type StrapiLoginScreenData = { screen: AvailableScreens.strapi_login } & StrapiLoginData;
export type GithubLoginScreenData = { screen: AvailableScreens.github_login } & GithubLoginData;
export type LayerScreenData = { screen: (AvailableScreens.figma_layer | AvailableScreens.github_layer | AvailableScreens.strapi_layer) } & LayerData;
export type ScreenData = EmptyScreenData | ErrorScreenData | StrapiLoginScreenData | LayerScreenData | GithubLoginScreenData;

/** Update Metadata Data **/
export type UpdateMetadataData = {
    id: string | null,
    key: string,
    value: UserDataValue,
}

/** Get Metadata Data **/
export type GetMetadataData = {
    id: string | null,
    key: string,
}

/** Login Data **/
export type PerformStrapiLoginData = {
    server: string,
    user: string,
    password: string,
}

/** Export Data **/
export type ExportData = {
    id: string,
}

/** Type List **/
export type TypeListData = {
    search: string,
    limit: number,
}

/** Upload to Strapi **/
export type UploadData = {
    collection: StrapiEndpoints,
    payload: any,
}

/** Strapi Request Builder Data **/
export type StrapiRequestBuilderData = {
    collection: StrapiEndpoints,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
}

/** Strapi endpoint url data **/
export type StrapiEndpointUrlData = {
    collection: StrapiEndpoints,
    options?: any,
}

/** Get category from Strapi **/
export type CategoryData = {
    collection: StrapiEndpoints,
    uid: string,
}

export type SetTabData = {
    tab: AvailableTabs,
}

export type SetLocalData = {
    key: string,
    value: string | number | boolean,
}

export type ResizeLayerData = {
    id: string,
    width: number,
    height: number,
}

/** FUNCTIONS **/
export type FunctionParams = {
    updateScreen: ScreenData,
    getMetadata: GetMetadataData,
    updateMetadata: UpdateMetadataData,
    setLocalData: SetLocalData,
    getLocalData: string,
    updateComponentProperty: UpdateMetadataData,
    performStrapiLogin: PerformStrapiLoginData,
    exportToFlutter: ExportData,
    getTypeList: TypeListData,
    updateLayerView: undefined,
    uploadToStrapi: UploadData,
    getStrapiJwt: undefined,
    getStrapiServer: undefined,
    getStrapiUrlForEndpoint: StrapiEndpointUrlData,
    getCategory: CategoryData,
    createCategory: CategoryData,
    setTab: SetTabData,
    strapiLogout: undefined,
    isGithubLoggedIn: undefined,
    resizeLayer: ResizeLayerData,
}

export type FunctionName = keyof FunctionParams;
