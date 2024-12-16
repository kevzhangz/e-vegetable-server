import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  store_id: { type: String, required: true },
  order_id: { type: String, required: true },
  products: [
    {
      product_name: {type: String, required: true},
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  total_price: { type: Number, required: true },
  address: { type: String, required: true },
  delivery_type: { type: String, required: true },
  status: { type: String, required: true },
  datetime: { type: String, required: true },
});

export default mongoose.model('Order', OrderSchema);