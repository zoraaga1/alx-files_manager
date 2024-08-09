const sha1 = require('sha1');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;
      console.log('Request received with email:', email);

      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      const db = dbClient.client.db(dbClient.dbName);
      const usersCollection = db.collection('users');

      // Check if the user already exists
      const existingUser = await usersCollection.findOne({ email });
      console.log('Existing user check:', existingUser);

      if (existingUser) {
        return res.status(400).json({ error: 'Already exists' });
      }

      // Hash the password using SHA1
      const hashedPassword = sha1(password);
      console.log('Hashed password:', hashedPassword);

      const newUser = {
        email,
        password: hashedPassword,
      };

      // Insert the new user into the database
      const result = await usersCollection.insertOne(newUser);
      console.log('User inserted with ID:', result.insertedId);

      // Return the user's ID and email in the response
      return res.status(201).json({ id: result.insertedId, email });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    try {
      const token = req.header('X-Token');

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const db = dbClient.client.db(dbClient.dbName);
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ _id: dbClient.ObjectID(userId) });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
