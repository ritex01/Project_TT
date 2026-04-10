const TimetableEntry = require('../models/TimetableEntry');
const Allotment = require('../models/Allotment');

// ─── CHECK CONFLICTS ───

exports.checkConflicts = async (req, res) => {
  try {
    const { classroom, day, timeSlot, faculty, department, section, subsection, type } = req.query;
    const slots = type === 'lab' ? [Number(timeSlot), Number(timeSlot) + 1] : [Number(timeSlot)];
    const conflicts = [];

    for (const slot of slots) {
      // 1. Classroom conflict
      const classroomConflict = await TimetableEntry.findOne({ classroom, day, timeSlot: slot })
        .populate('department faculty');
      if (classroomConflict) {
        conflicts.push({
          type: 'classroom',
          slot,
          message: `Classroom occupied by ${classroomConflict.department?.name || 'unknown'} - ${classroomConflict.faculty?.name || 'unknown'}`,
          entry: classroomConflict
        });
      }

      // 2. Faculty conflict
      if (faculty) {
        const facultyConflict = await TimetableEntry.findOne({ faculty, day, timeSlot: slot })
          .populate('classroom department');
        if (facultyConflict) {
          conflicts.push({
            type: 'faculty',
            slot,
            message: `Faculty already teaching in ${facultyConflict.classroom?.name || 'unknown'}`,
            entry: facultyConflict,
            facultyId: faculty
          });
        }
      }

      // 3. Section/subsection conflict
      if (section) {
        const query = { department, day, timeSlot: slot, section };
        if (subsection) query.subsection = subsection;
        const sectionConflict = await TimetableEntry.findOne(query).populate('classroom faculty');
        if (sectionConflict) {
          conflicts.push({
            type: 'section',
            slot,
            message: `${section}${subsection ? '-' + subsection : ''} already has a class at this time`,
            entry: sectionConflict
          });
        }
      }
    }

    res.json({ conflicts, hasConflicts: conflicts.length > 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── CREATE ENTRY (HOD - must have allotment, cannot override conflicts) ───

exports.createEntry = async (req, res) => {
  try {
    const { classroom, day, timeSlot, faculty, batch, section, subsection, subject, year, type } = req.body;
    const department = req.user.department?._id || req.user.department;

    if (!department) {
      return res.status(400).json({ message: 'HOD must belong to a department' });
    }

    if (!classroom || !day || timeSlot === undefined || !faculty || !section || !year) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (type === 'lab' && timeSlot > 6) {
      return res.status(400).json({ message: 'Lab requires 2 consecutive slots. Cannot start at the last time slot.' });
    }

    // Verify allotment exists for HOD's department
    const slotsToCreate = type === 'lab' ? [timeSlot, timeSlot + 1] : [timeSlot];

    for (const slot of slotsToCreate) {
      const allotment = await Allotment.findOne({ classroom, day, timeSlot: slot });
      if (!allotment) {
        return res.status(403).json({ message: `Slot ${slot} on ${day} is not allotted to any department` });
      }
      if (allotment.department.toString() !== department.toString()) {
        return res.status(403).json({ message: `Slot ${slot} on ${day} is allotted to another department` });
      }
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

// ─── UPDATE ENTRY ───

exports.updateEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const department = req.user.department?._id || req.user.department;
    if (entry.department.toString() !== department.toString()) {
      return res.status(403).json({ message: 'You can only edit your department entries' });
    }

    const updated = await TimetableEntry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('classroom department faculty');
    req.io.emit('timetable:updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE ENTRY ───

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await TimetableEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    const department = req.user.department?._id || req.user.department;
    if (entry.department.toString() !== department.toString()) {
      return res.status(403).json({ message: 'You can only delete your department entries' });
    }

    const idsToDelete = [entry._id];
    if (entry.linkedEntry) idsToDelete.push(entry.linkedEntry);

    await TimetableEntry.deleteMany({ _id: { $in: idsToDelete } });
    req.io.emit('timetable:deleted', idsToDelete);
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
