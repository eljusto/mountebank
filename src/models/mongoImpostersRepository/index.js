'use strict';

const RedisClient = require('./RedisClient');

const stubsRepository = require('./stubRepository');

const imposterToJSON = require('./imposterToJSON');


function create (config, logger) {
    const wrapImposter = (imposter) => {
        console.trace('MODEL: wrapImposter', imposter);
        const repo = createStubsRepository(imposter.port);
        // options => printer.toJSON(numberOfRequests, options);

        // if (!Array.isArray(imposter.creationRequest.stubs)) {
        //     imposter.creationRequest.stubs = [];
        // }

        return {
            ...imposter,
            toJSON: (options = {}) => imposterToJSON(imposter, options, repo),
            resetRequests: async () => {
                await repo.deleteSavedRequests();
            }
        };
    };
    console.trace('!! REPO create', config);

    const imposterFns = {};

    const dbClient = new RedisClient();

    /**
     * Saves a reference to the imposter so that the functions
     * (which can't be persisted) can be rehydrated to a loaded imposter.
     * This means that any data in the function closures will be held in
     * memory.
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @param {Object} imposter - the imposter
     */
    function addReference (imposter) {
        console.trace('imposter');
        const id = String(imposter.port);
        imposterFns[id] = {};
        Object.keys(imposter).forEach(key => {
            if (typeof imposter[key] === 'function') {
                imposterFns[id][key] = imposter[key];
            }
        });
    }

    async function add (imposter) {
        console.trace('MODEL:Add', imposter);
        try {
            if (await this.exists(imposter.port)) {
                await this.del(imposter.port);
            }

            const imposterConfig = imposter.creationRequest;
            const stubs = imposterConfig.stubs || [];

            delete imposterConfig.requests;
            imposterConfig.port = imposter.port;

            const savedImposter = await dbClient.addImposter(imposterConfig);
            addReference(imposter);

            const repo = await stubsFor(imposter.port, dbClient);
            await repo.overwriteAll(stubs);
            console.log('return savedImposter', savedImposter);
            return imposter;
        }
        catch (e) {
            console.error('ADD_STUB_ERROR', e);
            return null;
        }
    }

    async function get (id) {
        console.trace('MODEL:Get', id);
        try {
            const imposter = await dbClient.getImposter(id);
            if (!imposter) {
                console.log('return null');
                return null;
            }
            console.log('return item', imposter);
            imposter.stubs = await stubsFor(id).toJSON();
            const repo = this.createStubsRepository(id);
            return wrapImposter(imposter, repo);
        }
        catch (e) {
            console.error('GET_STUB_ERROR', e);
            return Promise.reject(e);
        }
    }

    async function all () {
        console.trace('MODEL:All');
        if (dbClient.isClosed()) {
            return [];
        }
        const imposters = await dbClient.getAllImposters(wrapImposter);
        for (let i = 0; i < imposters.length; i += 1) {
            imposters[i].stubs = await stubsFor(imposters[i].port).toJSON();
            imposters[i] = wrapImposter(imposters[i]);
        }
        return imposters;
    }

    async function exists (id) {
        console.trace('MODEL:Exists', id);
        try {
            const item = await dbClient.getImposter(id);
            return (item !== null);
        }
        catch (e) {
            console.error('EXISTS_STUB_ERROR', e);
            return Promise.reject(e);
        }
    }

    async function shutdown (id) {
        if (typeof imposterFns[String(id)] === 'undefined') {
            return;
        }

        const stop = imposterFns[String(id)].stop;
        delete imposterFns[String(id)];
        if (stop) {
            await stop();
        }
    }

    async function del (id) {
        console.trace('MODEL:Del', id);

        try {
            const imposter = await this.get(id);
            if (!imposter) {
                return null;
            }
            await shutdown(id);

            for (let i = 0; i < imposter.stubs.length; i += 1) {
                const stub = imposter.stubs[i];
                console.log('!!! stub', stub);
                if (stub.meta) {
                    await dbClient.deleteMatches(stub.meta.id);
                    await dbClient.delMeta(id, stub.meta.id);
                }
            }

            await dbClient.deleteImposter(id);
            return imposter;
        }
        catch (e) {
            console.error('DELETE_STUB_ERROR', e);
            return Promise.reject(e);
        }
    }

    async function deleteAll () {
        console.trace('MODEL:DeleteAll');

        const ids = Object.keys(imposterFns);
        console.log('ids to stop: ', ids);
        await Promise.all(Object.keys(imposterFns).map(shutdown));

        const allImposters = await dbClient.getAllImposters(wrapImposter);

        await dbClient.deleteAllRequests();
        await dbClient.deleteAllMatches();
        await dbClient.deleteAllMeta();
        await dbClient.deleteAllImposters();
        return allImposters;
    }

    /**
     * Called at startup to load saved imposters.
     * Does nothing for in memory repository
     * @memberOf module:models/inMemoryImpostersRepository#
     * @returns {Object} - a promise
     */
    async function loadAll (protocols) {
        console.trace('MODEL:LoadAll');
        return dbClient.connectToServer(err => {
            console.warn('Connection done.', err ? err : 'No errors');

            dbClient.getAllImposters(wrapImposter).then(imposters => {
                imposters.forEach(imposter => {
                    console.log(imposter);
                    const protocol = protocols[imposter.protocol];
                    if (protocol) {
                        logger.info(`Loading ${imposter.protocol} ${ imposter.port }`);
                        protocol.createImposterFrom(imposter).then(imposterInstance => {
                            addReference(imposterInstance);
                        });
                    }
                    else {
                        logger.error(`Cannot load imposter ${ imposter.port }; no protocol loaded for ${ imposter.protocol }`);
                    }
                });
            });
        });
    }

    async function stopAll () {
        console.trace('MODEL:stopAll');

        await Promise.all(Object.keys(imposterFns).map(shutdown));

        // FIXME need to make it synchronic
        return await dbClient.stop();
    }

    async function stopAllSync () {
        console.trace('MODEL:stopAllSync');

        await Promise.all(Object.keys(imposterFns).map(shutdown));

        // FIXME need to make it synchronic
        return await dbClient.stop();
    }

    function stubsFor (id) {
        console.trace('MODEL: StubsFor', id);
        return createStubsRepository(id);
        // return { id };
    }

    function createStubsRepository (id) {
        return stubsRepository(id, dbClient);
    }

    return {
        add,
        all,
        createStubsRepository,
        del,
        deleteAll,
        exists,
        get,
        loadAll,
        stopAll,
        stopAllSync,
        stubsFor
    };
}

/* eslint-enable */
module.exports = { create };
