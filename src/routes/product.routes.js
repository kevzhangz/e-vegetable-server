import express from 'express'
import storeCtrl from '../controllers/store.controller.js'
import categoryCtrl from '../controllers/category.controller.js'
import productCtrl from '../controllers/product.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/store/:store_id/category/:category_id/product')
      .get(authCtrl.checkSignin, productCtrl.findCategoryProduct)

router.route('/api/store/:store_id/product')
      .get(authCtrl.checkSignin, productCtrl.findAll)
    
router.route('/api/product/:product_id')
      .get(authCtrl.checkSignin, productCtrl.read)
      .put(authCtrl.checkSignin, productCtrl.update)
      .delete(authCtrl.checkSignin, productCtrl.destroy)

router.route('/api/product')
      .post(authCtrl.checkSignin, productCtrl.create)

router.param('store_id', storeCtrl.storeById)
router.param('category_id', categoryCtrl.categoryById)
router.param('product_id', productCtrl.productById)

export default router;