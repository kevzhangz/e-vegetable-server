import dbErrorHandler from '../helpers/dbErrorHandler.js'
import Cart from '../models/cart.model.js'
import Product from '../models/product.model.js'

const storeProjections = {
  '__v': false
}

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
        cart.products.push({ product_id: productId, quantity });
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

export default {
  addToCart,
}