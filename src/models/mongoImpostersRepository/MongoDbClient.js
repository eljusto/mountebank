'use strict';
/* eslint-disable */

const util = require('util');

const {
    MongoClient,
    ObjectId
} = require('mongodb');

const MONGO_CONNECTION_STRING = util.format(
    'mongodb://%s:%s@%s/?replicaSet=%s&authSource=%s&ssl=true',
    'mockritsa',
    'jieChie9xeiveeng',
    'sas-t2977526oiqmis5i.db.yandex.net:27018',
    'rs01',
    'imposters'
);

class MongoDbClient {
    constructor () {
        this.client = null;
        this.dbConnection = null;
    }

    async connectToServer (callback) {
        const options = {
            sslValidate: false
        };
        try {
            this.client = await MongoClient.connect(MONGO_CONNECTION_STRING, options);
            this.dbConnection = this.client.db('imposters');
            console.log('Successfully connected to MongoDB.');

            return callback();
        }
        catch (e) {
            return callback(e);
        }
    }

    getDb () {
        return this.dbConnection;
    }

    stop () {
        return this.client.close();
    }

    addImposter (data) {
        return this.getDb()
            .collection('imposters')
            .insertOne(data);
    }

    async getAllImposters (transformFn) {
        console.trace('CLIENT getAllImposters');
        try {
            const res = await this
                .getDb()
                .collection('imposters')
                .find({})
                .map(transformFn)
                .toArray();
            console.log(res);
            return res;
        } catch (e) {
            console.error('CLIENT getAllImposters', e);
            return Promise.reject(e);
        }
    }

    async getImposter (id) {
        try {
            return this.getDb()
                .collection('imposters')
                .findOne(this.getQueryForId(id));
        } catch (e) {
            console.error('GET_IMPOSTER_ERROR', e);
            return Promise.resolve(null);
        }
    }

    getQueryForId (id) {
        return {
            url: `/imposters/${ id }`
        };
    }

    deleteImposter (id) {
        return this.getDb()
            .collection('imposters')
            .deleteOne(this.getQueryForId(id));
    }

    async deleteAllImposters (transformFn) {
        console.trace('CLIENT deteleAllImposters');
        const res = await this.getDb()
        .collection('imposters')
        .deleteMany();
        console.log(res);

        return res;
    }
}

module.exports = MongoDbClient;
