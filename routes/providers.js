
const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/authController');
const { getProvidersByCategory } = require('../controllers/providerController');
const { upload } = require('../middlewares/uploadMiddleware');

const {
  getMyProfile,
  createProviderProfile,
  updateProviderProfile,
  getMySummary,
  getMyRequests
} = require('../controllers/providerController');

const { updateRequestStatus } = require('../controllers/serviceRequestController');

const { getProviderReviews } = require('../controllers/reviewController');


router.use(protect);

  router.get('/category/:category',getProvidersByCategory);

router.route('/me')
  .get(getMyProfile)
  .post(upload.single('image'), createProviderProfile)
  .put(upload.single('image'), updateProviderProfile);


router.get('/me/summary', getMySummary);
router.get('/me/requests', getMyRequests);
router.put('/me/requests/:id', updateRequestStatus);

router.get('/reviews', getProviderReviews);




module.exports = router;

