import express from 'express'
import storeCtrl from '../controllers/store.controller.js'
import categoryCtrl from '../controllers/category.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/store/:store_id/category')
      .get(authCtrl.checkSignin, categoryCtrl.findAll)

router.route('/api/category')
      .post(authCtrl.checkSignin, categoryCtrl.create)

router.route('/api/category/:category_id')
      .put(authCtrl.checkSignin, categoryCtrl.update)
      .delete(authCtrl.checkSignin, categoryCtrl.destroy)

router.param('store_id', storeCtrl.storeById)
router.param('category_id', categoryCtrl.categoryById)

export default router;