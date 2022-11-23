'use strict';

const crypto = require('crypto');

const RedisClient = require('./RedisClient');

const CHANNELS = {
    imposter_change: 'imposter_change',
    imposter_delete: 'imposter_delete',
    all_imposters_delete: 'all_imposters_delete',

};

function wrapCallbackFn (clientId, callbackFn) {
    return (data) => {
        if (data._clientId !== clientId) {
            callbackFn(data.payload);
        }
    };
}

class ImposterStorage {

    constructor (options = {}) {
        console.log('OPTIONS', options)
        this.dbClient = new RedisClient(options);
        this.clientId = crypto.randomBytes(16).toString('base64');
        this.idCounter = 0;
    }

    async start () {
        return await this.dbClient.connectToServer();
    }

    async stop () {
        return await this.dbClient.stop();
    }

    generateId (prefix) {
        const epoch = new Date().valueOf();
        this.idCounter += 1;
        return `${prefix}-${epoch}-${process.pid}-${this.idCounter}`;
    }

    async addImposter (imposter) {
        console.trace('CLIENT addImposter');

        try {
            const res = await this.dbClient.setObject('imposter', imposter.port, imposter);
            this.dbClient.publish(CHANNELS.imposter_change, imposter.port);
            console.log('return res', res);
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR addImposter', e);
            return null;
        }
    }


    async subscribe (channel, callbackFn) {
        try {
            return await this.dbClient.subscribe(channel, callbackFn);
        }
        catch (e) {
            console.error('CLIENT_ERROR subscribe', e);
        }
    }

    async updateImposter (imposter) {
        console.trace('CLIENT updateImposter', JSON.stringify(imposter));

        try {
            const res = await this.dbClient.setObject('imposter', imposter.port, imposter);

            this.dbClient.publish(CHANNELS.imposter_change, imposter.port);
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR updateImposter', e);
            return null;
        }
    }

    async getAllImposters () {
        console.trace('CLIENT getAllImposters');

        try {
            return await this.dbClient.getAllObjects('imposter') || [];
        }
        catch (e) {
            console.error('CLIENT_ERROR getAllImposters', e);
            return [];
        }
    }

    async getImposter (id) {
        console.trace('CLIENT getImposter');
        try {
            const res = await this.dbClient.getObject('imposter', id);
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
            const res = await this.dbClient.delObject('imposter', id);
            this.dbClient.publish(CHANNELS.imposter_delete, id);
            // TODO:
            // await this.dbClient.delAllObjects('meta');
            // await this.dbClient.delAllObjects('responses');
            // await this.dbClient.delAllObjects('matches');
            console.log('return res', res);
            return res;
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteImposter', e);
            return null;
        }
    }

    async getStubs (imposterId) {
        const imposter = await this.getImposter(imposterId);
        if (!imposter || !Array.isArray(imposter.stubs)) {
            return [];
        }

        return imposter.stubs;
    }

    async deleteAllImposters () {
        console.trace('CLIENT deleteAllImposters');

        try {
            const res = await this.dbClient.delAllObjects('imposter');
            await this.dbClient.flushDb();
            this.dbClient.publish(CHANNELS.all_imposters_delete);

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
            return await this.dbClient.pushToObject('requests', imposterId, request);
        }
        catch (e) {
            console.error('CLIENT_ERROR addRequest', e);
            return Promise.reject(e);
        }
    }

    async deleteRequests (imposterId) {
        console.trace('CLIENT deleteRequests');

        try {
            return await this.dbClient.delObject('requests', imposterId);
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteRequests', e);
            return Promise.reject(e);
        }
    }

    async deleteAllRequests () {
        console.trace('CLIENT deleteAllRequests');

        try {
            return await this.dbClient.delAllObjects('requests');
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteAllRequests', e);
            return Promise.reject(e);
        }
    }

    async getRequests (imposterId) {
        console.trace('CLIENT getRequests', imposterId);

        try {
            return await this.dbClient.getObject('requests', imposterId) || [];
        }
        catch (e) {
            console.error('CLIENT_ERROR getRequests', e);
            return Promise.reject(e);
        }
    }

    async getResponse (responseId) {
        console.trace('CLIENT getResponses');

        try {
            return await this.dbClient.getObject('responses', responseId);
        }
        catch (e) {
            console.error('CLIENT_ERROR getResponses', e);
            return Promise.reject(e);
        }
    }

    async saveResponse (response) {
        console.trace('CLIENT addResponse');

        const responseId = this.generateId('response');
        try {
            await this.dbClient.setObject('responses', responseId, response);
            return responseId;
        }
        catch (e) {
            console.error('CLIENT_ERROR addRequest', e);
            return Promise.reject(e);
        }
    }

    async deleteResponse (responseId) {
        console.trace('CLIENT deleteResponses');

        try {
            return await this.dbClient.delObject('responses', responseId);
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteResponses', e);
            return Promise.reject(e);
        }
    }

    async deleteAllResponses () {
        console.trace('CLIENT deleteAllResponses');

        try {
            return await this.dbClient.delAllObjects('responses');
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteAllResponses', e);
            return Promise.reject(e);
        }
    }

    async delMeta (imposterId, stubId) {
        console.trace('CLIENT delMeta');

        try {
            const res = await this.dbClient.delObject('meta', [imposterId, stubId].join(':'));
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
            const res = await this.dbClient.setObject('meta', [imposterId, stubId].join(':'), meta);
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
            const res = await this.dbClient.getObject('meta', [imposterId, stubId].join(':'));
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
            return await this.dbClient.delAllObjects('meta');
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteAllMeta', e);
            return Promise.reject(e);
        }
    }

