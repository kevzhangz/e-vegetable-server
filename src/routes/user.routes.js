import express from 'express'
import userCtrl from '../controllers/user.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/users')
      .post(userCtrl.create)

router.route('/api/users/:user_id')
      .put(userCtrl.update)

router.route('/api/users/password/:user_id')
      .put(userCtrl.updatePassword)

router.route('/api/users/:email')
      .get(authCtrl.checkSignin, userCtrl.read)
      .put(authCtrl.checkSignin, userCtrl.update)

router.route('/api/users/buyer/information/:buyerEmail')
      .put(authCtrl.checkSignin, userCtrl.updateBuyerInformation)

router.param('buyerEmail', userCtrl.buyerByEmail)
router.param('user_id', userCtrl.userById)

export default router;