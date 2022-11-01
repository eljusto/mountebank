/* eslint-disable */

const MongoDbClient = require('./MongoDbClient');

const stubRepository = require('./stubRepository');

function wrapImposter(imposter, index = 0) {
    console.trace('MODEL: wrapImposter', imposter);
    const toJSON = () => {
        console.warn('object ToJSON', index);
        try {
            return JSON.stringify(imposter);
        } catch (e) {
            return '{"error":"cant stringify imposter"}';
        }
    }
    return {
        ...imposter.creationRequest,
        toJSON,
    };
};
function create(config, logger) {
    console.warn('!! REPO create', config);

    const dbClient = new MongoDbClient();

    async function add (imposter) {
        console.trace('MODEL:Add', imposter);
        try {
            return dbClient.addImposter(imposter);
        } catch (e) {
            console.error('ADD_STUB_ERROR', e);
            return null;
        }
    }

    async function get(id) {
        console.trace('MODEL:Get', id);
        try {
            const item = await dbClient.getImposter(id);
            console.log('!! RES', item);
            return wrapImposter(item);
        } catch (e) {
            console.error('GET_STUB_ERROR', e);
            return Promise.reject(e);
        }
    }

    async function all() {
        console.trace('MODEL:All');
        return dbClient.getAllImposters(wrapImposter);
    }

    async function exists(id) {
        console.trace('MODEL:Exists', id);
        try {
            const item = await dbClient.getImposter(id);
            return (item !== null);
        } catch (e) {
            console.error('EXISTS_STUB_ERROR', e);
            return Promise.reject(e);
        }
    }

    async function del(id) {
        console.trace('MODEL:Del', id);
        try {
            const item = await dbClient.deleteImposter(id);
            return (item !== null);
        } catch (e) {
            console.error('DELETE_STUB_ERROR', e);
            return Promise.reject(e);
        }
    }

    async function deleteAll() {
        console.trace('MODEL:DeleteAll');
        return dbClient.deleteAllImposters();
    }

    /**
     * Called at startup to load saved imposters.
     * Does nothing for in memory repository
     * @memberOf module:models/inMemoryImpostersRepository#
     * @returns {Object} - a promise
     */
    async function loadAll(protocols) {
        console.trace('MODEL:LoadAll');
        return dbClient.connectToServer((err) => {
            console.warn('Connection done.', err ? err : 'No errors');

            dbClient.getAllImposters(wrapImposter).then((imposters) => {
                imposters.forEach(imposter => {
                    console.log(imposter);
                    const protocol = protocols[imposter.protocol];
                    if (protocol) {
                        logger.info(`Loading ${imposter.protocol} ${ imposter.port }`);
                        protocol.createImposterFrom(imposter);
                    } else {
                        logger.error(`Cannot load imposter ${ imposter.port }; no protocol loaded for ${ imposter.protocol }`);
                    }
                });
            });
        });
    }

    function stopAllSync() {
        // FIXME need to make it synchronic
        console.trace('MODEL:stopAllSync');
        dbClient.stop();
        return;
    }

    function stubsFor(id) {
        console.trace('MODEL: StubsFor', id);
        return stubRepository(id, dbClient);
        // return { id };
    }

    return {
        add,
        all,
        del,
        deleteAll,
        exists,
        get,
        loadAll,
        stopAllSync,
        stubsFor
    };
}

/* eslint-enable */
module.exports = { create };
