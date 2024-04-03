import {LayerMetadata, MetadataDefaults} from "../shared/Metadata";
import {showStrapiLoginScreen} from "./screens";
import {getLocalData, setLocalData} from "./metadata";
import {MessageBus} from "../shared/MessageBus";
// @ts-ignore
import qs from 'qs';
import {MappingAction} from './tools/export/export';


export enum StrapiEndpoints {
    login = '/api/auth/local',
    widgets = '/api/figma-widgets',
    widgetSpecs = '/api/figma-widget-specs',
    widgetCategories = '/api/figma-widget-categories',
    screenCategories = '/api/screen-categories',
    screens = '/api/screens',
    upload = '/api/upload',
    files = '/api/upload/files',
}

type UserDataObject = {
    type: 'binding' | 'group',
}

export type PropertyBinding = {
    type: 'binding',
    id: string,
    value?: string | boolean,
}

export type UserDataGroup = {
    type: 'group',
    properties: UserType[],
}

export type UserType = {
    description: string,
    linkedTo?: string,
} & ({
    type: 'string',
    default?: string,
    value?: string | PropertyBinding,
    properties?: string[],
} | {
    type: 'boolean',
    default?: boolean,
    value?: boolean | PropertyBinding,
    properties?: string[],
} | {
    type: 'number',
    default?: number,
    value?: number,
} | {
    type: 'select',
    default?: string,
    value?: string,
    options: Array<{
        value: string,
        label: string,
    }>,
} | {
    type: 'componentProperty',
    valueType?: ComponentPropertyType,
    default?: never,
    value?: string | number | boolean,
    key: string,
    propertyId: string,
    options?: Array<{
        value: string,
        label: string,
    }>,
} | {
    type: 'group',
    default?: UserType[],
    value?: UserDataGroup,
} | {
    type: 'lottie',
    default: string | null,
    value: string | null,
} | {
    type: 'union',
    handler: UserType['type'],
    fields: UserDataSpec,
    value: never,
});

export type UserDataValue = Exclude<UserType['value'], undefined>;

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
    server: string = '';
    jwt: string = '';
    loaded: Promise<void> = (async () => {
        this.jwt = await getLocalData(LayerMetadata.strapiJWT) as string || '';
        this.server = await getLocalData(LayerMetadata.strapiServer) as string || MetadataDefaults[LayerMetadata.strapiServer];
    })();
    constructor(api: PluginAPI) {
        this.api = api;
    }

    async isLoggedIn(): Promise<boolean> {
        await this.loaded;
        return Boolean(this.jwt);
    }

    async logout(): Promise<void> {
        this.jwt = '';
        await setLocalData(LayerMetadata.strapiJWT, '');
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
                    await setLocalData(LayerMetadata.strapiUser, user);
                    await setLocalData(LayerMetadata.strapiJWT, this.jwt);
                    await setLocalData(LayerMetadata.strapiServer, this.server);
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
            return Object.assign({}, cache.get(type));
        }

        if (useDefaultCache) {
            if (this.defaultCache.has(type)) {
                return Object.assign({}, this.defaultCache.get(type));
            }
            // return null;
        }

        const query = qs.stringify({
            filters: {
                type: {
                    $eq: type,
                }
            }
        });
        const url = this._urlForEndpoint(this.server, StrapiEndpoints.widgetSpecs, {query});
        const data = await this._fetchGET(url);

        if (data.length > 1) {
            throw new DataError(`Ambiguous results for type [${type}], expected 1, got ${data.length}`);
        } else if (data.length === 1) {
            const spec = data[0].attributes;

            if (Array.isArray(spec.mappings)) {
                spec.mappings = spec.mappings.map((t: any) => {
                    if (typeof t === 'string') {
                        const operator = t.substring(0, 1);
                        const path = t.substring(1);
                        if (operator === MappingAction.inherit) {
                            return this.getTypeSpec(path, cache, useDefaultCache).then(s => s?.mappings);
                        } else {
                            throw new DataError(`Unknown operator [${operator}] in mapping [${t}]`);
                        }
                    }
                    return Promise.resolve(t);
                });
                spec.mappings = await Promise.all(spec.mappings);
                spec.mappings = Object.assign({}, ...spec.mappings);
            }

            if (cache) {
                cache.set(type, spec);
            }
            this.defaultCache.set(type, spec);
            return Object.assign({}, spec);
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
        const url = this._urlForEndpoint(this.server, StrapiEndpoints.widgetSpecs, {query});
        const data = await this._fetchGET(url);
        if (data) {
            return data.map((d: any) => d.attributes.type);
        }

        return [];
    }

    async uploadData(collection: StrapiEndpoints, payload: any) {
        const query = qs.stringify({
            filters: {
                name: {
                    $eq: payload.name,
                },
                category: {
                    id: {
                        $eq: payload.category,
                    }
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

        const result = await this._fetchUpload(url, method, payload);
        console.log(result);
    }

    async getCategory(collection: StrapiEndpoints, uid: string) {
        const query = qs.stringify({
            filters: {
                uid: {
                    $eq: uid,
                }
            }
        });

        const existingURL = this._urlForEndpoint(this.server, collection, {query});
        const existing = await this._fetchGET(existingURL);

        if (existing.length) {
            return existing[0];
        }
        return null;
    }

    async createCategory(collection: StrapiEndpoints, uid: string) {
        const existing = await this.getCategory(collection, uid);
        if (existing) {
            return existing.id;
        }

        const url = this._urlForEndpoint(this.server, collection);
        const data = {
            uid,
        }

        return await this._fetchUpload(url, 'POST', data);
    }

    _urlForEndpoint(server: string, endpoint: StrapiEndpoints, options: { query?: string, id?: number } = {}): string {
        server = server.endsWith('/') ? server.substring(0, server.length - 1) : server;
        return `${server}${endpoint}${options.id ? `/${options.id}` : ''}${options.query ? `?${options.query}` : ''}`;
    }

    async _checkFetchResult(result: any) {
        if (result.error) {
            if (result.error.status === 403) {
                this.jwt = '';
                await setLocalData(LayerMetadata.strapiJWT, '');
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
        await this._checkFetchResult(result);

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