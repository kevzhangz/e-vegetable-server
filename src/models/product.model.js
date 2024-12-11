import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  store_id: { type: String, required: true },
  category_id: { type: String, required: true },
  product_id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  image: { data: Buffer, contentType: String},
});

export default mongoose.model('Product', ProductSchema);