// (1) import router dari Express
const router = require('express').Router();
// (2) import multer
const multer = require('multer');
// (3) import tag controller
const tagController = require('./controller');


// (4) buat route baru
router.post('/tags', multer().none(), tagController.store);
router.put('/tags/:id', multer().none(), tagController.update);
router.delete('/tag/:id', tagController.destroy);


// (5) export router agar bisa digunakan di `app.js`
module.exports = router;