import express from 'express'
import userCtrl from '../controllers/user.controller.js'
import cartCtrl from '../controllers/cart.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/cart')
      .post(authCtrl.checkSignin, cartCtrl.addToCart)
      .put(authCtrl.checkSignin, cartCtrl.updateUserCart);

router.route('/api/cart/:user_id')
      .get(authCtrl.checkSignin, cartCtrl.getUserCart);

router.param('user_id', userCtrl.userById)

export default router;