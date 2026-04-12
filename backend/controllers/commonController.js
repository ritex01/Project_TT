const TimetableEntry = require('../models/TimetableEntry');
const Classroom = require('../models/Classroom');
const Department = require('../models/Department');
const User = require('../models/User');
const Allotment = require('../models/Allotment');
const SystemSettings = require('../models/SystemSettings');
// ─── GET TIMETABLE (filterable) ───

exports.getTimetable = async (req, res) => {
  try {
    const { classroom, department, faculty, day, timeSlot } = req.query;
    const filter = {};

    if (classroom) filter.classroom = classroom;
    if (department) filter.department = department;
    if (faculty) filter.faculty = faculty;
    if (day) filter.day = day;
    if (timeSlot !== undefined && timeSlot !== '') filter.timeSlot = Number(timeSlot);

    const entries = await TimetableEntry.find(filter)
      .populate('classroom', 'name building')
      .populate('department', 'name fullName color batches')
      .populate('faculty', 'name email authId');

    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET ALL CLASSROOMS ───

exports.getClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ name: 1 });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET ALL DEPARTMENTS ───

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET FACULTY (optionally by department) ───

exports.getFaculty = async (req, res) => {
  try {
    const filter = {};
    
    // If caller is admin, show all users; otherwise only faculty/hod
    if (req.user.role === 'admin') {
      // Admin can assign anyone as faculty
      if (req.query.department) {
        // Show dept faculty + all admins
        filter.$or = [
          { department: req.query.department, role: { $in: ['faculty', 'hod'] } },
          { role: 'admin' }
        ];
      }
      // If no department filter, show everyone
    } else {
      filter.role = { $in: ['faculty', 'hod'] };
      filter.approved = true;
      if (req.query.department) filter.department = req.query.department;
    }

    const faculty = await User.find(filter).select('name email authId department role').populate('department', 'name');
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET ALLOTMENTS ───

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

// ─── MY SCHEDULE (faculty's own entries) ───

exports.getMySchedule = async (req, res) => {
  try {
    const entries = await TimetableEntry.find({ faculty: req.user._id })
      .populate('classroom', 'name building')
      .populate('department', 'name fullName color batches')
      .populate('faculty', 'name email authId');

    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── STATS (for dashboard) ───

exports.getStats = async (req, res) => {
  try {
    const [classrooms, departments, users, entries] = await Promise.all([
      Classroom.countDocuments(),
      Department.countDocuments(),
      User.countDocuments(),
      TimetableEntry.countDocuments()
    ]);

    const result = { classrooms, departments, users, entries };

    if (req.user.role === 'hod' && req.user.department) {
      const deptId = req.user.department._id || req.user.department;
      result.deptEntries = await TimetableEntry.countDocuments({ department: deptId });
      result.deptFaculty = await User.countDocuments({
        department: deptId,
        role: { $in: ['faculty', 'hod'] }
      });
    }

    if (req.user.role === 'faculty') {
      result.myEntries = await TimetableEntry.countDocuments({ faculty: req.user._id });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = { timeSlots: [
        { slot: 0, label: '9:00' }, { slot: 1, label: '10:00' }, { slot: 2, label: '11:00' }, 
        { slot: 3, label: '12:00' }, { slot: 4, label: '1:00' }, { slot: 5, label: '2:00' },
        { slot: 6, label: '3:00' }, { slot: 7, label: '4:00' }
      ]};
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
