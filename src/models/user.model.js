import mongoose from 'mongoose'
import crypto from 'crypto'

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: "Username is required",
  },
  name: {
    type: String,
    required: "Name is required",
  },
  email: {
    type: String,
    required: "Email is required",
  },
  hashed_password: {
    type: String,
    required: "Password is required"
  },
  role: {
    type: String,
    required: "Role is required"
  },
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
  has_store: { type: Boolean, default: false },
  is_verified: { type: Boolean, default: false },
  profile: { data: Buffer, contentType: String},
  salt: String,
})

UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password
    this.salt = this.makeSalt()
    this.hashed_password = this.encryptPassword(password)
  })
  .get(function() {
    return this._password
  })

UserSchema.path('hashed_password').validate(function(v) {
  if (this._password && this._password.length < 6) {
    this.invalidate('password', 'Password must be at least 6 characters.')
  }
}, null)

UserSchema.methods = {
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password
  },
  encryptPassword: function(password) {
    if (!password) return ''
    try {
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex')
    } catch (err) {
      return ''
    }
  },
  makeSalt: function() {
    return Math.round((new Date().valueOf() * Math.random())) + ''
  }
}

UserSchema.index({ email: 1, role: 1 }, { unique: true });
UserSchema.index({ geolocation: "2dsphere" });

export default mongoose.model('User', UserSchema);