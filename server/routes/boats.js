import express from "express";
import { body, validationResult } from "express-validator";
import Boat from "../models/Boat.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Créer un bateau
router.post(
  "/",
  authenticateToken,
  [
    body("name").notEmpty(),
    body("type").notEmpty(),
    body("capacity").isInt({ min: 1 }),
    body("pricePerDay").isFloat({ min: 0 }),
    body("description").optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, type, capacity, pricePerDay, description } = req.body;

      const boat = new Boat({
        name,
        type,
        capacity,
        pricePerDay,
        description,
        ownerId: req.user.id
      });

      await boat.save();
      res.status(201).json(boat);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Récupérer tous les bateaux
router.get("/", async (req, res) => {
  try {
    const boats = await Boat.find().populate("ownerId", "username email");
    res.json(boats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Récupérer un bateau spécifique
router.get("/:id", async (req, res) => {
  try {
    const boat = await Boat.findById(req.params.id).populate("ownerId", "username email");
    if (!boat) return res.status(404).json({ message: "Boat not found" });
    res.json(boat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mettre à jour un bateau (seul le propriétaire ou admin)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const boat = await Boat.findById(req.params.id);
    if (!boat) return res.status(404).json({ message: "Boat not found" });

    if (boat.ownerId.toString() !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });

    const updates = ["name", "type", "capacity", "pricePerDay", "description"];
    updates.forEach(field => {
      if (req.body[field] !== undefined) boat[field] = req.body[field];
    });

    await boat.save();
    res.json(boat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Supprimer un bateau (seul le propriétaire ou admin)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const boat = await Boat.findById(req.params.id);
    if (!boat) return res.status(404).json({ message: "Boat not found" });

    if (boat.ownerId.toString() !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });

    await boat.deleteOne();
    res.json({ message: "Boat deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
