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
    const [classrooms, departments, users, entries, pendingUsers, approvedUsers, totalAllotments] = await Promise.all([
      Classroom.countDocuments(),
      Department.countDocuments(),
      User.countDocuments(),
      TimetableEntry.countDocuments(),
      User.countDocuments({ approved: false }),
      User.countDocuments({ approved: true }),
      Allotment.countDocuments()
    ]);

    const result = { classrooms, departments, users, entries, pendingUsers, approvedUsers, totalAllotments };

    // Get timeslots for time calculations
    let settings = await SystemSettings.findOne();
    const timeSlots = settings?.timeSlots || [
      { slot: 0, label: '9:00' }, { slot: 1, label: '10:00' }, { slot: 2, label: '11:00' },
      { slot: 3, label: '12:00' }, { slot: 4, label: '1:00' }, { slot: 5, label: '2:00' },
      { slot: 6, label: '3:00' }, { slot: 7, label: '4:00' }
    ];

    // Helper: parse "9:00" or "1:00" label to minutes since midnight
    const parseSlotToMinutes = (label) => {
      const [h, m] = label.split(':').map(Number);
      // Assume hours < 8 are PM (1:00 = 13:00, etc.)
      const hour = h < 8 ? h + 12 : h;
      return hour * 60 + (m || 0);
    };

    // Determine current day and timeslot  
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    // Use IST offset (UTC+5:30)
    const istOffset = 5.5 * 60;
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const istMinutes = utcMinutes + istOffset;
    const istHours = Math.floor(istMinutes / 60) % 24;
    const istMins = istMinutes % 60;
    const currentMinutes = istHours * 60 + istMins;
    
    // Calculate IST day
    const istDate = new Date(now.getTime() + istOffset * 60000);
    const currentDay = days[istDate.getUTCDay()];

    // Find current slot
    let currentSlotIndex = -1;
    for (let i = 0; i < timeSlots.length; i++) {
      const slotStart = parseSlotToMinutes(timeSlots[i].label);
      const slotEnd = i + 1 < timeSlots.length ? parseSlotToMinutes(timeSlots[i + 1].label) : slotStart + 60;
      if (currentMinutes >= slotStart && currentMinutes < slotEnd) {
        currentSlotIndex = i;
        break;
      }
    }

    // Ongoing classes: entries for current day + current timeslot (non-secondSlot)
    if (currentSlotIndex >= 0 && ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(currentDay)) {
      const ongoing = await TimetableEntry.find({ day: currentDay, timeSlot: currentSlotIndex, isSecondSlot: false })
        .populate('classroom', 'name building')
        .populate('department', 'name fullName color')
        .populate('faculty', 'name email authId');
      
      // Attach time info
      const slotLabel = timeSlots[currentSlotIndex]?.label || '';
      const nextSlotLabel = timeSlots[currentSlotIndex + 1]?.label || '';
      result.ongoingClasses = ongoing.map(e => ({
        ...e.toObject(),
        startTime: slotLabel,
        endTime: e.type === 'lab' && timeSlots[currentSlotIndex + 2] 
          ? timeSlots[currentSlotIndex + 2].label 
          : nextSlotLabel
      }));
    } else {
      result.ongoingClasses = [];
    }

    // HOD extras
    if (req.user.role === 'hod' && req.user.department) {
      const deptId = req.user.department._id || req.user.department;
      result.deptEntries = await TimetableEntry.countDocuments({ department: deptId });
      result.deptFaculty = await User.countDocuments({
        department: deptId,
        role: { $in: ['faculty', 'hod'] }
      });
    }

    // Faculty/HOD extras
    if (req.user.role === 'faculty' || req.user.role === 'hod') {
      const myEntries = await TimetableEntry.find({ faculty: req.user._id, isSecondSlot: false })
        .populate('classroom', 'name building')
        .populate('department', 'name fullName color');
      result.myEntries = myEntries.length;
      result.myWeeklyHours = myEntries.reduce((sum, e) => sum + (e.type === 'lab' ? 2 : 1), 0);

      // Next class today
      if (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(currentDay)) {
        const todayEntries = myEntries
          .filter(e => e.day === currentDay && e.timeSlot > currentSlotIndex)
          .sort((a, b) => a.timeSlot - b.timeSlot);
        
        if (todayEntries.length > 0) {
          const next = todayEntries[0];
          const nextLabel = timeSlots[next.timeSlot]?.label || '';
          const afterLabel = timeSlots[next.timeSlot + 1]?.label || '';
          result.myNextClass = {
            ...next.toObject(),
            startTime: nextLabel,
            endTime: next.type === 'lab' && timeSlots[next.timeSlot + 2]
              ? timeSlots[next.timeSlot + 2].label
              : afterLabel
          };
        } else {
          result.myNextClass = null;
        }
      } else {
        result.myNextClass = null;
      }
    }

    // Send slot info for frontend
    result.currentDay = currentDay;
    result.currentSlot = currentSlotIndex;
    result.timeSlots = timeSlots;

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
