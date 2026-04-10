const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireApproval } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const ctrl = require('../controllers/hodController');

router.use(auth, requireApproval, roleCheck('hod'));

router.get('/conflicts', ctrl.checkConflicts);
router.post('/timetable', ctrl.createEntry);
router.put('/timetable/:id', ctrl.updateEntry);
router.delete('/timetable/:id', ctrl.deleteEntry);

module.exports = router;
