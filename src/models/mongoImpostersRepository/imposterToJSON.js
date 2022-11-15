'use strict';

function createHeader (imposter, options) {
    const result = {
        protocol: imposter.protocol,
        port: imposter.port
    };

    if (imposter.name) {
        result.name = imposter.name;
    }
    if (imposter.defaultResponse) {
        result.defaultResponse = imposter.defaultResponse;
    }
    // FIXME: add numberOfRequests
    // if (!options.replayable) {
    //     result.numberOfRequests = numberOfRequests;
    // }
    if (!options.list) {
        result.recordRequests = Boolean(imposter.recordRequests);

        // Object.keys(server.metadata).forEach(key => {
        //     result[key] = server.metadata[key];
        // });
    }
    // if (header.endOfRequestResolver) {
    //     result.endOfRequestResolver = header.endOfRequestResolver;
    // }

    return result;
}

function getBaseURL (imposter) {
    return `/imposters/${imposter.port}`;
}

function addLinksTo (imposter) {
    console.trace('addLinksTo');

    const baseURL = getBaseURL(imposter);
    imposter._links = {
        self: { href: baseURL },
        stubs: { href: `${baseURL}/stubs` }
    };

    if (imposter.stubs) {
        for (let i = 0; i < imposter.stubs.length; i += 1) {
            imposter.stubs[i]._links = { self: { href: `${baseURL}/stubs/${i}` } };
        }
    }
}
async function addRequestsTo (imposter, loadRequests) {
    console.trace('addRequestsTo');
    imposter.requests = await loadRequests();
    return imposter;
}

async function addStubsTo (imposter, options, repo) {
    console.trace('addStubsTo, options', options);
    const newOptions = {};
    if (!options.replayable) {
        newOptions.debug = true;
    }

    // TODO: Add function for stubs
    imposter.stubs = await repo.toJSON(newOptions);
    return imposter;
}

function removeProxiesFrom (imposter) {
    imposter.stubs.forEach(stub => {
        // eslint-disable-next-line no-prototype-builtins
        stub.responses = stub.responses.filter(response => !response.hasOwnProperty('proxy'));
    });
    imposter.stubs = imposter.stubs.filter(stub => stub.responses.length > 0);
}

function removeNonEssentialInformationFrom (imposter) {
    console.trace('removeNonEssentialInformationFrom');
    const helpers = require('../../util/helpers');

    imposter.stubs.forEach(stub => {
        stub.responses.forEach(response => {
            if (helpers.defined(response.is)) {
                delete response.is._proxyResponseTime;
            }
        });
    });
}

async function toJSON (imposter, options, repo) {
    // I consider the order of fields represented important.  They won't matter for parsing,
    // but it makes a nicer user experience for developers viewing the JSON to keep the most
    // relevant information at the top. Some of the order of operations in this file represents
    // that (e.g. keeping the _links at the end), and is tested with some documentation tests.
    const result = createHeader(imposter, options);

    options = options || {};

    if (options.list) {
        addLinksTo(result);
        return result;
    }

    console.trace('toJSON, options', options);
    if (!options.replayable) {
        await addRequestsTo(result, repo.loadRequests);
    }

    await addStubsTo(result, options, repo);

    if (options.replayable) {
        removeNonEssentialInformationFrom(result);
    }
    else {
        addLinksTo(result);
    }

    if (options.removeProxies) {
        removeProxiesFrom(result);
    }

    return result;
}

module.exports = toJSON;
