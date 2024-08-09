const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      const db = dbClient.client.db(dbClient.dbName);
      const usersCollection = db.collection('users');

      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exists' });
      }

      const hashedPassword = sha1(password);

      const newUser = { email, password: hashedPassword };
      const result = await usersCollection.insertOne(newUser);

      return res.status(201).json({ id: result.insertedId, email });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
