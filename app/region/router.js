const router = require('express').Router();
const regionController = require('./controller');

router.get('/region/provinsi', regionController.getProvinsi);
router.get('/region/kabupaten', regionController.getKabupaten);
router.get('/region/kecamatan', regionController.getKecamatan);
router.get('/region/desa', regionController.getDesa);

module.exports = router;