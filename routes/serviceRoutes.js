
const express = require('express');
const router = express.Router();
const {
  getCategories,
  getAllServices,
  getServiceById
} = require('../controllers/serviceController');


router.get('/categories', getCategories);
router.get('/', getAllServices);
router.get('/:id', getServiceById);


module.exports = router;