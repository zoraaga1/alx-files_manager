/* eslint-disable no-unused-vars */
const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const path = require('path');
const dbClient = require('./utils/db');

const fileQueue = new Bull('fileQueue', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const db = await dbClient.connectDB();
  const filesCollection = db.collection('files');

  const file = await filesCollection.findOne(
    { _id: dbClient.ObjectID(fileId), userId: dbClient.ObjectID(userId) },
  );

  if (!file) {
    throw new Error('File not found');
  }

  const filePath = file.localPath;

  try {
    const sizes = [500, 250, 100];
    const thumbnailPromises = sizes.map(async (width) => {
      const thumbnail = await imageThumbnail(filePath, { width });
      const thumbnailPath = `${filePath}_${width}`;
      fs.writeFileSync(thumbnailPath, thumbnail);
    });

    await Promise.all(thumbnailPromises);
  } catch (error) {
    console.error('Error generating thumbnails:', error);
    throw error;
  }

  return true; // Ensure consistent return
});
