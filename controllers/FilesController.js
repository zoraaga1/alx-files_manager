const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const PAGE_SIZE = 20; // Define the constant outside the class

class FilesController {
  static async getShow(req, res) {
    const token = req.header('X-Token');
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = await dbClient.connectDB();
    const filesCollection = db.collection('files');
    const file = await filesCollection.findOne(
      { _id: dbClient.ObjectID(id), userId: dbClient.ObjectID(userId) },
    );

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.header('X-Token');
    const { parentId = 0, page = 0 } = req.query;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = await dbClient.connectDB();
    const filesCollection = db.collection('files');
    const skip = page * PAGE_SIZE;

    const files = await filesCollection.aggregate([
      {
        $match: {
          userId: dbClient.ObjectID(userId),
          parentId: parseInt(parentId, 10),
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: PAGE_SIZE,
      },
    ]).toArray();

    return res.status(200).json(files);
  }
}

module.exports = FilesController;
