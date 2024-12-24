import express from 'express'
import storeCtrl from '../controllers/store.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/store')
      .get(authCtrl.checkSignin, storeCtrl.getStoresBySearch)
      .post(authCtrl.checkSignin, storeCtrl.create)

router.route('/api/store/:store_id')
      .get(authCtrl.checkSignin, storeCtrl.getStoreInformation)
      .put(authCtrl.checkSignin, storeCtrl.update)

router.param('store_id', storeCtrl.storeById)

export default router;