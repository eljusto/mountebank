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

function stubRepository (imposterId, dbClient) {

    /**
     * Returns the number of stubs for the imposter
     * @memberOf module:models/mongoBackedImpostersRepository#
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
     * @memberOf module:models/mongoBackedImpostersRepository#
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
                    return { success: true, stub: wrap(imposter.stubs[i]) };
                }
            }
        }
        console.log('STUB FIRST SUCCESS FALSE');
        return { success: false, stub: wrap() };
    }

    /**
     * Adds a new stub to imposter
     * @memberOf module:models/mongoBackedImpostersRepository#
     * @param {Object} stub - the stub to add
     * @returns {Object} - the promise
     */
    async function add (stub) { // eslint-disable-line no-shadow
        console.trace('STUB add', stub);

        const imposter = await dbClient.getImposter(imposterId);
        if (!imposter) {
            return;
        }

        if (!Array.isArray(imposter.stubs)) {
            imposter.stubs = [];
        }

        const updatedImposter = setStubs(imposter, [...imposter.stubs, wrap(stub)]);
        const resUpdate = await dbClient.updateImposter(updatedImposter);
        console.log('resUpdate', resUpdate);
        return resUpdate;

        // const stubDefinition = await saveStubMetaAndResponses(stub, baseDir);
        //
        // await readAndWriteHeader('addStub', async header => {
        //     header.stubs.push(stubDefinition);
        //     return header;
        // });
    }

    /**
     * Inserts a new stub at the given index
     * @memberOf module:models/filesystemBackedImpostersRepository#
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

        if (!Array.isArray(imposter.stubs)) {
            imposter.stubs = [];
        }

        imposter.stubs.splice(index, 0, wrap(stub));

        const updatedImposter = setStubs(imposter, imposter.stubs);
        const resUpdate = await dbClient.updateImposter(updatedImposter);
        console.log('resUpdate', resUpdate);
        return resUpdate;

        // return Promise.reject('STUB_INSERT NOT_IMPLEMENTED_YET');
        // const stubDefinition = await saveStubMetaAndResponses(stub, baseDir);
        //
        // await readAndWriteHeader('insertStubAtIndex', async header => {
        //     header.stubs.splice(index, 0, stubDefinition);
        //     return header;
        // });
    }

    /**
     * Deletes the stub at the given index
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @param {Number} index - the index of the stub to delete
     * @returns {Object} - the promise
     */
    async function deleteAtIndex (index) {
        console.trace('STUB delete', index);

        const imposter = await dbClient.getImposter(imposterId);
        if (!imposter) {
            return;
        }

        if (!Array.isArray(imposter.stubs)) {
            imposter.stubs = [];
        }

        imposter.stubs.splice(index, 1);
        const updatedImposter = setStubs(imposter, imposter.stubs);
        return await dbClient.updateImposter(updatedImposter);
        // let stubDir;
        //
        // await readAndWriteHeader('deleteStubAtIndex', async header => {
        //     const errors = require('../util/errors');
        //
        //     if (typeof header.stubs[index] === 'undefined') {
        //         throw errors.MissingResourceError(`no stub at index ${index}`);
        //     }
        //
        //     stubDir = header.stubs[index].meta.dir;
        //     header.stubs.splice(index, 1);
        //     return header;
        // });
        //
        // await remove(`${baseDir}/${stubDir}`);
    }

    /**
     * Overwrites all stubs with a new list
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @param {Object} newStubs - the new list of stubs
     * @returns {Object} - the promise
     */
    async function overwriteAll (newStubs) {
        console.trace('STUB overwriteAll', newStubs);

        const imposter = await dbClient.getImposter(imposterId);
        if (!imposter) {
            return;
        }

        imposter.stubs = newStubs;

        const updatedImposter = setStubs(imposter, imposter.stubs);
        return await dbClient.updateImposter(updatedImposter);
        // await readAndWriteHeader('overwriteAllStubs', async header => {
        //     header.stubs = [];
        //     await remove(`${baseDir}/stubs`);
        //     return header;
        // });
        //
        // let addSequence = Promise.resolve();
        // newStubs.forEach(stub => {
        //     addSequence = addSequence.then(() => add(stub));
        // });
        // await addSequence;
    }

    /**
     * Overwrites the stub at the given index
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @param {Object} stub - the new stub
     * @param {Number} index - the index of the stub to overwrite
     * @returns {Object} - the promise
     */
    async function overwriteAtIndex (stub, index) {
        console.trace('STUB overwriteAtIndex. NOT_IMPLEMENTED_YET', stub, index);

        await deleteAtIndex(index);
        await insertAtIndex(stub, index);
    }

    async function loadResponses (stub) {
        console.trace('STUB loadResponses. NOT_IMPLEMENTED_YET', stub);
        // const meta = await readFile(metaPath(stub.meta.dir));
        // return Promise.all(meta.responseFiles.map(responseFile =>
        //     readFile(responsePath(stub.meta.dir, responseFile))));
    }

    async function loadMatches (stub) {
        console.trace('STUB loadMatches. NOT_IMPLEMENTED_YET', stub);
        return stub.matches || [];
    }

    /**
     * Returns a JSON-convertible representation
     * @memberOf module:models/filesystemBackedImpostersRepository#
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
            return Promise.response({});
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
        });

        console.log('STUBS: ', imposter.stubs);
        return imposter.stubs;

        // const header = await readHeader(),
        //     responsePromises = header.stubs.map(loadResponses),
        //     stubResponses = await Promise.all(responsePromises),
        //     debugPromises = options.debug ? header.stubs.map(loadMatches) : [],
        //     matches = await Promise.all(debugPromises);
        //
        // header.stubs.forEach((stub, index) => {
        //     stub.responses = stubResponses[index];
        //     if (options.debug && matches[index].length > 0) {
        //         stub.matches = matches[index];
        //     }
        //     delete stub.meta;
        // });
        //
        // return header.stubs;
    }

    function isRecordedResponse (response) {
        console.trace('STUB isRecordedResponse', response);
        return response.is && typeof response.is._proxyResponseTime === 'number';
    }

    /**
     * Removes the saved proxy responses
     * @memberOf module:models/filesystemBackedImpostersRepository#
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
     * @memberOf module:models/mongoBackedImpostersRepository#
     * @param {Object} request - the request
     * @returns {Object} - the promise
     */
    async function addRequest (request) {
        console.trace('STUB addRequest', request);

        const helpers = require('../../util/helpers');
        const recordedRequest = helpers.clone(request);
        recordedRequest.timestamp = new Date().toJSON();
        return dbClient.addRequest(imposterId, recordedRequest);
    }

    /**
     * Returns the saved requests for the imposter
     * @memberOf module:models/mongoBackedImpostersRepository#
     * @returns {Object} - the promise resolving to the array of requests
     */
    async function loadRequests () {
        console.trace('STUB loadRequests');

        return dbClient.getRequests(imposterId);
    }

    /**
     * Deletes the requests directory for an imposter
     * @memberOf module:models/mongoBackedImpostersRepository#
     * @returns {Object} - Promise
     */
    async function deleteSavedRequests () {
        console.trace('STUB deleteSavedRequests');

        return dbClient.deleteRequests(imposterId);
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
