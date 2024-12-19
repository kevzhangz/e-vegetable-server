import express from 'express'
import userCtrl from '../controllers/user.controller.js'
import orderCtrl from '../controllers/order.controller.js'
import authCtrl from '../controllers/auth.controller.js'
const router =  express.Router();

router.route('/api/order')
      .post(authCtrl.checkSignin, orderCtrl.createOrder)

router.route('/api/order/:order_id')
      .get(authCtrl.checkSignin, orderCtrl.getOrderDetail)
      .put(authCtrl.checkSignin, orderCtrl.update)

router.route('/api/order/buyer/:user_id')
      .get(authCtrl.checkSignin, orderCtrl.getBuyerOrders)

router.route('/api/order/seller/:store_id')
      .get(authCtrl.checkSignin, orderCtrl.getSellerOrders)

router.route('/api/order/status/:store_id')
      .get(authCtrl.checkSignin, orderCtrl.getOrderStatusCounts)

router.param('order_id', orderCtrl.orderById)

export default router;