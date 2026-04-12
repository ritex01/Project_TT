const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  slot: { type: Number, required: true },
  label: { type: String, required: true }
}, { _id: false });

const systemSettingsSchema = new mongoose.Schema({
  timeSlots: { type: [timeSlotSchema], required: true }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
