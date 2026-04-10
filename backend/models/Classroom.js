const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  building: { type: String, default: '', trim: true },
  capacity: { type: Number, default: 60 }
}, { timestamps: true });

module.exports = mongoose.model('Classroom', classroomSchema);
