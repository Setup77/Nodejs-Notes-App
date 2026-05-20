const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier de stockage s'il n'existe pas encore
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Génère un nom unique : TIMESTAMP-NOM_D_ORIGINE
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtres de sécurité optionnels (ex: max 5 Mo par fichier)
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } 
});

module.exports = upload;
