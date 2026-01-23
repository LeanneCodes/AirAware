const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const Auth = require("../models/Auth");

const ALLOWED_CONDITIONS = new Set(["asthma", "allergies", "both"]);
const ALLOWED_SENSITIVITY = new Set(["low", "medium", "high"]);

function signToken(user) {
  return jwt.sign(
    { email: user.email },
    process.env.JWT_SECRET,
    {
      subject: user.id, // sub
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

async function register(req, res) {
  try {
    const { email, password,} = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email, password," });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await Auth.getUserByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await Auth.createUser({
      email: email.toLowerCase(),
      passwordHash,
      conditionType: condition_type,
      sensitivityLevel: sensitivity_level,
    });

    const token = signToken({ id: user.id, email: user.email });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        condition_type: user.condition_type,
        sensitivity_level: user.sensitivity_level,
      },
    });
  } catch (err) {
    console.log("REGISTER_ERROR", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await Auth.getUserByEmail(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({ id: user.id, email: user.email });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        condition_type: user.condition_type,
        sensitivity_level: user.sensitivity_level,
      },
    });
  } catch (err) {
    console.log("LOGIN_ERROR", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function me(req, res) {
  // req.user set by authMiddleware
  return res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  me,
};
