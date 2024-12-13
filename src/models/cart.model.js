import mongoose from 'mongoose'

const CartSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  store_id: {type: String, required: true},
  products: [
    {
      product_id: {type: String, required: true},
      quantity: { type: Number, required: true }
    }
  ],
});

export default mongoose.model('Cart', CartSchema);