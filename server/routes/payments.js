import express from "express";
import { body, validationResult } from "express-validator";
import Payment from "../models/Payment.js";
import Booking from "../models/Booking.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Créer un paiement
router.post(
  "/",
  authenticateToken,
  [
    body("bookingId").notEmpty().isMongoId(),
    body("amount").isFloat({ min: 0 }),
    body("method").notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { bookingId, amount, method } = req.body;

      // Vérifier que la réservation existe
      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      const payment = new Payment({
        bookingId,
        amount,
        method
      });

      await payment.save();
      res.status(201).json(payment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Récupérer tous les paiements
router.get("/", authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.find().populate({
      path: "bookingId",
      populate: { path: "userId boatId" }
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Récupérer un paiement spécifique
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate({
      path: "bookingId",
      populate: { path: "userId boatId" }
    });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mettre à jour le statut du paiement (ex : pending → completed)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (req.body.status) payment.status = req.body.status;

    await payment.save();
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Supprimer un paiement
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    await payment.deleteOne();
    res.json({ message: "Payment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
