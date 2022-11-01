'use strict';
// Wrap from inMemory

function repeatsFor (response) {
    return response.repeat || 1;
}

function repeatTransform (responses) {
    const result = [];
    let response, repeats;

    for (let i = 0; i < responses.length; i += 1) {
        response = responses[i];
        repeats = repeatsFor(response);
        for (let j = 0; j < repeats; j += 1) {
            result.push(response);
        }
    }
    return result;
}

function createResponse (responseConfig) {
    const helpers = require('../../util/helpers');
    console.trace('WRAP Create response. NOT_IMPLEMENTED_YET', responseConfig);
    // FIXME: add index function
    const result = helpers.clone(responseConfig || { is: {} });
    result.stubIndex = stubIndex => stubIndex;
    return result;
}

function wrap (stub) {
    console.trace('WRAP wrap. NOT_IMPLEMENTED_YET', stub);
    const helpers = require('../../util/helpers'),
        cloned = helpers.clone(stub || {});
    // stubDir = stub e stub.meta.dir : '';
    // FIXME: support for repeated responses statefulResponses = repeatTransform(cloned.responses || []);

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

    /**
     * Adds a response to the stub
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @param {Object} response - the new response
     * @returns {Object} - the promise
     */
    cloned.addResponse = async response => {
        console.trace('WRAP: add response');
        // FIXME: implement saving to DB
        cloned.responses = cloned.responses || [];
        cloned.responses.push(response);
        // FIXME: statefulResponses.push(response);
        return response;
    };

    async function stubIndex () {
        console.trace('WRAP: stubIndex. NOT_IMPLEMENTED_YET');
        // const header = await readHeader();
        // for (let i = 0; i < header.stubs.length; i += 1) {
        //     if (header.stubs[i].meta.dir === stubDir) {
        //         return i;
        //     }
        // }
        return 0;
    }

    /**
     * Returns the next response for the stub, taking into consideration repeat behavior and cycling back the beginning
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @returns {Object} - the promise
     */
    cloned.nextResponse = async () => {
        console.trace('WRAP Next response. NOT_IMPLEMENTED_YET');
        // let responseFile;
        // await readAndWriteFile(metaPath(stubDir), 'nextResponse', async meta => {
        //     const maxIndex = meta.orderWithRepeats.length,
        //         responseIndex = meta.orderWithRepeats[meta.nextIndex % maxIndex];
        //
        //     responseFile = meta.responseFiles[responseIndex];
        //
        //     meta.nextIndex = (meta.nextIndex + 1) % maxIndex;
        //     return meta;
        // });

        // No need to read the response file while the lock is held
        // const responseConfig = await readFile(responsePath(stubDir, responseFile));

        // FIXME
        // const responseConfig = statefulResponses.shift();
        //
        // if (responseConfig) {
        //     statefulResponses.push(responseConfig);
        //     return createResponse(responseConfig, cloned.stubIndex);
        // }
        // else {
        //     return createResponse();
        // }
        const responseConfig = null;
        return createResponse(responseConfig);
    };

    /**
     * Records a match for debugging purposes
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @param {Object} request - the request
     * @param {Object} response - the response
     * @param {Object} responseConfig - the config that generated the response
     * @param {Number} processingTime - the time to match the predicate and generate the full response
     * @returns {Object} - the promise
     */
    cloned.recordMatch = async (request, response, responseConfig, processingTime) => {
        console.trace('WRAP: Record match');
        cloned.matches = cloned.matches || [];
        cloned.matches.push({
            timestamp: new Date().toJSON(),
            request,
            response,
            responseConfig,
            processingTime
        });
        // FIXME: save to db
    };

    return cloned;
}

module.exports = wrap;
