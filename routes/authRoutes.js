const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', authController.loginController);
router.post('/register', authController.registerController);
router.post('/payment',authMiddleware.requireSignIn,authController.payment);
router.get('/getAllBatches',authController.getAllBatch);
router.get('/checkEnrollment',authMiddleware.requireSignIn,authController.checkEnrollment);
// router.get('/getuserdata',authMiddleware.requireSignIn,authController.userdata);



module.exports = router;

