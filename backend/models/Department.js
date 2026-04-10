const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subsections: { type: [String], default: [] }
}, { _id: false });

const batchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sections: { type: [sectionSchema], default: [] }
});

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, uppercase: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  color: { type: String, required: true, default: '#6366f1' },
  years: { type: [Number], default: [1, 2, 3, 4] },
  batches: { type: [batchSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
