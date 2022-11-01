'use strict';

const wrap = require('./wrap');

function stubRepository (imposterId, dbClient) {
    // const imposterFile = `${baseDir}/imposter.json`;
    //
    // function metaPath (stubDir) {
    //     return `${baseDir}/${stubDir}/meta.json`;
    // }
    //
    // function responsePath (stubDir, responseFile) {
    //     return `${baseDir}/${stubDir}/${responseFile}`;
    // }
    //
    // function requestPath (request) {
    //     return `${baseDir}/requests/${filenameFor(Date.parse(request.timestamp))}.json`;
    // }
    //
    // function matchPath (stubDir, match) {
    //     return `${baseDir}/${stubDir}/matches/${filenameFor(Date.parse(match.timestamp))}.json`;
    // }
    //
    // function readHeader () {
    //     return readFile(imposterFile, { stubs: [] });
    // }
    //
    // function readAndWriteHeader (caller, transformer) {
    //     return readAndWriteFile(imposterFile, caller, transformer, { stubs: [] });
    // }


    /**
     * Returns the number of stubs for the imposter
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @returns {Object} - the promise
     */
    async function count () {
        console.trace('STUB count NOT_IMPLEMENTED_YET');

        const imposter = await dbClient.getImposter(imposterId);
        if (!imposter) {
            return 0;
        }

        return imposter.creationRequest.stubs.length;
    }

    /**
     * Returns the first stub whose predicates matches the filter
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @param {Function} filter - the filter function
     * @param {Number} startIndex - the index to to start searching
     * @returns {Object} - the promise
     */
    async function first (filter, startIndex = 0) {
        console.trace('STUB first, NOT_IMPLEMENTED_YET', filter, startIndex);
        const imposter = await dbClient.getImposter(imposterId);
        if (imposter) {
            console.log(imposter);
            for (let i = startIndex; i < imposter.creationRequest.stubs.length; i += 1) {
                if (filter(imposter.creationRequest.stubs[i].predicates || [])) {
                    return { success: true, stub: wrap(imposter.creationRequest.stubs[i]) };
                }
            }
        }
        return { success: false, stub: wrap() };
    }

    /**
     * Adds a new stub to imposter
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @param {Object} stub - the stub to add
     * @returns {Object} - the promise
     */
    async function add (stub) { // eslint-disable-line no-shadow
        console.trace('STUB add. NOT_IMPLEMENTED_YET', stub);
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
        console.trace('STUB insert, NOT_IMPLEMENTED_YET', stub, index);
        return Promise.reject();
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
        console.trace('STUB delete, NOT_IMPLEMENTED_YET', index);
        return Promise.reject();
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
        console.trace('STUB overwriteAll. NOT_IMPLEMENTED_YET', newStubs);
        return Promise.reject();
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
        // return loadAllInDir(`${baseDir}/${stub.meta.dir}/matches`);
    }

    /**
     * Returns a JSON-convertible representation
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @param {Object} options - The formatting options
     * @param {Boolean} options.debug - If true, includes debug information
     * @returns {Object} - the promise resolving to the JSON object
     */
    async function toJSON (options = {}) {
        console.trace('STUB toJSON. NOT_IMPLEMENTED_YET', options);

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
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @param {Object} request - the request
     * @returns {Object} - the promise
     */
    async function addRequest (request) {
        console.trace('STUB addRequest. NOT_IMPLEMENTED_YET', request);
        return Promise.reject();
        // const helpers = require('../util/helpers'),
        //     recordedRequest = helpers.clone(request);
        //
        // recordedRequest.timestamp = new Date().toJSON();
        // await writeFile(requestPath(recordedRequest), recordedRequest);
    }

    /**
     * Returns the saved requests for the imposter
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @returns {Object} - the promise resolving to the array of requests
     */
    async function loadRequests () {
        console.trace('STUB loadRequests. NOT_IMPLEMENTED_YET');
        return Promise.reject();
        // return loadAllInDir(`${baseDir}/requests`);
    }

    /**
     * Deletes the requests directory for an imposter
     * @memberOf module:models/filesystemBackedImpostersRepository#
     * @returns {Object} - Promise
     */
    async function deleteSavedRequests () {
        console.trace('STUB deleteSavedRequests. NOT_IMPLEMENTED_YET');
        return Promise.reject();
        // await remove(`${baseDir}g/requests`);
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
