import express from 'express'
import storeCtrl from '../controllers/store.controller.js'
import cartCtrl from '../controllers/cart.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/cart')
      .post(authCtrl.checkSignin, cartCtrl.addToCart);

router.param('store_id', storeCtrl.storeById)

export default router;