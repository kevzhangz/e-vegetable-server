import express from 'express'
import storeCtrl from '../controllers/store.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/store')
      .get(authCtrl.checkSignin, storeCtrl.getStoresBySearch)
      .post(authCtrl.checkSignin, storeCtrl.create)

export default router;