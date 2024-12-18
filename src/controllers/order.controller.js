import dbErrorHandler from '../helpers/dbErrorHandler.js'
import generator from '../helpers/generator.js'
import User from '../models/user.model.js'
import Store from '../models/store.model.js'
import Product from '../models/product.model.js'
import Cart from '../models/cart.model.js'
import Order from '../models/order.model.js'
import extend from 'lodash/extend.js'

const storeProjections = {
  '__v': false
}

const findOrderByUser = async (req, res) => {
    try {
        let query = {};

        query.user_id = req.user.user_id;

        let result = await Order.find(query, storeProjections).sort({ _id: -1});

        return res.status(200).json({result})
    } catch (err) {
        return res.status(500).json({
        error: dbErrorHandler.getErrorMessage(err)
        })
    }
}

const createOrder = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.user_id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const store = await Store.findOne({ store_id: req.body.store_id });
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const orderedProducts = req.body.products;

    // Check and update product stock
    for (const product of orderedProducts) {
      const dbProduct = await Product.findOne({ product_id: product.product_id });
      if (!dbProduct) {
        return res.status(404).json({ error: `Product not found: ${product.product_name}` });
      }
      if (dbProduct.stock < product.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product: ${product.product_name}` });
      }
      dbProduct.stock -= product.quantity;
      await dbProduct.save();
    }

    // Create the order
    const newOrder = {
      ...req.body,
      user_id: user._id,
      store_id: store.store_id,
      order_id: generator.generateId(6),
      datetime: new Date().toISOString(),
    };

    const order = new Order(newOrder);
    await order.save();

    // Clear the user's cart
    await Cart.findOne({ user_id: user._id }).deleteOne();

    await generator.sendNotificationToUser(store.owner, 'Anda memiliki pesanan baru!', 'Silahkan buka aplikasi untuk melihat pesanan')
    await generator.sendNotificationToUser(user._id, 'Pesanan anda telah diterima oleh penjual', 'Silahkan menunggu konfirmasi pesanan dari penjual')

    order.__v = undefined;
    order._id = undefined;

    res.status(200).json({
      "message": "Order successfully created",
      "order_id": order.order_id
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: dbErrorHandler.getErrorMessage(err) });
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const order = req.order;

    // Fetch the store details
    const store = await Store.findOne({ store_id: order.store_id });

    // Structure the response
    const response = {
      order_id: order.order_id,
      datetime: order.datetime,
      store: {
        name: store.name,
        address: store.address,
      },
      products: order.products.map((product) => ({
        product_id: product.product_id,
        product_name: product.product_name,
        quantity: product.quantity,
        price: product.price,
      })),
      delivery_fee: order.delivery_fee,
      total_price: order.total_price,
      address: order.address,
      kecamatan: order.kecamatan || null,
      kelurahan: order.kelurahan || null,
      rt: order.rt || null,
      rw: order.rw || null,
      status: order.status,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('Error fetching order detail:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const orderById = async (req, res, next, id) => {
  try {
    const order = await Order.findOne({order_id: id});

    if(!order){
      throw Error("Order not found");
    }

    req.order = order
    next()
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const update = async (req, res) => {
  try {
    let product = req.product

    if(req.body.image){
      let buffer = Buffer.from(req.body.image, 'base64')
      req.body.image = {};
      req.body.image.data = buffer;
      req.body.image.contentType = 'img/jpeg';
    }

    product = extend(product, req.body)
    await product.save();

    return res.status(200).json({
      messages : 'Product Successfully updated'
    });
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const destroy = async (req, res) => {
  try {
    const product = req.product

    await product.deleteOne();

    return res.status(200).json({
      messages: 'Product Successfully deleted'
    })
  } catch (err) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

export default {
  createOrder,
  getOrderDetail,
  orderById,
  update,
  destroy,
}