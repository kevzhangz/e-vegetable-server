import express from 'express'
import userCtrl from '../controllers/user.controller.js'
import orderCtrl from '../controllers/order.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/order')
      .post(authCtrl.checkSignin, orderCtrl.createOrder)

router.param('user_id', userCtrl.userById)

export default router;