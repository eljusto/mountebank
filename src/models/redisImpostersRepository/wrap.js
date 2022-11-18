'use strict';
// Wrap from inMemory

// meta = {
//     responseFiles: [],
//     orderWithRepeats: [],
//     nextIndex: 0
// },

function wrap (stub, imposterId, imposterStorage) {
    console.trace('WRAP wrap', stub);
    const helpers = require('../../util/helpers');
    const cloned = helpers.clone(stub || {});
    const stubId = stub ? stub.meta.id : '-';

    if (typeof stub === 'undefined') {
        console.warn('!!!! RETURN DEFAULT STUB', stub, imposterId);
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


    function createResponse (responseConfig) {
        console.trace('WRAP Create response', responseConfig);
        const result = helpers.clone(responseConfig || { is: {} });
        result.stubIndex = getStubIndex;

        return result;
    }

    /**
     * Adds a response to the stub
     * @memberOf module:models/redisImpostersRepository#
     * @param {Object} response - the new response
     * @returns {Object} - the promise
     */
    cloned.addResponse = async response => {
        console.trace('WRAP: add response');

        return await imposterStorage.addResponse(imposterId, stubId, response);
    };

    async function getStubIndex () {
        console.trace('WRAP: getStubIndex');
        const imposter = await imposterStorage.getImposter(imposterId);

        if (!imposter.stubs) {
            console.warn('!!!!! SOMETHING WEIRD. NO STUBS', JSON.stringify(imposter));
            return 0;
        }

        for (let i = 0; i < imposter.stubs.length; i += 1) {
            if (imposter.stubs[i].meta.id === stub.meta.id) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Returns the next response for the stub, taking into consideration repeat behavior and cycling back the beginning
     * @memberOf module:models/redisImpostersRepository#
     * @returns {Object} - the promise
     */
    cloned.nextResponse = async () => {
        console.trace('WRAP nextResponse', stub);
        let responseId;
        const meta = await imposterStorage.getMeta(imposterId, stubId);

        if (!meta) {
            throw new Error('!!!NO META FOR STUB');
        }

        const maxIndex = meta.orderWithRepeats.length;
        const responseIndex = meta.orderWithRepeats[meta.nextIndex % maxIndex];

        responseId = meta.responseIds[responseIndex];
        meta.nextIndex = (meta.nextIndex + 1) % maxIndex;

        await imposterStorage.setMeta(imposterId, stubId, meta);
        await imposterStorage.incrementRequestCounter(imposterId);

        const responseConfig = await imposterStorage.getResponse(responseId);
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
     * @memberOf module:models/redisImpostersRepository#
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

        await imposterStorage.addMatch(stubId, match);

        console.log(match);

    };

    return cloned;
}

module.exports = wrap;
