const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireApproval } = require('../middleware/auth');
const ctrl = require('../controllers/commonController');

router.use(auth);

// These endpoints require approval to view timetable data
router.get('/timetable', requireApproval, ctrl.getTimetable);
router.get('/classrooms', ctrl.getClassrooms);
router.get('/departments', ctrl.getDepartments);
router.get('/faculty', requireApproval, ctrl.getFaculty);
router.get('/allotments', requireApproval, ctrl.getAllotments);
router.get('/my-schedule', requireApproval, ctrl.getMySchedule);
router.get('/stats', ctrl.getStats);
router.get('/settings', ctrl.getSettings);
module.exports = router;
