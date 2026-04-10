const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, access denied' });
    }

    const token = header.replace('Bearer ', '');
    const user = await User.findOne({ token }).populate('department');

    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

// Middleware to block unapproved users from accessing protected resources
const requireApproval = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!req.user.approved) {
    return res.status(403).json({ message: 'Your account is pending admin approval.' });
  }
  next();
};

module.exports = auth;
module.exports.requireApproval = requireApproval;
