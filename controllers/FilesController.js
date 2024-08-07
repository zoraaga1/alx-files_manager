const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class FilesController {
  // Existing methods...

  static async putPublish(req, res) {
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

    await filesCollection.updateOne({ _id: dbClient.ObjectID(id) }, { $set: { isPublic: true } });

    const updatedFile = await filesCollection.findOne({ _id: dbClient.ObjectID(id) });

    return res.status(200).json(updatedFile);
  }

  static async putUnpublish(req, res) {
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

    await filesCollection.updateOne({ _id: dbClient.ObjectID(id) }, { $set: { isPublic: false } });

    const updatedFile = await filesCollection.findOne({ _id: dbClient.ObjectID(id) });

    return res.status(200).json(updatedFile);
  }
}

module.exports = FilesController;
