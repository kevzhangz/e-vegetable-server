import express from 'express'
import userCtrl from '../controllers/user.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/users')
      .post(userCtrl.create)

router.route('/api/users/:email')
      .get(authCtrl.checkSignin, userCtrl.read)
      .put(authCtrl.checkSignin, userCtrl.update)

router.route('/api/users/buyer/information/:buyerEmail')
      .put(authCtrl.checkSignin, userCtrl.updateBuyerInformation)

router.param('buyerEmail', userCtrl.buyerByEmail)

export default router;