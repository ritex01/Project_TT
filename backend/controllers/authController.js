const User = require('../models/User');
const Department = require('../models/Department');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateAuthId = (role, deptName) => {
  const num = Math.floor(1000 + Math.random() * 9000);
  switch (role) {
    case 'admin': return `ADM-${num}`;
    case 'hod': return `HOD-${deptName}-${num}`;
    case 'faculty': return `FAC-${deptName}-${num}`;
    default: return `USR-${num}`;
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    if ((role === 'hod' || role === 'faculty') && !departmentId) {
      return res.status(400).json({ message: 'Department is required for HOD/Faculty' });
    }

    let deptName = '';
    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (!dept) return res.status(400).json({ message: 'Department not found' });
      deptName = dept.name;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const authId = generateAuthId(role, deptName);

    // Auto-approve if this is the very first user in the system (bootstrap admin)
    const totalUsers = await User.countDocuments();
    const autoApprove = totalUsers === 0;

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      authId,
      department: departmentId || null,
      approved: autoApprove
    });

    await user.save();

    const responseMsg = autoApprove
      ? 'Registration successful. You are the first user and have been auto-approved.'
      : 'Registration successful. Your account is pending admin approval.';

    res.status(201).json({ message: responseMsg, authId, approved: autoApprove });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email or Auth ID already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).populate('department');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Allow login but include approval status — frontend will handle the restriction
    const token = crypto.randomBytes(32).toString('hex');
    user.token = token;
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authId: user.authId,
        department: user.department,
        approved: user.approved
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      authId: req.user.authId,
      department: req.user.department,
      approved: req.user.approved
    }
  });
};

exports.logout = async (req, res) => {
  try {
    req.user.token = null;
    await req.user.save();
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
