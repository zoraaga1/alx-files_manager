// controllers/UsersController.js

const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class UsersController {
  // Existing methods (postNew, etc.)

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve user ID from Redis
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve user details from MongoDB
    const db = dbClient.client.db(dbClient.dbName);
    const user = await db.collection('users').findOne({ _id: new dbClient.client.ObjectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return user information
    return res.status(200).json({ id: user._id, email: user.email });
  }
}

module.exports = UsersController;
