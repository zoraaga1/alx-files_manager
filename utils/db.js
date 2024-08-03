// utils/db.js

const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.dbName = database;
    this.client.connect()
      .then(() => {
        console.log('Connected successfully to MongoDB');
      })
      .catch((err) => {
        console.error('MongoDB connection error:', err);
      });
  }

  isAlive() {
    return this.client && this.client.isConnected();
  }

  async nbUsers() {
    if (!this.isAlive()) {
      return 0;
    }

    const db = this.client.db(this.dbName);
    return db.collection('users').countDocuments();
  }

  async nbFiles() {
    if (!this.isAlive()) {
      return 0;
    }

    const db = this.client.db(this.dbName);
    return db.collection('files').countDocuments();
  }
}

// Export an instance of DBClient
const dbClient = new DBClient();
module.exports = dbClient;
