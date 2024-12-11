import mongoose from 'mongoose'

const StoreSchema = new mongoose.Schema({
  store_id: String,
  owner: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  geolocation: {
    type: { type: String },
    coordinates: [Number],
  },
  address: String,
  kecamatan: String,
  kelurahan: String,
  rt: String,
  rw: String,
  phone_number: String,
  image: { data: Buffer, contentType: String},
});

StoreSchema.index({ store_id: 1 }, { unique: true });
StoreSchema.index({ geolocation: "2dsphere" });

export default mongoose.model('Store', StoreSchema);