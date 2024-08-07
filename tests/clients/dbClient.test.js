const request = require('supertest');
const { MongoClient } = require('mongodb');
const app = require('../../server'); // Adjust path to your actual server file

// Mock MongoDB connection
const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
let db;

beforeAll(async () => {
  await client.connect();
  db = client.db('test'); // use a test database
});

afterAll(async () => {
  await client.close();
});

describe('Database Client Tests', () => {
  it('should connect to MongoDB', async () => {
    expect(db).not.toBeNull();
  });

  it('should insert and retrieve a document', async () => {
    const testCollection = db.collection('test');
    const testDocument = { name: 'test', value: 'testValue' };

    await testCollection.insertOne(testDocument);

    const result = await testCollection.findOne({ name: 'test' });
    expect(result).toHaveProperty('value', 'testValue');
  });

});
