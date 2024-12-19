import dbErrorHandler from '../helpers/dbErrorHandler.js'
import Cart from '../models/cart.model.js'
import Product from '../models/product.model.js'
import Store from '../models/store.model.js'
import generator from '../helpers/generator.js'

const addToCart = async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    // Validate input
    if (!user_id|| !product_id || !quantity) {
      return res.status(400).json({ error: 'Something went wrong' });
    }

    // Find the product details
    const product = await Product.findOne({ product_id: product_id });
    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }

    if(quantity > product.stock){
      return res.status(404).json({ error: 'Stock tidak mencukupi' });
    }

    // Find the user's cart
    let cart = await Cart.findOne({ user_id: user_id });

    if (cart) {
      // Check if the product belongs to the same store
      if (cart.store_id !== product.store_id) {
        // Empty the cart if the product is from a different store
        cart.products = [];
        cart.store_id = product.store_id;
      }

      // Check if the product is already in the cart
      const existingProductIndex = cart.products.findIndex(p => p.product_id === product_id);

      if (existingProductIndex > -1) {
        // Update quantity if product exists
        cart.products[existingProductIndex].quantity += quantity;
      } else {
        // Add new product to the cart
        cart.products.push({ product_id: product_id, quantity });
      }

      // Save the updated cart
      await cart.save();
    } else {
      // Create a new cart if none exists
      cart = new Cart({
        user_id: user_id,
        store_id: product.store_id,
        products: [{ product_id: product_id, quantity }],
      });

      await cart.save();
    }

    res.status(200).json({ message: 'Produk telah berhasil ditambah ke dalam keranjang', cart });

  } catch (err){
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const getUserCart = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Fetch the user's cart
    const cart = await Cart.findOne({ user_id: user_id });
    if (!cart) {
      return res.status(200).json({ message: 'Cart not found' });
    }

    // Fetch the store details
    const store = await Store.findOne({ store_id: cart.store_id });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Use $geoNear to calculate the distance between the user and the store
    const distanceResult = await Store.aggregate([
      {
        $geoNear: {
          near: req.user.geolocation,
          distanceField: 'distance',
          spherical: true,
        },
      },
      {
        $match: { store_id: cart.store_id },
      },
      {
        $limit: 1,
      },
    ]);

    if (distanceResult.length === 0) {
      return res.status(404).json({ message: 'Store not found near the user location' });
    }

    const distance = distanceResult[0].distance / 1000; // Convert meters to kilometers

    // Calculate delivery fee based on distance
    const deliveryFee = generator.calculateDeliveryFee(distance);

    // Fetch product details for items in the cart
    const cartItems = await Promise.all(
      cart.products.map(async (item) => {
        const product = await Product.findOne({ product_id: item.product_id });
        if (!product) {
          return null;
        }
        return {
          product_id: product.product_id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          quantity: item.quantity,
          image: product.image.data.toString('base64')
        };
      })
    );

    // Filter out any null values in case a product was not found
    const validCartItems = cartItems.filter((item) => item !== null);

    res.status(200).json({
      store_id: store.store_id,
      store_name: store.name,
      delivery_fee: deliveryFee,
      cart_items: validCartItems,
    });
  } catch (error) {
    return res.status(500).json({
      error: dbErrorHandler.getErrorMessage(error)
    })
  }
};

const updateUserCart = async (req, res) => {
  try {
    const { user_id, product_id, action } = req.body;

    // Fetch the user's cart
    const cart = await Cart.findOne({ user_id });
    if (!cart) {
      return res.status(404).json({ message: 'Something went wrong' });
    }

    // Fetch the product details
    const product = await Product.findOne({ product_id });
    if (!product) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    // Check if the product is in the cart
    const productIndex = cart.products.findIndex((item) => item.product_id === product_id);

    if (productIndex === -1) {
      return res.status(400).json({ message: 'Product tidak didalam keranjang' });
    }

    // Update quantity of existing product
    const currentQuantity = cart.products[productIndex].quantity;
    const newQuantity =
      action === 'increment' ? currentQuantity + 1 : currentQuantity - 1;

    // Validate quantity
    if (newQuantity > product.stock) {
      return res.status(400).json({ message: 'Stok produk tidak mencukupi' });
    } else if (newQuantity === 0) {
      // Remove product from cart if quantity becomes 0
      cart.products.splice(productIndex, 1);
    } else {
      // Update quantity
      cart.products[productIndex].quantity = newQuantity;
    }

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: 'Keranjang berhasil terupdate' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default {
  addToCart,
  getUserCart,
  updateUserCart
}