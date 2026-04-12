const mongoose = require('mongoose');

const allotmentSchema = new mongoose.Schema({
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    required: true
  },
  timeSlot: { type: Number, min: 0, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  allottedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// One department per (classroom, day, timeSlot)
allotmentSchema.index({ classroom: 1, day: 1, timeSlot: 1 }, { unique: true });
allotmentSchema.index({ department: 1 });

module.exports = mongoose.model('Allotment', allotmentSchema);
