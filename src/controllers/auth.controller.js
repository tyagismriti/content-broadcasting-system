const AuthService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'name, email, password, and role are required' });
    }
    if (!['principal', 'teacher'].includes(role)) {
      return res.status(400).json({ success: false, message: 'role must be principal or teacher' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'password must be at least 6 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const user = await AuthService.register({ name: name.trim(), email: email.trim().toLowerCase(), password, role });
    res.status(201).json({ success: true, message: 'User registered successfully', data: user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const result = await AuthService.login({ email, password });
    res.json({ success: true, message: 'Login successful', data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
