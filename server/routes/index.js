const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");
const { isLoggedIn } = require("../middleware/checkAuth");
const mainController = require("../controllers/mainController");

// --- Configuration du stockage des fichiers ---
const uploadDir = path.join(process.cwd(), "public/img");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // Utilisation sécurisée de l'ID de l'utilisateur connecté depuis la session principale
    cb(null, "avatar-" + req.session.user._id + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limite à 2 Mo pour économiser l'espace disque
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont autorisées."));
    }
  },
});

/**
 * App Routes
 */
router.get("/", mainController.homepage);
router.get("/profil-:id", mainController.profil);
router.post("/update-profile", isLoggedIn, mainController.ProfilUpdate);
router.get("/logout", mainController.homepagelogout);
router.get("/users", mainController.users);

// --- API : Upload de l’avatar (Sécurisé par isLoggedIn) ---
router.post(
  "/upload-avatar",
  isLoggedIn,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "Aucun fichier envoyé" });
      }

      // Mise à jour de la base de données de l'utilisateur connecté
      const user = await User.findByIdAndUpdate(
        req.session.user._id,
        { avatar: req.file.filename },
        { new: true },
      );

      // Synchronisation de la session locale avec la nouvelle image
      req.session.user.avatar = user.avatar;

      res.json({ success: true, avatar: user.avatar });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

module.exports = router;
