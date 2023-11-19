import {LayerMetadata, MetadataDefaults} from "../shared/Metadata";
import {showErrorScreen, showLoginScreen} from "./screens";
import {getMetadata, updateMetadata} from "./metadata";
import {MessageBus} from "../shared/MessageBus";
// @ts-ignore
import qs from 'qs';


export enum StrapiEndpoints {
    login = '/api/auth/local',
    widgetSpec = '/api/figma-widget-specs',
}

export type UserType = {
    type: string,
    default?: string | null,
    description: string,
    value?: string | number | boolean,
}

export type TypeSpec = {
    mappings: any,
    userData: null | {
        [key: string]: UserType,
    } ,
}

export class ForbiddenError extends Error {}
export class DataError extends Error {}

export class UnknownError extends Error {
    data: any;
    constructor(msg: string, data: any) {
        super(msg);
        this.data = data;
    }
}

export class Strapi {
    api: PluginAPI;
    server: string;
    jwt: string;
    constructor(api: PluginAPI) {
        this.api = api;
        this.jwt = getMetadata(this.api.root, LayerMetadata.strapiJWT) as string;
        this.server = (getMetadata(this.api.root, LayerMetadata.strapiServer) as string).trim() || MetadataDefaults[LayerMetadata.strapiServer];
    }

    isLoggedIn(): boolean {
        return Boolean(this.jwt);
    }

    async performLogin(bus: MessageBus, server: string, user: string, password: string) {
        if (user && password) {
            server = server ? server.trim() : MetadataDefaults[LayerMetadata.strapiServer];
            const url = this._urlForEndpoint(server, StrapiEndpoints.login);
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({identifier: user, password}),
                });

                const result = await response.json();
                if (result.jwt) {
                    this.jwt = result.jwt;
                    this.server = server.trim();
                    updateMetadata(this.api.root, LayerMetadata.strapiJWT, this.jwt);
                    return true;
                } else if (result.error) {
                    showLoginScreen(bus, this.api, result.error.message);
                } else {
                    showLoginScreen(bus, this.api, 'UNKNOWN ERROR, CONTACT DARIO!');
                }
            } catch (e: any) {
                showLoginScreen(bus, this.api, `ERROR contacting server: ${e.message}`);
                return false
            }
        } else {
            showLoginScreen(bus, this.api, 'Please enter all the required fields');
        }
        return false;
    }

    async getTypeSpec(type: string, cache?: Map<string, any>): Promise<TypeSpec | null> {
        if (cache && cache.has(type)) {
            return cache.get(type);
        }

        const query = qs.stringify({
            filters: {
                type: {
                    $eq: type,
                }
            }
        });
        const url = this._urlForEndpoint(this.server, StrapiEndpoints.widgetSpec, query);
        const data = await this._fetchGET(url);

        if (data.length > 1) {
            throw new DataError(`Ambiguous results for type [${type}], expected 1, got ${data.length}`);
        } else if (data.length === 1) {
            const spec = data[0].attributes;
            if (cache) {
                cache.set(type, spec);
            }
            return spec;
        }

        return null;
    }

    async getTypeList(search: string, limit: number): Promise<string[]> {
        if (!search) {
            return [];
        }

        const query = qs.stringify({
            filters: {
                type: {
                    $startsWithi: search,
                }
            },
            fields: ['type'],
            pagination: {
                limit,
            }
        });
        const url = this._urlForEndpoint(this.server, StrapiEndpoints.widgetSpec, query);
        const data = await this._fetchGET(url);
        if (data) {
            return data.map((d: any) => d.attributes.type);
        }

        return [];
    }

    _urlForEndpoint(server: string, endpoint: StrapiEndpoints, query?: string): string {
        server = server.endsWith('/') ? server.substring(0, server.length - 1) : server;
        return `${server}${endpoint}${query ? `?${query}` : ''}`;
    }

    async _fetchGET(url: string) {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${this.jwt}`,
            },
        });

        const result = await response.json();
        if (result.error) {
            if (result.error.status === 403) {
                updateMetadata(this.api.root, LayerMetadata.strapiJWT, '');
                throw new ForbiddenError('Forbidden, please login again');
            } else {
                throw new UnknownError(result.error.message, result.error);
            }
        }

        return result.data;
    }
}