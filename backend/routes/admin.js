const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireApproval } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const ctrl = require('../controllers/adminController');

router.use(auth, requireApproval, roleCheck('admin'));

// Classrooms
router.post('/classrooms', ctrl.createClassroom);
router.put('/classrooms/:id', ctrl.updateClassroom);
router.delete('/classrooms/:id', ctrl.deleteClassroom);

// Departments
router.post('/departments', ctrl.createDepartment);
router.put('/departments/:id', ctrl.updateDepartment);
router.delete('/departments/:id', ctrl.deleteDepartment);

// Users
router.get('/users', ctrl.getUsers);
router.delete('/users/:id', ctrl.deleteUser);
router.put('/users/:id/approve', ctrl.approveUser);
router.delete('/users/:id/reject', ctrl.rejectUser);

// Allotments
router.get('/allotments', ctrl.getAllotments);
router.post('/allotments', ctrl.allotSlot);
router.delete('/allotments/:id', ctrl.removeAllotment);

// Timetable (admin override)
router.post('/timetable', ctrl.createEntry);
router.delete('/timetable/:id', ctrl.deleteEntry);

// Settings
router.put('/settings', ctrl.updateSettings);

module.exports = router;
