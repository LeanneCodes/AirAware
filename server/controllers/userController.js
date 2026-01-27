const User = require("../models/User");

exports.getMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = await User.getById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const {
      first_name,
      last_name,
      date_of_birth,
      sex_at_birth,
      gender,
      nationality,
    } = req.body || {};

    const updates = {}
    
    if (first_name !== undefined) {
    updates.first_name = first_name;
    }

    if (last_name !== undefined) {
    updates.last_name = last_name;
    }

    if (date_of_birth !== undefined) {
    updates.date_of_birth = date_of_birth;
  }

    if (sex_at_birth !== undefined) {
  updates.sex_at_birth = sex_at_birth;
  }

  if (gender !== undefined) {
  updates.gender = gender;
  }

    if (nationality !== undefined) {
  updates.nationality = nationality;
  }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields provided to update" });
    }

    const updatedUser = await User.updateById(userId, updates);

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({
      message: "Profile updated",
      user: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};

exports.deleteMe = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const deleted = await User.deleteById(userId);
    if (!deleted) return res.status(404).json({ error: "User not found" });

    // 204 No Content is standard for successful deletes
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};