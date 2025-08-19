import express from "express";
import User from "../models/User.js";
import { authenticateToken, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

// Exemple : obtenir tous les utilisateurs (admin only)
router.get("/users", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
