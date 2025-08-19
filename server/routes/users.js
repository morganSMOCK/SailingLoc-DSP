// server/routes/users.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { body, validationResult } from "express-validator";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Inscription (optionnel si tu veux laisser auth.js gérer register)
// Ici juste pour montrer comment tu peux le garder
router.post(
  "/register",
  [
    body("firstName").notEmpty().withMessage("Le prénom est requis"),
    body("lastName").notEmpty().withMessage("Le nom est requis"),
    body("email").isEmail().withMessage("Email invalide"),
    body("password").isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères"),
    body("role").notEmpty().withMessage("Le rôle est requis"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { firstName, lastName, email, password, role } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: "Email déjà utilisé" });

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({ firstName, lastName, email, password: hashedPassword, role });
      await user.save();

      res.status(201).json({
        message: "Utilisateur créé avec succès",
        user: { id: user._id, firstName, lastName, email, role }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// Connexion (si tu veux juste utiliser auth.js, tu peux supprimer cette route)
router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: "Identifiants invalides" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Identifiants invalides" });

      res.json({ message: "Connexion réussie", user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// Récupérer profil
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Mettre à jour profil
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const updateData = {};
    const allowedFields = ["firstName", "lastName", "avatar", "phone"];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter un favori
router.post("/favorites/:boatId", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.favorites.includes(req.params.boatId)) {
      user.favorites.push(req.params.boatId);
      await user.save();
    }
    res.json(user.favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer un favori
router.delete("/favorites/:boatId", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.favorites = user.favorites.filter(fav => fav.toString() !== req.params.boatId);
    await user.save();
    res.json(user.favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
