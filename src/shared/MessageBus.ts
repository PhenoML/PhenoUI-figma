import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import getRandomValues from 'polyfill-crypto.getrandomvalues';

const rnds8 = new Uint8Array(16);
function rng() {
    return getRandomValues(rnds8);
}

interface QueueEntry {
    id: string;
    resolve: (value: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void;
}

type ExecuteBusMessage = {
    id: string;
    type: 'execute';
    fn: string;
    args: any[];
}

type ResultBusMessage = {
    id: string;
    type: 'result';
    result: any;
}

type BusMessage = ExecuteBusMessage | ResultBusMessage;

type MessageEvent = {
    data: {
        pluginMessage: BusMessage,
    }
} | BusMessage;

type PluginPostMessageFn = (pluginMessage: any, options?: UIPostMessageOptions) => void;
type UIPostMessageFn = (message: any, targetOrigin: string, transfer?: any[]) => void;

type PluginContext = {
    ui: {
        on: Function,
        postMessage: PluginPostMessageFn,
    }
}

type UIContext = {
    addEventListener: Function;
    parent: {
        postMessage: UIPostMessageFn;
    }
}

type BusContext = PluginContext | UIContext;

export class MessageBus {
    queue: Map<string, QueueEntry> = new Map();
    ctx: BusContext;
    env: 'ui' | 'plugin';
    executors: any[];
    id: string;
    constructor(ctx: BusContext, executors: any[]) {
        this.ctx = ctx;
        this.executors = executors;
        this.id = uuidv4({rng});

        if (this.ctx.hasOwnProperty('ui')) {
            this.env = 'plugin';
            (this.ctx as PluginContext).ui.on('message', (pluginMessage: any, props?: OnMessageProperties) => this._messageHandler(pluginMessage, props));
        } else {
            this.env = 'ui';
            (this.ctx as UIContext).addEventListener('message', (pluginMessage: any, props?: OnMessageProperties) => this._messageHandler(pluginMessage, props));
        }
    }

    printID(prefix: string) {
        console.log(`${prefix}: ${this.id}`);
    }

    async _messageHandler(event: MessageEvent, props?: OnMessageProperties): Promise<void> {
        const pluginMessage = 'data' in event ? event.data.pluginMessage : event;
        console.log(`received:${this.id} type:${pluginMessage.type} id:${pluginMessage.id}`);
        if (pluginMessage.type === 'execute') {
            await this._executeMessage(pluginMessage);
        } else if (pluginMessage.type === 'result') {
            this._resolveMessage(pluginMessage);
        } else {
            throw `ERROR: Unrecognized message type [${(pluginMessage as any).type}]`;
        }
    }

    async _executeMessage(message: ExecuteBusMessage): Promise<void> {
        for (const executor of this.executors) {
            if (message.fn in executor && typeof executor[message.fn] === 'function') {
                const result = await executor[message.fn](...message.args);
                console.log(`post:${this.id} type:result id:${message.id}`);
                this._postMessage({
                    id: message.id,
                    type: 'result',
                    result,
                });
                return;
            }
        }
        throw `ERROR: No executor can handle the fn [${message.fn}]`;
    }

    _resolveMessage(message: ResultBusMessage): void {
        if (this.queue.has(message.id)) {
            const entry: QueueEntry = this.queue.get(message.id) as QueueEntry;
            this.queue.delete(message.id);
            entry.resolve(message.result);
            return;
        }
        throw `ERROR: Unrecognized queue entry ID [${message.id}]`;
    }

    _postMessage(pluginMessage: BusMessage): void {
        if (this.env === 'ui') {
            (this.ctx as UIContext).parent.postMessage({pluginMessage}, '*');
        } else {
            (this.ctx as PluginContext).ui.postMessage(pluginMessage, { origin: '*' });
        }
    }

    async execute(fn: string, ...args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = uuidv4({rng});
            this.queue.set(id, { id, resolve, reject });
            console.log(`post:${this.id} type:execute id:${id}`);
            this._postMessage({ id, fn, args, type: 'execute' });
        });
    }
}