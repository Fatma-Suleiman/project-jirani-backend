const express = require('express');   
const router = express.Router();
const { protect } = require('../controllers/authController');
const {
  createReview,
  getAllReviews,
  getProviderReviews
} = require('../controllers/reviewController');


router.get('/all', getAllReviews);


router.post('/', protect, createReview);


router.get('/provider', protect, getProviderReviews);

module.exports = router;
