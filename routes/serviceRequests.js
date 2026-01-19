const express = require('express');
const { protect } = require('../controllers/authController');
const {
  getCompletedRequests,     
  getCompletedForSeeker,    
  updateRequestStatus
} = require('../controllers/serviceRequestController');

const router = express.Router();

router.get('/completed', protect, getCompletedForSeeker);


router.get('/completed/provider', protect, getCompletedRequests);


router.patch('/:id/status', protect, updateRequestStatus);

module.exports = router;
