import express from 'express'
import storeCtrl from '../controllers/store.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/store')
      .post(authCtrl.checkSignin, storeCtrl.create)

export default router;