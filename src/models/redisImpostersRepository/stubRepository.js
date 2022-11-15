'use strict';

const wrap = require('./wrap');

function setStubs (imposter, stubs) {
    return {
        ...imposter,
        stubs,
        creationRequest: {
            ...imposter.creationRequest,
            stubs
        }
    };
}

function repeatsFor (response) {
    return response.repeat || 1;
}

function stubRepository (imposterId, dbClient) {
    let counter = 0;

    function generateId (prefix) {
        const epoch = new Date().valueOf();
        counter += 1;
        return `${prefix}-${epoch}-${process.pid}-${counter}`;
    }
    /**
     * Returns the number of stubs for the imposter
     * @memberOf module:models/redisImpostersRepository#
     * @returns {Object} - the promise
     */
    async function count () {
        const imposter = await dbClient.getImposter(imposterId);
        if (!imposter) {
            return 0;
        }
        if (!Array.isArray(imposter.stubs)) {
            imposter.stubs = [];
        }

        console.warn('COUNT ', JSON.stringify(imposter.stubs));

        return imposter.stubs.length;
    }

    /**
     * Returns the first stub whose predicates matches the filter
     * @memberOf module:models/redisImpostersRepository#
     * @param {Function} filter - the filter function
     * @param {Number} startIndex - the index to to start searching
     * @returns {Object} - the promise
     */
    async function first (filter, startIndex = 0) {
        console.trace('STUB:first', filter.toString(), startIndex, imposterId);

        const imposter = await dbClient.getImposter(imposterId);
        console.log('imposter', imposter);
        if (imposter) {
            if (!Array.isArray(imposter.stubs)) {
                imposter.stubs = [];
            }
            for (let i = startIndex; i < imposter.stubs.length; i += 1) {
                if (filter(imposter.stubs[i].predicates || [])) {
                    console.log('STUB FIRST FILTER TRUE', JSON.stringify(imposter.stubs[i].predicates));
                    return { success: true, stub: wrap(imposter.stubs[i], imposterId, dbClient) };
                }
            }
        }
        console.log('STUB FIRST SUCCESS FALSE');
        return { success: false, stub: wrap() };
    }

    /**
     * Adds a new stub to imposter
     * @memberOf module:models/redisImpostersRepository#
     * @param {Object} stub - the stub to add
     * @returns {Object} - the promise
     */
    async function add (stub) { // eslint-disable-line no-shadow
        console.trace('STUB add', stub);

        const imposter = await dbClient.getImposter(imposterId);
        if (!imposter) {
            return;
        }

        const stubDefinition = await saveStubMetaAndResponses(stub);

        console.log('STUB DEF', stubDefinition);
        if (!Array.isArray(imposter.stubs)) {
            imposter.stubs = [];
        }

        const updatedImposter = setStubs(imposter, [...imposter.stubs, stubDefinition]);
        const resUpdate = await dbClient.updateImposter(updatedImposter);
        console.log('resUpdate', resUpdate);
        return resUpdate;
    }

    async function saveStubMetaAndResponses (stub) {
        const stubId = generateId('stub');
        const stubDefinition = {
            meta: { id: stubId },
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
            const responseId = generateId('response');
            meta.responseIds.push(responseId);

            for (let repeats = 0; repeats < repeatsFor(responses[i]); repeats += 1) {
                meta.orderWithRepeats.push(i);
            }
            await dbClient.addResponse(responseId, responses[i]);
        }
        await dbClient.setMeta(imposterId, stubId, meta);

        return stubDefinition;
    }

    /**
     * Inserts a new stub at the given index
     * @memberOf module:models/redisImpostersRepository#
     * @param {Object} stub - the stub to add
     * @param {Number} index - the index to insert the new stub at
     * @returns {Object} - the promise
     */
    async function insertAtIndex (stub, index) {
        console.trace('STUB insertAtIndex', stub, index);

        const imposter = await dbClient.getImposter(imposterId);
        if (!imposter) {
            return;
        }

        const stubDefinition = await saveStubMetaAndResponses(stub);

        if (!Array.isArray(imposter.stubs)) {
            imposter.stubs = [];
        }

        imposter.stubs.splice(index, 0, stubDefinition);

        const updatedImposter = setStubs(imposter, imposter.stubs);
        const resUpdate = await dbClient.updateImposter(updatedImposter);
        console.log('resUpdate', resUpdate);
        return resUpdate;
    }

    /**
     * Deletes the stub at the given index
     * @memberOf module:models/redisImpostersRepository#
     * @param {Number} index - the index of the stub to delete
     * @returns {Object} - the promise
     */
    async function deleteAtIndex (index) {
        console.trace('STUB delete', index);
        const errors = require('../../util/errors');

        const imposter = await dbClient.getImposter(imposterId);
        if (!imposter) {
            return;
        }

        if (!Array.isArray(imposter.stubs)) {
            imposter.stubs = [];
        }
        if (typeof imposter.stubs[index] === 'undefined') {
            console.warn('no stub at index ', index, ' for imposter ', imposterId);
            throw errors.MissingResourceError(`no stub at index ${index}`);
        }

        imposter.stubs.splice(index, 1);
        const updatedImposter = setStubs(imposter, imposter.stubs);
        return await dbClient.updateImposter(updatedImposter);
    }

    /**
     * Overwrites all stubs with a new list
     * @memberOf module:models/redisImpostersRepository#
     * @param {Object} newStubs - the new list of stubs
     * @returns {Object} - the promise
     */
    async function overwriteAll (newStubs) {
        console.trace('STUB overwriteAll', newStubs);

        const imposter = await dbClient.getImposter(imposterId);
        if (!imposter) {
            return;
        }

        imposter.stubs = [];
        if (!imposter.creationRequest) {
            imposter.creationRequest = {};
        }
        imposter.creationRequest.stubs = [];
        await dbClient.updateImposter(imposter);

        let addSequence = Promise.resolve();
        newStubs.forEach(stub => {
            addSequence = addSequence.then(() => add(stub));
        });
        return await addSequence;
    }

    /**
     * Overwrites the stub at the given index
     * @memberOf module:models/redisImpostersRepository#
     * @param {Object} stub - the new stub
     * @param {Number} index - the index of the stub to overwrite
     * @returns {Object} - the promise
     */
    async function overwriteAtIndex (stub, index) {
        console.trace('STUB overwriteAtIndex', stub, index);

        await deleteAtIndex(index);
        await insertAtIndex(stub, index);
    }

    async function loadResponses (stub) {
        console.trace('STUB loadResponses', stub);
        const meta = await dbClient.getMeta(imposterId, stub.meta.id);
        if (!meta || !meta.responseIds) {
            return [];
        }

        const responsePromises = meta.responseIds.map(id => dbClient.getResponse(id));
        const res = await Promise.all(responsePromises);
        console.log('RES=', JSON.stringify(res));
        return res;
        // return await dbClient.getResponses(imposterId, stub.meta.id);
    }

    async function loadMatches (stub) {
        console.trace('STUB loadMatches');
        return await dbClient.getMatches(stub.meta.id) || [];
    }

    /**
     * Returns a JSON-convertible representation
     * @memberOf module:models/redisImpostersRepository#
     * @param {Object} options - The formatting options
     * @param {Boolean} options.debug - If true, includes debug information
     * @returns {Object} - the promise resolving to the JSON object
     */
    async function toJSON (options = {}) {
        console.trace('STUB toJSON', options);

        const imposter = await dbClient.getImposter(imposterId);
        if (!imposter) {
            if (options.debug) {
                console.log('Can\'t find imposter with id ', imposterId);
            }
            return [];
        }

        if (!Array.isArray(imposter.stubs)) {
            imposter.stubs = [];
        }

        const responsePromises = imposter.stubs.map(loadResponses);
        const stubResponses = await Promise.all(responsePromises);
        const debugPromises = options.debug ? imposter.stubs.map(loadMatches) : [];
        const matches = await Promise.all(debugPromises);

        console.log('matches:', matches);
        imposter.stubs.forEach((stub, index) => {
            stub.responses = stubResponses[index];
            if (options.debug && matches[index].length > 0) {
                stub.matches = matches[index];
            }
            delete stub.meta;
        });

        console.log('STUBS: ', imposter.stubs);
        return imposter.stubs;
    }

    function isRecordedResponse (response) {
        console.trace('STUB isRecordedResponse', response);
        return response.is && typeof response.is._proxyResponseTime === 'number';
    }

    /**
     * Removes the saved proxy responses
     * @memberOf module:models/redisImpostersRepository#
     * @returns {Object} - Promise
     */
    async function deleteSavedProxyResponses () {
        console.trace('STUB deleteSavedProxyResponses');
        const allStubs = await toJSON();
        allStubs.forEach(stub => {
            stub.responses = stub.responses.filter(response => !isRecordedResponse(response));
        });

        const nonProxyStubs = allStubs.filter(stub => stub.responses.length > 0);
        return overwriteAll(nonProxyStubs);
    }

    /**
     * Adds a request for the imposter
     * @memberOf module:models/redisImpostersRepository#
     * @param {Object} request - the request
     * @returns {Object} - the promise
     */
    async function addRequest (request) {
        console.trace('STUB addRequest', request);

        const helpers = require('../../util/helpers');
        const recordedRequest = helpers.clone(request);
        recordedRequest.timestamp = new Date().toJSON();
        const res = await dbClient.addRequest(imposterId, recordedRequest);
        console.log('addRequest ', res);
        return res;
    }

    /**
     * Returns the saved requests for the imposter
     * @memberOf module:models/redisImpostersRepository#
     * @returns {Object} - the promise resolving to the array of requests
     */
    async function loadRequests () {
        console.trace('STUB loadRequests');

        const res = await dbClient.getRequests(imposterId);
        console.log('loadedRequests', res);
        return res;
    }

    /**
     * Deletes the requests directory for an imposter
     * @memberOf module:models/redisImpostersRepository#
     * @returns {Object} - Promise
     */
    async function deleteSavedRequests () {
        console.trace('STUB deleteSavedRequests');

        return await dbClient.deleteRequests(imposterId);
    }

    return {
        count,
        first,
        add,
        insertAtIndex,
        overwriteAll,
        overwriteAtIndex,
        deleteAtIndex,
        toJSON,
        deleteSavedProxyResponses,
        addRequest,
        loadRequests,
        deleteSavedRequests
    };
}
module.exports = stubRepository;
