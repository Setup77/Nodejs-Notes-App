const express = require("express");
const router = express.Router();
const passport = require("passport");
const svgCaptcha = require("svg-captcha"); // Ajout du module de captcha

const User = require("../models/User");
const authController = require("../controllers/authController");

// Importation de vos middlewares de restriction
const { isLoggedOut } = require("../middleware/checkAuth");

// --- ROUTE DU CAPTCHA (Génération de l'image SVG) ---
router.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create({
    size: 6, // Nombre de caractères dans l'image
    noise: 3, // Nombre de lignes de bruit pour bloquer les robots
    color: true, // Lettres de couleurs aléatoires
    background: "#f8f9fa", // Couleur de fond (assortie au thème Bootstrap light)
  });

  // Stockage du texte en minuscules dans la session pour la vérification ultérieure
  req.session.captcha = captcha.text.toLowerCase();

  // Envoi de l'image au format SVG
  res.type("svg");
  res.status(200).send(captcha.data);
});

// --- API DE VÉRIFICATION EN TEMPS RÉEL ---
router.post("/api/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email manquant" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    return res.json({ exists: !!user });
  } catch (error) {
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
});


// --- API DE VÉRIFICATION DU CAPTCHA EN TEMPS RÉEL ---
router.post("/api/check-captcha", (req, res) => {
  try {
    const { captcha } = req.body;
    
    if (!captcha) {
      return res.status(400).json({ valid: false });
    }

    // Comparaison en minuscules avec la session
    const isValid = req.session.captcha && captcha.toLowerCase() === req.session.captcha;
    
    return res.json({ valid: isValid });
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur" });
  }
});


// --- ROUTES AUTHENTIFICATION (Protégées contre les utilisateurs déjà connectés) ---
router.get("/register", isLoggedOut, authController.register);
router.post("/register", isLoggedOut, authController.registerAddUserSubmit);

router.get("/login", isLoggedOut, authController.login);
router.post("/login", isLoggedOut, authController.loginConnexion);

module.exports = router;
