'use strict';
// Wrap from inMemory

// meta = {
//     responseFiles: [],
//     orderWithRepeats: [],
//     nextIndex: 0
// },

function repeatsFor (response) {
    return response.repeat || 1;
}

function wrap (stub, imposterId, dbClient) {
    console.trace('WRAP wrap', stub);
    const helpers = require('../../util/helpers');
    const cloned = helpers.clone(stub || {});
    const stubId = stub ? stub.meta.id : '-';

    if (typeof stub === 'undefined') {
        return {
            addResponse: () => Promise.resolve(),
            nextResponse: () => Promise.resolve({
                is: {},
                stubIndex: () => Promise.resolve(0)
            }),
            recordMatch: () => Promise.resolve()
        };
    }

    delete cloned.meta;

    let counter = 0;

    function generateId (prefix) {
        const epoch = new Date().valueOf();
        counter += 1;
        return `${prefix}-${epoch}-${process.pid}-${counter}`;
    }

    function createResponse (responseConfig) {
        console.trace('WRAP Create response', responseConfig);
        const result = helpers.clone(responseConfig || { is: {} });
        result.stubIndex = getStubIndex;

        return result;
    }

    /**
     * Adds a response to the stub
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @param {Object} response - the new response
     * @returns {Object} - the promise
     */
    cloned.addResponse = async response => {
        console.trace('WRAP: add response');

        const responseId = generateId('response');
        const meta = await dbClient.getMeta(imposterId, stubId);
        const responseIndex = meta.responseIds.length;
        meta.responseIds.push(responseId);
        for (let repeats = 0; repeats < repeatsFor(response); repeats += 1) {
            meta.orderWithRepeats.push(responseIndex);
        }
        await dbClient.setMeta(imposterId, stubId, meta);
        console.log('RESPONSE', JSON.stringify(response));
        await dbClient.addResponse(responseId, response);
        return meta;
    };

    async function getStubIndex () {
        console.trace('WRAP: stubIndex. NOT_IMPLEMENTED_YET');
        const imposter = await dbClient.getImposter(imposterId);

        // const header = await readHeader();
        for (let i = 0; i < imposter.stubs.length; i += 1) {
            if (imposter.stubs[i].id === stub.id) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Returns the next response for the stub, taking into consideration repeat behavior and cycling back the beginning
     * @memberOf module:models/mongoBackedImpostersRepository#
     * @returns {Object} - the promise
     */
    cloned.nextResponse = async () => {
        console.trace('WRAP nextResponse', stub);
        let responseId;
        const meta = await dbClient.getMeta(imposterId, stubId);
        const maxIndex = meta.orderWithRepeats.length;
        const responseIndex = meta.orderWithRepeats[meta.nextIndex % maxIndex];

        responseId = meta.responseIds[responseIndex];
        meta.nextIndex = (meta.nextIndex + 1) % maxIndex;

        await dbClient.setMeta(imposterId, stubId, meta);

        const responseConfig = await dbClient.getResponse(responseId);
        console.log('responseConfig=', responseConfig);

        if (responseConfig) {
            return createResponse(responseConfig);
        }
        else {
            return createResponse();
        }
    };

    /**
     * Records a match for debugging purposes
     * @memberOf module:models/mongoBackedImpostersRepository#
     * @param {Object} request - the request
     * @param {Object} response - the response
     * @param {Object} responseConfig - the config that generated the response
     * @param {Number} processingTime - the time to match the predicate and generate the full response
     * @returns {Object} - the promise
     */
    cloned.recordMatch = async (request, response, responseConfig, processingTime) => {
        console.trace('WRAP: Record match');

        if (!Array.isArray(cloned.matches)) {
            cloned.matches = [];
        }

        const match = {
            timestamp: new Date().toJSON(),
            request,
            response,
            responseConfig,
            processingTime
        };

        cloned.matches.push(match);

        console.log(match);

    };

    return cloned;
}

module.exports = wrap;
