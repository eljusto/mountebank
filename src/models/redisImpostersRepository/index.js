'use strict';

const ImposterStorage = require('./ImposterStorage');

const stubsRepository = require('./stubRepository');

function create (config, logger) {
    // const wrapImposter = (imposter) => {
    //     console.trace('MODEL: wrapImposter', imposter);
    //     const repo = createStubsRepository(imposter.port);
    //     // options => printer.toJSON(numberOfRequests, options);
    //
    //     // if (!Array.isArray(imposter.creationRequest.stubs)) {
    //     //     imposter.creationRequest.stubs = [];
    //     // }
    //
    //     return {
    //         ...imposter,
    //         toJSON: (options = {}) => imposterToJSON(imposter, options, repo),
    //         resetRequests: async () => {
    //             await repo.deleteSavedRequests();
    //         }
    //     };
    // };
    console.trace('!! REPO create', config);

    let appProtocols;

    const imposterFns = {};

    const imposterStorage = new ImposterStorage();

    /**
     * Saves a reference to the imposter so that the functions
     * (which can't be persisted) can be rehydrated to a loaded imposter.
     * This means that any data in the function closures will be held in
     * memory.
     * @memberOf module:models/redisBackedImpostersRepository#
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

    function rehydrate (imposter) {
        console.trace('rehydrate');
        const id = String(imposter.port);
        Object.keys(imposterFns[id]).forEach(key => {
            imposter[key] = imposterFns[id][key];
        });
    }

    /**
     * Adds a new imposter
     * @memberOf module:models/redisBackedImpostersRepository#
     * @param {Object} imposter - the imposter to add
     * @returns {Object} - the promise
     */
    async function add (imposter) {
        console.trace('MODEL:Add', imposter);
        try {
            // if (await exists(imposter.port)) {
            //     await del(imposter.port);
            // }

            console.log('!! MODEL IMPOSTER TOJSON', await imposter.toJSON());

            const imposterConfig = imposter.creationRequest;
            const stubs = imposterConfig.stubs || [];

            const saveStubs = stubs.map(stub => imposterStorage.saveStubMetaAndResponses(imposter.port, stub));
            const stubDefinitions = await Promise.all(saveStubs);

            delete imposterConfig.requests;
            imposterConfig.port = imposter.port;
            imposterConfig.stubs = stubDefinitions;

            await imposterStorage.addImposter(imposterConfig);

            addReference(imposter);

            return imposter;

            // const repo = await stubsFor(imposter.port, dbClient);
            // await repo.overwriteAll(stubs);
            // console.log('return savedImposter', savedImposter);
            // return imposter;
        }
        catch (e) {
            console.error('ADD_STUB_ERROR', e);
            return null;
        }
    }

    /**
     * Gets the imposter by id
     * @memberOf module:models/redisBackedImpostersRepository#
     * @param {Number} id - the id of the imposter (e.g. the port)
     * @returns {Object} - the promise resolving to the imposter
     */
    async function get (id) {
        console.trace('MODEL:Get', id);
        try {
            const imposter = await imposterStorage.getImposter(id);
            if (!imposter) {
                console.log('return null');
                return null;
            }
            imposter.stubs = await stubsFor(id).toJSON();
            rehydrate(imposter);

            return imposter;
            // console.log('return item', imposter);
            // imposter.stubs = await stubsFor(id).toJSON();
            // const repo = this.createStubsRepository(id);
            // return wrapImposter(imposter, repo);
        }
        catch (e) {
            console.error('GET_STUB_ERROR', e);
            return Promise.reject(e);
        }
    }

    /**
     * Gets all imposters
     * @memberOf module:models/redisBackedImpostersRepository#
     * @returns {Object} - all imposters keyed by port
     */
    async function all () {
        console.trace('MODEL:All');
        if (imposterStorage.dbClient.isClosed()) {
            return [];
        }
        return Promise.all(Object.keys(imposterFns).map(get));
        // const imposters = await dbClient.getAllImposters(wrapImposter);
        // for (let i = 0; i < imposters.length; i += 1) {
        //     imposters[i].stubs = await stubsFor(imposters[i].port).toJSON();
        //     imposters[i] = wrapImposter(imposters[i]);
        // }
        // return imposters;
    }

    /**
     * Returns whether an imposter at the given id exists or not
     * @memberOf module:models/redisBackedImpostersRepository#
     * @param {Number} id - the id (e.g. the port)
     * @returns {boolean}
     */
    async function exists (id) {
        console.trace('MODEL:Exists', id);
        return Object.keys(imposterFns).indexOf(String(id)) >= 0;
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

    /**
     * Deletes the imposter at the given id
     * @memberOf module:models/redisBackedImpostersRepository#
     * @param {Number} id - the id (e.g. the port)
     * @returns {Object} - the deletion promise
     */
    async function del (id) {
        console.trace('MODEL:Del', id);

        try {
            const imposter = await get(id);
            const cleanup = [shutdown(id)];

            if (imposter !== null) {
                cleanup.push(imposterStorage.deleteImposter(id));
            }

            await Promise.all(cleanup);
            return imposter;
        // try {
        //     const imposter = await this.get(id);
        //     if (!imposter) {
        //         return null;
        //     }
        //     await shutdown(id);
        //
        //     for (let i = 0; i < imposter.stubs.length; i += 1) {
        //         const stub = imposter.stubs[i];
        //         console.log('!!! stub', stub);
        //         if (stub.meta) {
        //             await dbClient.deleteMatches(stub.meta.id);
        //             await dbClient.delMeta(id, stub.meta.id);
        //         }
        //     }
        //
        //     await dbClient.deleteImposter(id);
        //     return imposter;
        }
        catch (e) {
            console.error('DELETE_STUB_ERROR', e);
            return Promise.reject(e);
        }
    }

    /**
     * Deletes all imposters; used during testing
     * @memberOf module:models/redisBackedImpostersRepository#
     */
    async function stopAll () {
        console.trace('MODEL:stopAll');

        await Promise.all(Object.keys(imposterFns).map(shutdown));
        return await imposterStorage.stop();
    }

    /**
     * Deletes all imposters synchronously; used during shutdown
     * @memberOf module:models/redisBackedImpostersRepository#
     */
    async function stopAllSync () {
        console.trace('MODEL:stopAllSync');

        await Promise.all(Object.keys(imposterFns).map(shutdown));

        try {
        // FIXME need to make it synchronic
            return await imposterStorage.stop();
        }
        catch (e) {
            console.error('MODEL_ StopAll ERROR');
        }
    }

    /**
     * Deletes all imposters
     * @memberOf module:models/redisBackedImpostersRepository#
     * @returns {Object} - the deletion promise
     */
    async function deleteAll () {
        console.trace('MODEL:DeleteAll');

        const ids = Object.keys(imposterFns);
        console.log('ids to stop: ', ids);

        await Promise.all(Object.keys(imposterFns).map(shutdown));
        await imposterStorage.deleteAllImposters();


        // const allImposters = await dbClient.getAllImposters(wrapImposter);
        //
        // await dbClient.deleteAllRequests();
        // await dbClient.deleteAllMatches();
        // await dbClient.deleteAllMeta();
        // await dbClient.deleteAllImposters();
        // return allImposters;
    }

    async function loadImposter (imposterConfig, protocols) {
        const protocol = protocols[imposterConfig.protocol];

        if (protocol) {
            logger.info(`Loading ${imposterConfig.protocol}:${imposterConfig.port} from db`);
            try {
                const imposter = await protocol.createImposterFrom(imposterConfig);
                addReference(imposter);
            }
            catch (e) {
                logger.error(`Cannot load imposter ${imposterConfig.port}; ${ e }`);
            }
        }
        else {
            logger.error(`Cannot load imposter ${imposterConfig.port}; no protocol loaded for ${config.protocol}`);
        }
    }

    function onImposterChange (imposterId) {
        console.log('onImposterChange', imposterId);
        const imposter = imposterFns[imposterId];

        if (imposter) {
            shutdown(imposterId).then(() => {
                imposterStorage.getImposter(imposterId).then(imposterConfig => {
                    loadImposter(imposterConfig, appProtocols)
                    .then(_ => console.log('IT WORKS', _));
                });
            });
        } else {
                imposterStorage.getImposter(imposterId).then(imposterConfig => {
                    loadImposter(imposterConfig, appProtocols)
                    .then(_ => console.log('IT WORKS', _));
                });
        }
    }

    function onImposterDelete (imposterId) {
        console.log('onImposterDelete', imposterId);
        const imposter = imposterFns[imposterId];

        if (imposter) {
            shutdown(imposterId).then(() => {
                console.log(`Imposter ${ imposterId } stopped`);
            });
        }
    }

    function onAllImpostersDelete () {
        const ids = Object.keys(imposterFns);
        console.log('ids to stop: ', ids);

        Promise.all(Object.keys(imposterFns).map(shutdown))
        .then(() => {
            console.log('All imposters have stopped');
        });
    }

    /**
     * Loads all saved imposters at startup
     * @memberOf module:models/redisBackedImpostersRepository#
     * @param {Object} protocols - The protocol map, used to instantiate a new instance
     * @returns {Object} - a promise
     */
    async function loadAll (protocols) {
        console.trace('MODEL:LoadAll');

        appProtocols = protocols;

        try {
            await imposterStorage.start();
            console.warn('Connection done...');
            const allImposters = await imposterStorage.getAllImposters();
            const promises = allImposters.map(async imposter => loadImposter(imposter, protocols));
            await Promise.all(promises);
            await imposterStorage.subscribe(ImposterStorage.CHANNELS.imposter_change, onImposterChange);
            await imposterStorage.subscribe(ImposterStorage.CHANNELS.imposter_delete, onImposterDelete);
            await imposterStorage.subscribe(ImposterStorage.CHANNELS.all_imposters_delete, onAllImpostersDelete);
        }
        catch (e) {
            logger.error(e);
        }
    }


    function stubsFor (id) {
        console.trace('MODEL: StubsFor', id);
        return createStubsRepository(id);
    }

    function createStubsRepository (id) {
        return stubsRepository(id, imposterStorage);
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
