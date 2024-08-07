const { MongoClient, ObjectID } = require('mongodb');

const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = 'yourDatabaseName';

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
  }
  return db;
}

module.exports = {
  async connectDB() {
    if (!db) {
      await client.connect();
      db = client.db(dbName);
    }
    return db;
  },
  get db() {
    return db;
  },
  async users() {
    const db = await connectDB();
    return db.collection('users');
  },
  ObjectID,
};
