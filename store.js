const { MongoClient } = require('mongodb');

const { createSeed } = require('./seed-defaults');

 
console.log(process.env.MONGODB_URI);

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

const DB_NAME = process.env.MONGODB_DB || 'volunteers';

const DOC_ID = 'main';

 

let collectionPromise = null;

 

// Single-document store; compare-and-swap on `version` is enforced by the filter in saveState.

function getCollection() {

  if (!collectionPromise) {

    collectionPromise = (async () => {

      const client = await MongoClient.connect(URI);

      const col = client.db(DB_NAME).collection('state');

      await ensureSeed(col);

      return col;

    })().catch(err => {

      collectionPromise = null;

      throw err;

    });

  }

  return collectionPromise;

}

 

async function ensureSeed(col) {

  const exists = await col.countDocuments({ _id: DOC_ID }, { limit: 1 });

  if (exists) return;

  try {

    await col.insertOne({ _id: DOC_ID, ...createSeed() });

  } catch (err) {

    if (err.code !== 11000) throw err;

  }

}

 

function stripId({ _id, ...rest }) {

  return rest;

}

 

async function readState() {

  const col = await getCollection();

  const doc = await col.findOne({ _id: DOC_ID });

  return stripId(doc);

}

 

// Returns {ok:true,state} or {ok:false,state:current}.

async function saveState(expectedVersion, newState) {

  const col = await getCollection();

  const { _id, ...body } = newState;

  const result = await col.replaceOne(

    { _id: DOC_ID, version: expectedVersion },

    { ...body, _id: DOC_ID, version: expectedVersion + 1 }

  );

  if (result.matchedCount === 1) {

    return { ok: true, state: { ...body, version: expectedVersion + 1 } };

  }

  return { ok: false, state: await readState() };

}

 

module.exports = { readState, saveState };