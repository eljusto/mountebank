'use strict';

const crypto = require('crypto');
const { createClient } = require('redis');

const OPTIONS = {};

function wrapCallbackFn (clientId, callbackFn) {
    return (message) => {
        try {
            const data = JSON.parse(message);

            if (data._clientId !== clientId) {
                callbackFn(data.payload);
            }
        }
        catch (e) {
            console.error('REDIS_MESSAGE_CALLBACK_ERROR', e);
        }
    };
}

class RedisClient {
    constructor (options = {}) {
        this.client = createClient({ ...OPTIONS, ...options });
        this.clientId = crypto.randomBytes(16).toString('base64');

        this.client.on('error', err => console.log('REDIS_CLIENT_ERROR', err));
    }

    async setObject (type, id, obj) {
        console.trace('setObject', type, id);

        try {
            const client = await this.getClient();
            const json = JSON.stringify(obj);
            return await client.hSet(type, String(id), json);
        }
        catch (e) {
            console.error('REDIS_SET_OBJECT_ERROR', e);
            return null;
        }
    }

    async pushToObject (type, id, obj) {
        console.trace('pushToObject', type, id);
        try {
            const client = await this.getClient();

            const itemsString = await client.hGet(type, String(id)) || '[]';
            const items = JSON.parse(itemsString);
            items.push(obj);
            const json = JSON.stringify(items);

            return await client.hSet(type, String(id), json);
        }
        catch (e) {
            console.error('REDIS_PUSH_TO_OBJECT_ERROR', e);
            return null;
        }
    }

    async getObject (type, id) {
        try {
            const client = await this.getClient();
            const json = await client.hGet(type, String(id));
            return JSON.parse(json);
        }
        catch (e) {
            console.error('REDIS_GET_OBJECT_ERROR', e, type, id);
            return null;
        }
    }

    async getAllObjects (type) {
        try {
            const client = await this.getClient();
            const list = await client.hVals(type);
            return list.map(item => JSON.parse(item));
        }
        catch (e) {
            console.error('REDIS_GET_ALL_OBJECTS_ERROR', e);
            return null;
        }
    }

    async delObject (type, id) {
        try {
            const client = await this.getClient();
            return await client.hDel(type, String(id));
        }
        catch (e) {
            console.error('REDIS_DEL_OBJECT_ERROR', e);
            return 0;
        }
    }

    async delAllObjects (type) {
        try {
            const client = await this.getClient();
            const res = await client.del(type);
            return res;
        }
        catch (e) {
            console.error('REDIS_DEL_ALL_OBJECTS_ERROR', e);
            return null;
        }
    }

    async incrementCounter (type, id) {
        console.trace('increment counter', type, id);
        try {
            const client = await this.getClient();
            const res = await client.hIncrBy(type, String(id), 1);
            return res;
        }
        catch (e) {
            console.error('REDIS_INCREMENT_COUNTER_ERROR', e);
            return null;
        }
    }

    async decrementCounter (type, id) {
        console.trace('decrement counter', type, id);
        try {
            const client = await this.getClient();
            const res = await client.hIncrBy(type, String(id), -1);
            return res;
        }
        catch (e) {
            console.error('REDIS_DECREMENT_COUNTER_ERROR', e);
            return null;
        }
    }

    async resetCounter (type, id) {
        console.trace('reset counter', type, id);
        try {
            const client = await this.getClient();
            const res = await client.hSet(type, String(id), 0);
            return res;
        }
        catch (e) {
            console.error('REDIS_RESET_COUNTER_ERROR', e);
            return null;
        }
    }

    async publish (channel, payload) {
        try {
            const client = await this.getClient();
            const data = {
                _clientId: this.clientId,
                payload
            };
            const res = await client.publish(channel, JSON.stringify(data));
            return res;
        }
        catch (e) {
            console.error('REDIS_PUBLISH_ERROR', e, channel, payload);
            return null;
        }
    }

    async subscribe (channel, callbackFn) {
        try {
            const client = await this.getPubSubClient();
            console.log('subscribe client', client);
            return client.subscribe(channel, wrapCallbackFn(this.clientId, callbackFn));
            // return await client.connect();
        }
        catch (e) {
            console.error('REDIS_SUBSCRIBE_ERROR', e);
            return null;
        }
    }

    async unsubscribe (channel) {
        try {
            const client = await this.getPubSubClient();
            const res = await client.unsubscribe(channel);
            return res;
        }
        catch (e) {
            console.error('REDIS_UNSUBSCRIBE_ERROR', e);
            return null;
        }
    }

    async flushDb () {
        const client = await this.getClient();
        return await client.flushDb();
    }

    async connectToServer (callback = () => {}) {
        try {
            await this.client.connect();
            console.log('Successfully connected to Redis db');

            return callback();
        }
        catch (e) {
            console.log('REDIS_CONNECT_ERROR', e);
            return callback(e);
        }
    }

    async getClient () {
        if (!this.client.isOpen) {
            await this.connectToServer();
        }
        return this.client;
    }

    async getPubSubClient () {
        if (!this.pubSubClient) {
            const client = await this.getClient();
            this.pubSubClient = client.duplicate();
            await this.pubSubClient.connect();
            return this.pubSubClient;
        }
        return Promise.resolve(this.pubSubClient);
    }

    isClosed () {
        return !this.client.isOpen;
    }

    async stop () {
        try {
            if (this.client.isOpen) {
                await this.client.disconnect();
            }
            if (this.pubSubClient?.isOpen) {
                await this.pubSubClient.disconnect();
            }
        }
        catch (e) {
            console.log('REDIS_STOP_ERROR', e);
        }
    }
}

module.exports = RedisClient;
