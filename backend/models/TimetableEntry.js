const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    required: true
  },
  timeSlot: { type: Number, min: 0, max: 7, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batch: { type: String, default: '' },
  section: { type: String, required: true },
  subsection: { type: String, default: null },
  subject: { type: String, default: '' },
  year: { type: Number, required: true, min: 1, max: 4 },
  type: { type: String, enum: ['lecture', 'lab'], default: 'lecture' },
  isSecondSlot: { type: Boolean, default: false },
  linkedEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'TimetableEntry', default: null }
}, { timestamps: true });

// Fast conflict checking indexes
timetableEntrySchema.index({ classroom: 1, day: 1, timeSlot: 1 });
timetableEntrySchema.index({ faculty: 1, day: 1, timeSlot: 1 });
timetableEntrySchema.index({ department: 1, section: 1, day: 1, timeSlot: 1 });
timetableEntrySchema.index({ department: 1 });

module.exports = mongoose.model('TimetableEntry', timetableEntrySchema);
