const Classroom = require('../models/Classroom');
const Department = require('../models/Department');
const User = require('../models/User');
const TimetableEntry = require('../models/TimetableEntry');
const Allotment = require('../models/Allotment');

// ─── CLASSROOMS ───

exports.createClassroom = async (req, res) => {
  try {
    const { name, building, capacity } = req.body;
    if (!name) return res.status(400).json({ message: 'Classroom name is required' });

    const classroom = new Classroom({ name, building, capacity });
    await classroom.save();
    req.io.emit('classroom:created', classroom);
    res.status(201).json(classroom);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Classroom name already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.updateClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    req.io.emit('classroom:updated', classroom);
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    await TimetableEntry.deleteMany({ classroom: req.params.id });
    await Allotment.deleteMany({ classroom: req.params.id });
    req.io.emit('classroom:deleted', req.params.id);
    res.json({ message: 'Classroom deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DEPARTMENTS ───

exports.createDepartment = async (req, res) => {
  try {
    const { name, fullName, color, batches } = req.body;
    if (!name || !fullName) return res.status(400).json({ message: 'Name and full name are required' });

    const department = new Department({
      name: name.toUpperCase(),
      fullName,
      color: color || '#6366f1',
      batches: batches || []
    });
    await department.save();
    req.io.emit('department:created', department);
    res.status(201).json(department);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Department already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    if (req.body.name) req.body.name = req.body.name.toUpperCase();
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!department) return res.status(404).json({ message: 'Department not found' });
    req.io.emit('department:updated', department);
    res.json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    await TimetableEntry.deleteMany({ department: req.params.id });
    await Allotment.deleteMany({ department: req.params.id });
    req.io.emit('department:deleted', req.params.id);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── USERS ───

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -token').populate('department');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Clean up timetable entries where this user was assigned as faculty
    await TimetableEntry.deleteMany({ faculty: req.params.id });

    res.json({ message: `User "${user.name}" has been deleted.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.approved) {
      return res.status(400).json({ message: 'Cannot reject an already approved user. Use delete instead.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: `User "${user.name}" has been rejected and removed.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.approved = true;
    await user.save();

    res.json({ message: `User "${user.name}" has been approved.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─── ALLOTMENTS ───

exports.getAllotments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.classroom) filter.classroom = req.query.classroom;
    if (req.query.department) filter.department = req.query.department;

    const allotments = await Allotment.find(filter)
      .populate('classroom', 'name')
      .populate('department', 'name fullName color')
      .populate('allottedBy', 'name');
    res.json(allotments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.allotSlot = async (req, res) => {
  try {
    const { classroom, day, timeSlot, department } = req.body;

    if (!classroom || !day || timeSlot === undefined || !department) {
      return res.status(400).json({ message: 'classroom, day, timeSlot, and department are required' });
    }

    // Upsert: create or update allotment
    const allotment = await Allotment.findOneAndUpdate(
      { classroom, day, timeSlot },
      { classroom, day, timeSlot, department, allottedBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    ).populate('classroom', 'name')
     .populate('department', 'name fullName color')
     .populate('allottedBy', 'name');

    req.io.emit('allotment:updated', allotment);
    res.status(201).json(allotment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeAllotment = async (req, res) => {
  try {
    const allotment = await Allotment.findByIdAndDelete(req.params.id);
    if (!allotment) return res.status(404).json({ message: 'Allotment not found' });

    req.io.emit('allotment:deleted', req.params.id);
    res.json({ message: 'Allotment removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── TIMETABLE (Admin can override conflicts) ───

exports.createEntry = async (req, res) => {
  try {
    const { classroom, day, timeSlot, department, faculty, batch, section, subsection, subject, year, type } = req.body;

    if (!classroom || !day || timeSlot === undefined || !department || !faculty || !section || !year) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const slotsToCreate = type === 'lab' ? [timeSlot, timeSlot + 1] : [timeSlot];

    if (type === 'lab' && timeSlot > 6) {
      return res.status(400).json({ message: 'Lab requires 2 consecutive slots. Cannot start at the last time slot.' });
    }

    const createdEntries = [];

    for (let i = 0; i < slotsToCreate.length; i++) {
      const slot = slotsToCreate[i];
      const entry = new TimetableEntry({
        classroom, day, timeSlot: slot, department, faculty,
        batch: batch || '',
        section, subsection: subsection || null,
        subject: subject || '', year, type,
        isSecondSlot: i === 1,
        linkedEntry: i === 1 ? createdEntries[0]._id : null
      });
      await entry.save();
      createdEntries.push(entry);
    }

    // Link first entry to second for labs
    if (type === 'lab' && createdEntries.length === 2) {
      createdEntries[0].linkedEntry = createdEntries[1]._id;
      await createdEntries[0].save();
    }

    const populated = await TimetableEntry.find({ _id: { $in: createdEntries.map(e => e._id) } })
      .populate('classroom department faculty');

    req.io.emit('timetable:created', populated);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const idsToDelete = [entry._id];
    if (entry.linkedEntry) idsToDelete.push(entry.linkedEntry);

    await TimetableEntry.deleteMany({ _id: { $in: idsToDelete } });
    req.io.emit('timetable:deleted', idsToDelete);
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
