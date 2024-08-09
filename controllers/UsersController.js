import sha1 from 'sha1';
import Queue from 'bull/lib/queue';
import dbClient from '../utils/db';

const userQueue = new Queue('email sending');

export default class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const usersCollection = await dbClient.usersCollection();
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Already exists' });
    }

    const hashedPassword = sha1(password);
    const insertionInfo = await usersCollection.insertOne({
      email,
      password: hashedPassword,
    });

    const userId = insertionInfo.insertedId.toString();

    userQueue.add({ userId });

    return res.status(201).json({ email, id: userId });
  }

  static async getMe(req, res) {
    const { user } = req;

    return res.status(200).json({
      email: user.email,
      id: user._id.toString(),
    });
  }
}
