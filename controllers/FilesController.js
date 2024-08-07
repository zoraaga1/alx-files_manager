const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

// Define a default path for storing files
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    try {
      const token = req.header('X-Token');

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the user ID associated with the token
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        name, type, parentId, isPublic = false, data,
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing or invalid type' });
      }

      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      if (parentId) {
        const parentFile = await dbClient.files.findOne({ _id: dbClient.ObjectID(parentId) });

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Create the file or folder
      const fileData = {
        userId,
        name,
        type,
        parentId: parentId || 0,
        isPublic,
      };

      if (type !== 'folder') {
        const fileId = uuidv4();
        const filePath = path.join(FOLDER_PATH, fileId);

        // Ensure the directory exists
        if (!fs.existsSync(FOLDER_PATH)) {
          fs.mkdirSync(FOLDER_PATH, { recursive: true });
        }

        // Save the file data
        fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

        fileData.localPath = filePath;
      }

      const result = await dbClient.files.insertOne(fileData);

      return res.status(201).json({
        id: result.insertedId,
        name: fileData.name,
        type: fileData.type,
        isPublic: fileData.isPublic,
        parentId: fileData.parentId,
        localPath: fileData.localPath,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
