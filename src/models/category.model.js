import mongoose from 'mongoose'

const CategorySchema = new mongoose.Schema({
  store_id: { type: mongoose.Schema.ObjectId, ref: 'Store', required: true },
  category_id: { type: String, required: true },
  name: { type: String, required: true }
});

export default mongoose.model('Category', CategorySchema);