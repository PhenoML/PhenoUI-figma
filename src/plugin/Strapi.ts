import {LayerMetadata, MetadataDefaults} from "../shared/Metadata";
import {showErrorScreen, showLoginScreen} from "./screens";
import {updateMetadata} from "./metadata";
import {MessageBus} from "../shared/MessageBus";

export enum StrapiEndpoints {
    login = '/api/auth/local',
    widgetSpec = '/api/figma-widget-specs',
}

export class Strapi {
    api: PluginAPI;
    server: string;
    jwt: string;
    constructor(api: PluginAPI) {
        this.api = api;
        this.jwt = this.api.root.getPluginData(LayerMetadata.strapiJWT);
        this.server = this.api.root.getPluginData(LayerMetadata.strapiServer).trim();
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

    async getTypeSpec(cache: Map<string, any>, bus: MessageBus, type: string): Promise<any | null> {
        if (cache.has(type)) {
            return cache.get(type);
        }

        try {
            const url = `${this._urlForEndpoint(this.server, StrapiEndpoints.widgetSpec)}?filters[type][$eq]=${type}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.jwt}`,
                },
            });

            const result = await response.json();
            if (result.error) {
                if (result.error.status === 403) {
                    this.api.root.setPluginData(LayerMetadata.strapiJWT, '');
                    showLoginScreen(bus, this.api, `Forbidden, please login again`);
                } else {
                    showErrorScreen(
                        bus,
                        `ERROR ${result.error.status}`,
                        result.error.message,
                    );
                }
            } else if (!result.data.length) {
                showErrorScreen(
                    bus,
                    'ERROR',
                    `Could not find type [${type}] in strapi`,
                );
            } else if (result.data.length > 1) {
                showErrorScreen(
                    bus,
                    'ERROR',
                    `Ambiguous results for type [${type}], expected 1, got ${result.data.length}`,
                );
            } else {
                console.log(result);
                const spec = result.data[0].attributes;
                cache.set(type, spec);
                return spec;
            }
        } catch (e: any) {
            showErrorScreen(
                bus,
                'ERROR',
                `Could not load type [${type}] from strapi: ${e.message}`,
            );
        }

        return null;
    }

    _urlForEndpoint(server: string, endpoint: StrapiEndpoints): string {
        server = server.endsWith('/') ? server.substring(0, server.length - 1) : server;
        return `${server}${endpoint}`;
    }
}