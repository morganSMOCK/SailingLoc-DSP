import express from "express";
import { body, validationResult } from "express-validator";
import Booking from "../models/Booking.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Créer une réservation
router.post(
  "/",
  authenticateToken,
  [
    body("boatId").notEmpty(),
    body("startDate").isISO8601(),
    body("endDate").isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { boatId, startDate, endDate } = req.body;

      const booking = new Booking({
        userId: req.user.id,
        boatId,
        startDate,
        endDate
      });

      await booking.save();
      res.status(201).json(booking);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Récupérer toutes les réservations de l'utilisateur
router.get("/", authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).populate("boatId");
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Récupérer une réservation spécifique
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("boatId");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.userId.toString() !== req.user.id) return res.status(403).json({ message: "Access denied" });

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mettre à jour le statut d'une réservation (admin ou proprio du boat)
router.put("/:id/status", authenticateToken, [
  body("status").isIn(["pending", "confirmed", "canceled"])
], async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Vérification : si tu veux ajouter un rôle admin plus tard
    if (booking.userId.toString() !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });

    booking.status = req.body.status;
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Supprimer une réservation
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.userId.toString() !== req.user.id && req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });

    await booking.deleteOne();
    res.json({ message: "Booking deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
