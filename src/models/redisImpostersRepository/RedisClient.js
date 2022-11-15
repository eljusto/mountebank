'use strict';

const { createClient } = require('redis');


const OPTIONS = {

};

class RedisClient {
    constructor () {
        this.client = createClient(OPTIONS);

        this.client.on('error', err => console.log('REDIS_CLIENT_ERROR', err));
    }

    async setObject (type = 'imposter', id, obj) {
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

    async pushToObject (type = 'imposter', id, obj) {
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

    async getObject (type = 'imposter', id) {
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

    async delObject (type = 'imposter', id) {
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
            const res = await client.del(type);
            return res;
        }
        catch (e) {
            console.error('REDIS_DEL_ALL_OBJECTS_ERROR', e);
            return null;
        }
    }

    async flushDb () {
        const client = await this.getClient();
        return await client.flushDb();
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
            const res = await this.setObject('imposter', imposter.port, imposter);
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
            const res = await this.setObject('imposter', imposter.port, imposter);
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
            const res = await this.getObject('imposter', id);
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
            const res = await this.delObject('imposter', id);
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
            await this.delAllObjects('meta');
            await this.delAllObjects('responses');
            await this.delAllObjects('matches');
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
            return await this.pushToObject('requests', imposterId, request);
        }
        catch (e) {
            console.error('CLIENT_ERROR addRequest', e);
            return Promise.reject(e);
        }
    }

    async deleteRequests (imposterId) {
        console.trace('CLIENT deleteRequests');

        try {
            return await this.delObject('requests', imposterId);
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
        console.trace('CLIENT getRequests', imposterId);

        try {
            return await this.getObject('requests', imposterId) || [];
        }
        catch (e) {
            console.error('CLIENT_ERROR getRequests', e);
            return Promise.reject(e);
        }
    }

    async getResponse (responseId) {
        console.trace('CLIENT getResponses');

        try {
            return await this.getObject('responses', responseId);
        }
        catch (e) {
            console.error('CLIENT_ERROR getResponses', e);
            return Promise.reject(e);
        }
    }

    async addResponse (responseId, response) {
        console.trace('CLIENT addResponse');

        try {
            return await this.setObject('responses', responseId, response);
        }
        catch (e) {
            console.error('CLIENT_ERROR addRequest', e);
            return Promise.reject(e);
        }
    }

    async deleteResponse (responseId) {
        console.trace('CLIENT deleteResponses');

        try {
            return await this.delObject('responses', responseId);
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteResponses', e);
            return Promise.reject(e);
        }
    }

    async deleteAllResponses () {
        console.trace('CLIENT deleteAllResponses');

        try {
            return await this.delAllObjects('responses');
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteAllResponses', e);
            return Promise.reject(e);
        }
    }

    async delMeta (imposterId, stubId) {
        console.trace('CLIENT delMeta');

        try {
            const res = await this.delObject('meta', [imposterId, stubId].join(':'));
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR delMeta', e);
            return Promise.reject(e);
        }
    }

    async setMeta (imposterId, stubId, meta) {
        console.trace('CLIENT setMeta');

        try {
            const res = await this.setObject('meta', [imposterId, stubId].join(':'), meta);
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR setMeta', e);
            return Promise.reject(e);
        }
    }

    async getMeta (imposterId, stubId) {
        console.trace('CLIENT getMeta');

        try {
            const res = await this.getObject('meta', [imposterId, stubId].join(':'));
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR getMeta', e);
            return Promise.reject(e);
        }
    }

    async deleteAllMeta () {
        console.trace('CLIENT deleteAllMeta');

        try {
            return await this.delAllObjects('meta');
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteAllMeta', e);
            return Promise.reject(e);
        }
    }

    async addMatch (stubId, match) {
        console.trace('CLIENT addMatch', stubId);

        try {
            return await this.pushToObject('matches', stubId, match);
        }
        catch (e) {
            console.error('CLIENT_ERROR addMatch', e);
            return Promise.reject(e);
        }
    }

    async getMatches (stubId) {
        console.trace('CLIENT getMatches');

        try {
            return await this.getObject('matches', stubId);
        }
        catch (e) {
            console.error('CLIENT_ERROR getMatches', e);
            return Promise.reject(e);
        }
    }

    async deleteMatches (stubId) {
        console.trace('CLIENT deleteMatches');

        try {
            return await this.delObject('match', stubId);
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteMatches', e);
            return Promise.reject(e);
        }
    }

    async deleteAllMatches () {
        console.trace('CLIENT deleteAllMatches');

        try {
            return await this.delAllObjects('match');
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteAllMatches', e);
            return Promise.reject(e);
        }
    }
}

module.exports = RedisClient;
