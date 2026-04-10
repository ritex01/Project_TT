const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'hod', 'faculty'], required: true },
  authId: { type: String, unique: true, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  approved: { type: Boolean, default: false },
  token: { type: String, default: null }
}, { timestamps: true });

userSchema.index({ token: 1 });
userSchema.index({ role: 1 });
userSchema.index({ approved: 1 });

module.exports = mongoose.model('User', userSchema);
