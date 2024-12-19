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

const getBuyerOrders = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { filter } = req.query; // 'history' or 'in_progress'

    // Define the status filter condition
    let statusCondition = {};
    if (filter === 'Riwayat') {
      statusCondition = { status: 'Pesanan Selesai' }; // Orders with status 'selesai'
    } else if (filter === 'Dalam Proses') {
      statusCondition = { status: { $ne: 'Pesanan Selesai' } }; // Orders NOT equal to 'selesai'
    }

    // Fetch orders by user_id and status condition
    const orders = await Order.find({ user_id: user_id, ...statusCondition });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user.' });
    }

    // Format the orders to match the output structure
    const formattedOrders = orders.map((order) => ({
      order_id: order.order_id,
      address: order.address,
      deliveryType: order.delivery_type.charAt(0).toUpperCase() + order.delivery_type.slice(1), // Capitalize
      price: `Rp ${order.total_price.toLocaleString('id-ID')}`, // Format price with 'Rp' and thousand separator
      date: new Date(order.datetime).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    }));

    // Return the formatted order list
    return res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getSellerOrders = async (req, res) => {
  try {
    const { store_id } = req.params;
    const { filter, status } = req.query; // delivery/pickup filter and status filter

    let conditions = {};

    // Build query conditions
    conditions.store_id = store_id;

    if (filter) {
      conditions.delivery_type = filter.toLowerCase(); // Match delivery_type: 'delivery' or 'pickup'
    }

    if (status) {
      conditions.status = status; // Match status condition
    }

    // Fetch orders based on conditions
    const orders = await Order.find(conditions).sort({ datetime: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this store.' });
    }

    // Format the orders to match the output structure
    const formattedOrders = orders.map((order) => ({
      order_id: order.order_id,
      address: order.address,
      deliveryType: order.delivery_type.charAt(0).toUpperCase() + order.delivery_type.slice(1), // Capitalize
      price: `Rp ${order.total_price.toLocaleString('id-ID')}`, // Format price with 'Rp' and thousand separator
      date: new Date(order.datetime).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    }));

    // Return the formatted order list
    return res.status(200).json(formattedOrders);
  } catch (error) {
    console.error('Error fetching store orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrderStatusCounts = async (req, res) => {
  try {
    const { store_id } = req.params;

    const excludedStatus = "Pesanan Selesai";

    // Aggregate query to count orders by status
    const statusCounts = await Order.aggregate([
      {
        $match: {
          store_id: store_id,
          status: { $ne: excludedStatus }, // Exclude "Pesanan Selesai"
        },
      },
      {
        $group: {
          _id: "$status", // Group by status
          count: { $sum: 1 },
        },
      },
    ]);

    const output = {
      pesanan_baru: 0,
      siap_dikirim: 0,
      sedang_dikirim: 0,
      telah_siap_dikirim: 0,
    };

    statusCounts.forEach((status) => {
      const key = status._id.toLowerCase().replace(/ /g, "_");
      if (output[key] !== undefined) {
        output[key] = status.count;
      }
    });

    // Return the response
    return res.status(200).json(output);
  } catch (error) {
    console.error("Error fetching order status counts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getOrderDetail = async (req, res) => {
  try {
    const order = req.order;

    // Fetch the store details
    const store = await Store.findOne({ store_id: order.store_id });

    const orderDate = new Date(order.datetime);

    // Structure the response
    const response = {
      order_id: order.order_id,
      datetime: `${orderDate.getUTCDate()} ${orderDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })} ${orderDate.getUTCFullYear()} ${orderDate.toTimeString().split(' ')[0]}`,
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
      delivery_type: order.delivery_type,
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
    let order = req.order;

    let oldStatus = order.status;
    order.status = req.body.status;

    order.save();

    let title = '';
    let content = '';

    if(order.delivery_type == 'pickup'){
      if(req.body.status == 'Siap dikemas'){
        title = 'Pesanan Anda telah dikemas!'
        content = 'Pesanan anda telah dikemas, silahkan menuju toko untuk mengambil pesanan'
      }
    } else if(order.delivery_type == 'delivery'){
      if(req.body.status == 'Siap dikirim'){
        title = 'Pesanan Anda telah siap dikirim!'
        content = 'Pesanan Anda telah diterima dan siap dikirim.'
      } else if(req.body.status == 'Sedang dikirim'){
        title = 'Pesanan Anda sedang dikirim!'
        content = 'Pesanan Anda sedang dalam perjalanan.'
      } else if(req.body.status == 'Telah siap dikirim'){
        title = 'Pesanan Anda sudah sampai!'
        content = 'Pesanan Anda telah tiba, siap untuk diterima.'
      }
    }

    await generator.sendNotificationToUser(order.user_id, title, content);
    return res.status(200).json({message: "Status Pesanan telah berhasil diupdate"});

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
  getBuyerOrders,
  getSellerOrders,
  getOrderDetail,
  getOrderStatusCounts,
  orderById,
  update,
  destroy,
}