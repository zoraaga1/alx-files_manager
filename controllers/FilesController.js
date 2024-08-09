/* eslint-disable no-unused-vars */
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const imageThumbnail = require('image-thumbnail');
const Bull = require('bull');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const PAGE_SIZE = 20;

const fileQueue = new Bull('fileQueue', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    const db = await dbClient.connectDB();
    const filesCollection = db.collection('files');
    let parentFile;

    if (parentId !== 0) {
      parentFile = await filesCollection.findOne({ _id: dbClient.ObjectID(parentId) });

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const newFile = {
      userId: dbClient.ObjectID(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : dbClient.ObjectID(parentId),
    };

    if (type === 'folder') {
      await filesCollection.insertOne(newFile);
      return res.status(201).json(newFile);
    }
    if (!fs.existsSync(FOLDER_PATH)) {
      fs.mkdirSync(FOLDER_PATH, { recursive: true });
    }

    const filePath = path.join(FOLDER_PATH, uuidv4());
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

    newFile.localPath = filePath;
    const insertedFile = await filesCollection.insertOne(newFile);

    if (type === 'image') {
      fileQueue.add({ userId, fileId: insertedFile.insertedId });
    }

    return res.status(201).json(newFile);
  }

  static async getShow(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
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
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = 0, page = 0 } = req.query;
    const db = await dbClient.connectDB();
    const filesCollection = db.collection('files');

    const query = {
      userId: dbClient.ObjectID(userId),
      parentId: parentId === '0' ? 0 : dbClient.ObjectID(parentId),
    };

    const files = await filesCollection
      .find(query)
      .skip(page * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray();

    return res.status(200).json(files);
  }

  static async putPublish(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const db = await dbClient.connectDB();
    const filesCollection = db.collection('files');

    const file = await filesCollection.findOne(
      { _id: dbClient.ObjectID(id), userId: dbClient.ObjectID(userId) },
    );

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await filesCollection.updateOne(
      { _id: dbClient.ObjectID(id) },
      { $set: { isPublic: true } },
    );

    const updatedFile = await filesCollection.findOne({ _id: dbClient.ObjectID(id) });
    return res.status(200).json(updatedFile);
  }

  static async putUnpublish(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const db = await dbClient.connectDB();
    const filesCollection = db.collection('files');

    const file = await filesCollection.findOne(
      { _id: dbClient.ObjectID(id), userId: dbClient.ObjectID(userId) },
    );

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await filesCollection.updateOne(
      { _id: dbClient.ObjectID(id) },
      { $set: { isPublic: false } },
    );

    const updatedFile = await filesCollection.findOne({ _id: dbClient.ObjectID(id) });
    return res.status(200).json(updatedFile);
  }

  static async getFile(req, res) {
    const { id } = req.params;
    const { size } = req.query;
    const token = req.header('X-Token') || null;

    const db = await dbClient.connectDB();
    const filesCollection = db.collection('files');

    const file = await filesCollection.findOne({ _id: dbClient.ObjectID(id) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!file.isPublic) {
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId || file.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    let filePath = file.localPath;
    if (size && ['100', '250', '500'].includes(size)) {
      filePath = `${file.localPath}_${size}`;
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name);
    res.setHeader('Content-Type', mimeType);

    const fileContent = fs.readFileSync(filePath);
    return res.status(200).send(fileContent);
  }
}

module.exports = FilesController;
