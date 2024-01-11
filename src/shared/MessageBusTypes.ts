import {AvailableScreens} from "./AvailableScreens";
import {ErrorData} from "../ui/screens/ErrorScreen";
import {LoginData} from "../ui/screens/strapi/LoginScreen";
import {LayerData} from "../ui/screens/figma/LayerScreen";
import {StrapiEndpoints} from "../plugin/Strapi";

/** Screen Data **/
export type EmptyScreenData = { screen: AvailableScreens.empty };
export type ErrorScreenData = { screen: AvailableScreens.error } & ErrorData;
export type LoginScreenData = { screen: AvailableScreens.login } & LoginData;
export type LayerScreenData = { screen: AvailableScreens.layer } & LayerData;
export type ScreenData = EmptyScreenData | ErrorScreenData | LoginScreenData | LayerScreenData;

/** Update Metadata Data **/
export type UpdateMetadataData = {
    id: string,
    key: string,
    value: string | number| boolean,
}

/** Login Data **/
export type PerformLoginData = {
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
    name: string,
    payload: any,
}

/** FUNCTIONS **/
export type FunctionParams = {
    updateScreen: ScreenData,
    updateMetadata: UpdateMetadataData,
    performLogin: PerformLoginData,
    exportToFlutter: ExportData,
    getTypeList: TypeListData,
    updateLayerView: undefined,
    uploadToStrapi: UploadData,
}

export type FunctionName = keyof FunctionParams;
