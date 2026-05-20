const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/checkAuth");
const dashboardController = require("../controllers/dasboardController");
const { doubleCsrfProtection } = require("../middleware/csrfProtection");
const upload = require("../middleware/upload"); // Import du middleware

const multer = require("multer");

// --- MIDDLEWARE PERSONNALISÉ POUR ATTRAPER LES ERREURS MULTER ---
const handleMulterUpload = (req, res, next) => {
  const uploadArray = upload.array("attachments", 5);

  uploadArray(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Si le fichier dépasse la limite fixée (ex: 10 Mo dans votre config)
      if (err.code === "LIMIT_FILE_SIZE") {
        req.session.notification = 7; // Code pour indiquer un fichier trop volumineux
        return res.redirect("/dashboard");
      }

      // Pour toute autre erreur Multer (ex: trop de fichiers)
      req.session.notification = 8;
      return res.redirect("/dashboard");
    } else if (err) {
      // Pour les erreurs non liées à Multer
      req.session.notification = 9;
      return res.redirect("/dashboard");
    }

    // Si tout est OK, on passe au middleware/contrôleur suivant
    next();
  });
};

/**
 * Dashboard Routes
 */

router.get("/dashboard", isLoggedIn, dashboardController.dashboard);
router.post(
  "/dashboard/item-:id",
  isLoggedIn,
  handleMulterUpload, 
  dashboardController.dashboardUpdateNote,
);

router.delete(
  "/dashboard/item-delete-:id",
  isLoggedIn,
  dashboardController.dashboardDeleteNote,
);

// Ajout de "upload.array" entre les vérifications et le contrôleur
router.post(
  "/dashboard/add",
  isLoggedIn,
  upload.array("attachments", 5), // 'attachments' correspond au nom du champ HTML input
  doubleCsrfProtection,
  dashboardController.dashboardCreateNoteSubmit,
);

router.get("/dashboard/notes-:id", dashboardController.NoteForAnotherUser);
router.get("/notes-for-all-users", dashboardController.notesForAllUsers);
// La Route (server/routes/dashboard.js)
router.get(
  "/dashboard/view-note/:id",
  isLoggedIn,
  dashboardController.dashboardViewNote,
);

module.exports = router;
