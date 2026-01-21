const User = require("../models/User");

const ALLOWED_CONDITIONS = new Set(["asthma", "allergies", "both"]);
const ALLOWED_SENSITIVITY = new Set(["low", "medium", "high"]);

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
      condition_type,
      sensitivity_level,
      accessibility_mode,
      analytics_opt_in,
      accepted_disclaimer_at,
    } = req.body || {};

    const updates = {};

    if (condition_type !== undefined) {
      const c = String(condition_type).toLowerCase();
      if (!ALLOWED_CONDITIONS.has(c)) {
        return res.status(400).json({
          error: `condition_type must be one of: ${Array.from(ALLOWED_CONDITIONS).join(", ")}`,
        });
      }
      updates.condition_type = c;
    }

    if (sensitivity_level !== undefined) {
      const s = String(sensitivity_level).toLowerCase();
      if (!ALLOWED_SENSITIVITY.has(s)) {
        return res.status(400).json({
          error: `sensitivity_level must be one of: ${Array.from(ALLOWED_SENSITIVITY).join(", ")}`,
        });
      }
      updates.sensitivity_level = s;
    }

    if (accessibility_mode !== undefined) {
      if (typeof accessibility_mode !== "boolean") {
        return res.status(400).json({ error: "accessibility_mode must be a boolean" });
      }
      updates.accessibility_mode = accessibility_mode;
    }

    if (analytics_opt_in !== undefined) {
      if (typeof analytics_opt_in !== "boolean") {
        return res.status(400).json({ error: "analytics_opt_in must be a boolean" });
      }
      updates.analytics_opt_in = analytics_opt_in;
    }

    if (accepted_disclaimer_at !== undefined) {
      if (accepted_disclaimer_at === null) {
        updates.accepted_disclaimer_at = null;
      } else {
        const d = new Date(accepted_disclaimer_at);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: "accepted_disclaimer_at must be a valid datetime or null" });
        }
        updates.accepted_disclaimer_at = d.toISOString();
      }
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
