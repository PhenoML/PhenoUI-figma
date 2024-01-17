import {LayerMetadata, MetadataDefaults} from "../shared/Metadata";
import {showErrorScreen, showStrapiLoginScreen} from "./screens";
import {getMetadata, updateMetadata} from "./metadata";
import {MessageBus} from "../shared/MessageBus";
// @ts-ignore
import qs from 'qs';


export enum StrapiEndpoints {
    login = '/api/auth/local',
    widgetSpec = '/api/figma-widget-specs',
    screenCategories = '/api/screen-categories',
    screens = '/api/screens',
}

export type UserType = {
    description: string,
} & ({
    type: 'string' | 'number' | 'boolean',
    default?: string | number | boolean,
    value?: string | number | boolean,
} | {
    type: 'select',
    default?: string,
    value?: string,
    options: Array<{
        value: string,
        label: string,
    }>,
})

export type UserDataSpec = {
    [key: string]: UserType,
}

export type TypeSpec = {
    mappings: any,
    userData: null | UserDataSpec,
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
    defaultCache: Map<string, any> = new Map<string, any>()
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

    logout(): void {
        this.jwt = '';
        updateMetadata(this.api.root, LayerMetadata.strapiJWT, '');
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
                    showStrapiLoginScreen(bus, this.api, result.error.message);
                } else {
                    showStrapiLoginScreen(bus, this.api, 'UNKNOWN ERROR, CONTACT DARIO!');
                }
            } catch (e: any) {
                showStrapiLoginScreen(bus, this.api, `ERROR contacting server: ${e.message}`);
                return false
            }
        } else {
            showStrapiLoginScreen(bus, this.api, 'Please enter all the required fields');
        }
        return false;
    }

    async getTypeSpec(type: string, cache?: Map<string, any>, useDefaultCache: boolean = false): Promise<TypeSpec | null> {
        if (cache && cache.has(type)) {
            return cache.get(type);
        }

        if (useDefaultCache) {
            if (this.defaultCache.has(type)) {
                return this.defaultCache.get(type);
            }
            return null;
        }

        const query = qs.stringify({
            filters: {
                type: {
                    $eq: type,
                }
            }
        });
        const url = this._urlForEndpoint(this.server, StrapiEndpoints.widgetSpec, {query});
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
        const url = this._urlForEndpoint(this.server, StrapiEndpoints.widgetSpec, {query});
        const data = await this._fetchGET(url);
        if (data) {
            return data.map((d: any) => d.attributes.type);
        }

        return [];
    }

    async uploadData(collection: StrapiEndpoints, name: string, payload: any) {
        const query = qs.stringify({
            filters: {
                name: {
                    $eq: name,
                }
            }
        });
        const existingURL = this._urlForEndpoint(this.server, collection, {query});
        const existing = await this._fetchGET(existingURL);

        let url;
        let method;
        if (existing.length) {
            url = this._urlForEndpoint(this.server, collection, { id: existing[0].id });
            method = 'PUT';
        } else {
            url = this._urlForEndpoint(this.server, collection);
            method = 'POST';
        }

        const data = {
            name,
            screen_category: 1, // TODO: Hardcoded to 1 (debug) category, should be selected by the user...
            spec: payload,
        }

        const result = await this._fetchUpload(url, method, data);
        console.log(result);
    }

    _urlForEndpoint(server: string, endpoint: StrapiEndpoints, options: { query?: string, id?: number } = {}): string {
        server = server.endsWith('/') ? server.substring(0, server.length - 1) : server;
        return `${server}${endpoint}${options.id ? `/${options.id}` : ''}${options.query ? `?${options.query}` : ''}`;
    }

    _checkFetchResult(result: any) {
        if (result.error) {
            if (result.error.status === 403) {
                updateMetadata(this.api.root, LayerMetadata.strapiJWT, '');
                throw new ForbiddenError('Forbidden, please login again');
            } else {
                throw new UnknownError(result.error.message, result.error);
            }
        }
    }

    async _fetch(url: string, method: string, headers: any, body?: string) {
        const response = await fetch(url, {
            method,
            headers,
            body,
        });

        if (!response.ok && response.status === 401) {
            throw new ForbiddenError('Unauthorized, please login again');
        }

        const result = await response.json();
        this._checkFetchResult(result);

        return result.data;
    }

    async _fetchGET(url: string) {
        return await this._fetch(url, 'GET', {
            "Authorization": `Bearer ${this.jwt}`,
        });
    }

    async _fetchUpload(url: string, method: string, data: any) {
        return await this._fetch(url, method, {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${this.jwt}`,
        }, JSON.stringify({ data }));
    }

    async _fetchPOST(url: string, data: any) {
        return await this._fetchUpload(url, 'POST', data);
    }

    async _fetchPUT(url: string, data: any) {
        return await this._fetchUpload(url, 'PUT', data);
    }
}