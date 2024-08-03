// routes/index.js

const express = require('express');
const AppController = require('../controllers/AppController');
const FilesController = require('../controllers/FilesController');
const AuthController = require('../controllers/AuthController');
const UsersController = require('../controllers/UsersController');

const router = express.Router();

// Existing routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// New routes
router.post('/files', FilesController.postUpload);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

module.exports = router;
