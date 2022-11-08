'use strict';

const { createClient } = require('redis');


const OPTIONS = {

};

class RedisClient {
    constructor () {
        this.client = createClient(OPTIONS);

        this.client.on('error', err => console.log('REDIS_CLIENT_ERROR', err));
    }

    async setObject (id, type = 'imposter', obj) {
        try {
            const client = await this.getClient();
            const json = JSON.stringify(obj);
            return await client.hSet(type, String(id), json);
        }
        catch (e) {
            console.error('REDIS_SAVE_OBJECT_ERROR', e);
            return null;
        }
    }

    async getObject (id, type = 'imposter') {
        try {
            const client = await this.getClient();
            const json = await client.hGet(type, String(id));
            return JSON.parse(json);
        }
        catch (e) {
            console.error('REDIS_GET_OBJECT_ERROR', e);
            return null;
        }
    }

    async getAllObjects (type = 'imposter') {
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

    async delObject (id, type = 'imposter') {
        try {
            const client = await this.getClient();
            return await client.hDel(type, String(id));
        }
        catch (e) {
            console.error('REDIS_DEL_OBJECT_ERROR', e);
            return 0;
        }
    }

    async delAllObjects (type = 'imposter') {
        try {
            const client = await this.getClient();
            const res = client.del(type);
            return res;
        }
        catch (e) {
            console.error('REDIS_DEL_ALL_OBJECTS_ERROR', e);
            return null;
        }
    }

    async connectToServer (callback = () => {}) {
        // const options = {
        //     sslValidate: false
        // };
        try {
            await this.client.connect();
            // this.client = await MongoClient.connect(MONGO_CONNECTION_STRING, options);
            console.log('Successfully connected to Redis');

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

    isClosed () {
        return !this.client.isOpen;
    }

    async stop () {
        const client = await this.getClient();
        return await client.disconnect();
    }

    async addImposter (imposter) {
        console.trace('CLIENT addImposter');

        try {
            const res = await this.setObject(imposter.port, 'imposter', imposter);
            console.log('return res', res);
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR addImposter', e);
            return null;
        }
    }

    async updateImposter (imposter) {
        console.trace('CLIENT updateImposter', JSON.stringify(imposter));

        try {
            const res = await this.setObject(imposter.port, 'imposter', imposter);
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR updateImposter', e);
            return null;
        }
    }

    async getAllImposters (transformFn) {
        console.trace('CLIENT getAllImposters');

        try {
            const res = await this.getAllObjects('imposter');
            if (!res) {
                return [];
            }
            return res.map(transformFn);
        }
        catch (e) {
            console.error('CLIENT_ERROR getAllImposters', e);
            return [];
        }
    }

    async getImposter (id) {
        console.trace('CLIENT getImposter');
        try {
            const res = await this.getObject(id, 'imposter');
            console.log('return res', res);
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR getImposter', e);
            return null;
        }
    }

    async deleteImposter (id) {
        console.trace('CLIENT deleteImposter');

        try {
            const res = await this.delObject(id, 'imposter');
            console.log('return res', res);
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteImposter', e);
            return null;
        }
    }

    async deleteAllImposters () {
        console.trace('CLIENT deleteAllImposters');

        try {
            const res = await this.delAllObjects('imposter');
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteAllImposters', e);
            return null;
        }
    }

    async addRequest (imposterId, request) {
        console.trace('CLIENT addRequest');

        try {
            const requests = await this.getObject(imposterId, 'requests') || [];
            requests.push(request);
            const res = await this.setObject(imposterId, 'requests', requests);
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR addRequest', e);
            return Promise.reject(e);
        }
    }

    async deleteRequests (imposterId) {
        console.trace('CLIENT deleteRequests');

        try {
            return await this.delObject(imposterId, 'requests');
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteRequests', e);
            return Promise.reject(e);
        }
    }

    async deleteAllRequests () {
        console.trace('CLIENT deleteAllRequests');

        try {
            return await this.delAllObjects('requests');
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteAllRequests', e);
            return Promise.reject(e);
        }
    }

    async getRequests (imposterId) {
        console.trace('CLIENT getRequests');

        try {
            return await this.getObject(imposterId, 'requests') || [];
        }
        catch (e) {
            console.error('CLIENT_ERROR getRequests', e);
            return Promise.reject(e);
        }
    }
}

module.exports = RedisClient;
