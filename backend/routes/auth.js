const router = require('express').Router();
const { register, login, getMe, logout, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');
const Department = require('../models/Department');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.post('/logout', auth, logout);

// Public endpoint for registration form
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find().select('name fullName').sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
