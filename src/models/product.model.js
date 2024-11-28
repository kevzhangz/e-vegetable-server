import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  store_id: { type: mongoose.Schema.ObjectId, ref: 'Store', required: true },
  category_id: { type: mongoose.Schema.ObjectId, ref: 'Category', required: true },
  product_id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true }
});

export default mongoose.model('Product', ProductSchema);