    async addMatch (stubId, match) {
        console.trace('CLIENT addMatch', stubId);

        try {
            return await this.dbClient.pushToObject('matches', stubId, match);
        }
        catch (e) {
            console.error('CLIENT_ERROR addMatch', e);
            return Promise.reject(e);
        }
    }

    async getMatches (stubId) {
        console.trace('CLIENT getMatches');

        try {
            return await this.dbClient.getObject('matches', stubId);
        }
        catch (e) {
            console.error('CLIENT_ERROR getMatches', e);
            return Promise.reject(e);
        }
    }

    async deleteMatches (stubId) {
        console.trace('CLIENT deleteMatches');

        try {
            return await this.dbClient.delObject('match', stubId);
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteMatches', e);
            return Promise.reject(e);
        }
    }

    async deleteAllMatches () {
        console.trace('CLIENT deleteAllMatches');

        try {
            return await this.dbClient.delAllObjects('match');
        }
        catch (e) {
            console.error('CLIENT_ERROR deleteAllMatches', e);
            return Promise.reject(e);
        }
    }

    async getRequestCounter (imposterId) {
        console.trace('CLIENT getRequestCounter');

        try {
            return await this.dbClient.getObject('requestCounter', imposterId);
        }
        catch (e) {
            console.error('CLIENT_ERROR getRequestCounter', e);
            return Promise.reject(e);
        }
    }

    async incrementRequestCounter (imposterId) {
        console.trace('CLIENT incrementRequestCounter');

        try {
            await this.dbClient.incrementCounter('requestCounter', imposterId);
            const val = await this.dbClient.getObject('requestCounter', imposterId);

            console.log('COUNTER = ', val);
            return val;
        }
        catch (e) {
            console.error('CLIENT_ERROR incrementRequestCounter', e);
            return Promise.reject(e);
        }
    }

    async addStub (imposterId, stub, index) {
        const imposter = await this.getImposter(imposterId);
        if (!imposter) {
            return;
        }

        const stubDefinition = await this.saveStubMetaAndResponses(imposterId, stub);

        console.log('STUB DEF', stubDefinition);
        if (!Array.isArray(imposter.stubs)) {
            imposter.stubs = [];
        }

        if (index === undefined) {
            imposter.stubs.push(stubDefinition);
        }
        else {
            imposter.stubs.splice(index, 0, stubDefinition);
        }
        const resUpdate = await this.updateImposter(imposter);
        console.log('resUpdate', resUpdate);
    }

    async deleteStubAtIndex (imposterId, index) {
        const imposter = await this.getImposter(imposterId);
        if (!imposter) {
            return;
        }
        const errors = require('../../util/errors');

        if (!Array.isArray(imposter.stubs)) {
            imposter.stubs = [];
        }
        if (typeof imposter.stubs[index] === 'undefined') {
            console.warn('no stub at index ', index, ' for imposter ', imposterId);
            throw errors.MissingResourceError(`no stub at index ${index}`);
        }

        imposter.stubs.splice(index, 1);
        const resUpdate = await this.updateImposter(imposter);
        console.log('resUpdate', resUpdate);

        // FIXME: remove responses and meta
        // await this.addResponse(responseId, responses[i]);
        // }
        // await this.setMeta(imposterId, stubId, meta);
    }

    async overwriteAllStubs (imposterId, stubs = []) {
        const imposter = await this.getImposter(imposterId);
        if (!imposter) {
            return;
        }

        // TODO: remove all stubs and stub data
        console.log('overwriteAllStubs newstubs', JSON.stringify(stubs));
        const stubDefinitions = [];
        for (let i = 0; i < stubs.length; i += 1) {
            stubDefinitions.push(await this.saveStubMetaAndResponses(imposterId, stubs[i]));
        }

        console.log('newdefs', JSON.stringify(stubDefinitions));
        imposter.stubs = stubDefinitions;
        const resUpdate = await this.updateImposter(imposter);
        console.log('resUpdate', resUpdate);
    }

    async addResponse (imposterId, stubId, response) {

        const meta = await this.getMeta(imposterId, stubId);
        if (!meta) {
            return null;
        }

        const repeatsFor = response_ => response_.repeat || 1;

        const responseId = await this.saveResponse(response);
        const responseIndex = meta.responseIds.length;
        meta.responseIds.push(responseId);
        for (let repeats = 0; repeats < repeatsFor(response); repeats += 1) {
            meta.orderWithRepeats.push(responseIndex);
        }
        await this.setMeta(imposterId, stubId, meta);
        console.log('RESPONSE', JSON.stringify(response));
        return meta;
    }

    async saveStubMetaAndResponses (imposterId, stub) {
        console.trace('saveStubMetaAndResponses', imposterId, stub);
        if (!stub) {
            return;
        }
        const repeatsFor = response => response.repeat || 1;
        const stubId = this.generateId('stub');
        const stubDefinition = {
            meta: { id: stubId }
        };
        const meta = {
            responseIds: [],
            orderWithRepeats: [],
            nextIndex: 0
        };
        const responses = stub.responses || [];
        if (stub.predicates) {
            stubDefinition.predicates = stub.predicates;
        }

        for (let i = 0; i < responses.length; i += 1) {
            const responseId = await this.saveResponse(responses[i]);

            meta.responseIds.push(responseId);

            for (let repeats = 0; repeats < repeatsFor(responses[i]); repeats += 1) {
                meta.orderWithRepeats.push(i);
            }
        }
        await this.setMeta(imposterId, stubId, meta);

        console.log('STUB DEFINITION', JSON.stringify(stubDefinition));
        return stubDefinition;
    }
}

ImposterStorage.CHANNELS = CHANNELS;

module.exports = ImposterStorage;
