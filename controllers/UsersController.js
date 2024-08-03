// controllers/UsersController.js

const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = dbClient.client.db(dbClient.dbName);
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new dbClient.client.ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email, _id } = user;
    return res.status(200).json({ id: _id.toString(), email });
  }
}

module.exports = UsersController;
