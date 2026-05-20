const mongoose = require("mongoose");
const Note = require("../models/Notes");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

/**
 * GET /dashboard
 * Dashboard User Connected avec Pagination Serveur
 */
exports.dashboard = async (req, res) => {
  const locals = {
    title: "Tableau de bord - Application de prise Notes gratuite",
    description: "Application de prise Notes gratuite.",
    page: 6,
    search: "Rechercher vos notes,...",
  };

  try {
    // 1. Détermination de l'ID de l'utilisateur connecté via session ou Passport
    let id = null;
    let userName = null;

    if (req.session.user) {
      id = req.session.user._id;
      userName = req.session.user.firstName;
    } else if (req.user) {
      id = req.user._id;
      userName = req.user.firstName;
    }

    if (!id) {
      req.session.notification = 5;
      return res.redirect("/login");
    }

    // 2. Gestion des paramètres de pagination
    const perPage = 12; // Nombre de notes par page
    const page = parseInt(req.query.page) || 1;

    // 3. Requête d’agrégation optimisée avec pagination
    const notes = await Note.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id) } },
      { $sort: { isPinned: -1, updatedAt: -1 } }, // Épingle les notes importantes en premier, puis trie par date
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          user: "$user",
          usernote: "$userInfo",
          title: { $substrCP: ["$title", 0, 50] },
          body: { $substrCP: ["$body", 0, 150] },
          titleToModify: { $substrCP: ["$title", 0, { $strLenCP: "$title" }] },
          bodyToModify: { $substrCP: ["$body", 0, { $strLenCP: "$body" }] },
          // 🎨 AJOUT : Demande explicitement à MongoDB de renvoyer la catégorie de couleur
          colorCategory: 1,
          attachments: 1,
          isPinned: 1,
          isPrivate: 1,
          isTodo: 1,
          checklist: 1,
          tags: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
    ]);

    // 4. Calcul du nombre total de notes pour générer les pages
    const count = await Note.countDocuments({
      user: new mongoose.Types.ObjectId(id),
    });
    const totalPages = Math.ceil(count / perPage);

    let GetVar = req.session.notification;
    req.session.notification = null;
    let userId = id;

    const usernote = await User.findById(id);

    // 5. Rendu de la vue avec les variables de pagination incluses
    res.render("dashboard/index", {
      userName,
      locals,
      GetVar,
      notes,
      userId,
      usernote,
      anoteruser: 2,
      current: page,
      pages: totalPages,
      layout: "../views/layouts/dashboard",
      connecter: 1,
    });
  } catch (error) {
    console.error("Erreur d'affichage du dashboard:", error);
    res.status(500).render("404", { layout: false });
  }
};


/**
 * GET /dashboard/notes-:id
 * Notes publiques d'un utilisateur spécifique avec Pagination Serveur
 */
exports.NoteForAnotherUser = async (req, res) => {
  const locals = {
    title: "Tableau de bord - notes de l'utilisateur",
    description: "Application de prise Notes gratuite.",
    page: 7,
    search: "Rechercher des notes,...",
  };

  try {
    // 1. Validation et conversion sécurisée de l'ID recherché
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).render("404", { layout: "./layouts/dashboard" });
    }
    const targetUserId = new mongoose.Types.ObjectId(req.params.id);

    // 2. Identification de l'utilisateur connecté (optionnel sur cette route)
    let currentUserId = null;
    let userName = null;

    const currentUser = req.user || req.session?.user;
    if (currentUser) {
      currentUserId = new mongoose.Types.ObjectId(currentUser._id);
      userName = currentUser.firstName;
    }

    // 3. Gestion de la pagination
    const perPage = 12; // Aligné sur vos autres vues de listes
    const page = parseInt(req.query.page) || 1;

    // 4. Filtre : Uniquement les notes de CET utilisateur ET qui ne sont pas privées
    const matchStage = {
      user: targetUserId,
      isPrivate: false, // 🔒 SÉCURITÉ : Bloque l'accès aux notes privées d'autrui
    };

    // 5. Requête d’agrégation avec pagination intégrée
    const notes = await Note.aggregate([
      { $match: matchStage },
      { $sort: { updatedAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          user: "$user",
          usernote: "$userInfo",
          title: { $substrCP: ["$title", 0, 50] },
          body: { $substrCP: ["$body", 0, 150] },
          titleToModify: "$title",
          bodyToModify: "$body",
          colorCategory: 1, // Requis pour vos styles WhatsApp
          attachments: 1,
          isPinned: 1,
          isTodo: 1,
          checklist: 1,
          tags: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
    ]);

    // 6. Calcul du nombre total de pages
    const count = await Note.countDocuments(matchStage);
    const totalPages = Math.ceil(count / perPage);

    let GetVar = req.session?.notification || null;
    if (req.session) req.session.notification = null;

    // 7. Récupération des détails de l'utilisateur ciblé
    const usernote = await User.findById(targetUserId);
    if (!usernote) {
      return res.status(404).render("404", { layout: "./layouts/dashboard" });
    }

    // 8. Rendu de la vue index
    res.render("dashboard/index", {
      userName,
      locals,
      GetVar,
      notes,
      userId: currentUserId, // ID du visiteur connecté actuel
      usernote, // Infos du propriétaire des notes affichées
      anoteruser: 1, // Déclenche vos messages d'absence de notes dédiés
      current: page,
      pages: totalPages,
      layout: "./layouts/dashboard", // Chemin corrigé (sans le préfixe relatif)
      connecter: currentUserId ? 1 : 0,
    });
  } catch (error) {
    console.error("Erreur NoteForAnotherUser :", error);
    res.status(500).render("404", { layout: "./layouts/dashboard" });
  }
};

/**
 * GET /notes-for-all-users
 * Notes de tous les utilisateurs avec Pagination Serveur
 */
exports.notesForAllUsers = async (req, res) => {
  console.log("Notes de tous les utilisateurs avec pagination");

  const locals = {
    title: "Tableau de bord - notes de tous les utilisateurs",
    description: "Application de prise Notes gratuite.",
    page: 7,
    search: "Rechercher des notes,...",
  };

  try {
    let id = null;
    let userName = null;
    let usernote = null;

    // 1. Identification de l'utilisateur connecté (optionnel sur cette route publique)
    const currentUser = req.user || req.session?.user;
    if (currentUser) {
      id = new mongoose.Types.ObjectId(currentUser._id);
      userName = currentUser.firstName;
      usernote = await User.findById(id);
    }

    // 2. Gestion des paramètres de pagination
    const perPage = 12; // Même nombre de notes par page que le dashboard
    const page = parseInt(req.query.page) || 1;

    // 3. Construction dynamique du filtre de correspondance (Match)
    const matchStage = {
      isPrivate: false, // 🔒 SÉCURITÉ : Uniquement les notes publiques
    };

    // Si connecté, on n'affiche pas ses propres notes dans le flux public
    if (id) {
      matchStage.user = { $ne: id };
    }

    // 4. Requête d’agrégation avec pagination intégrée
    const notes = await Note.aggregate([
      { $match: matchStage },
      { $sort: { updatedAt: -1 } }, // Trie par les modifications les plus récentes
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          user: 1,
          usernote: "$userInfo",
          title: { $substrCP: ["$title", 0, 50] },
          body: { $substrCP: ["$body", 0, 150] },
          titleToModify: "$title",
          bodyToModify: "$body",
          colorCategory: 1, // Pour vos dégradés style WhatsApp
          attachments: 1,
          isPinned: 1,
          isPrivate: 1,
          isTodo: 1,
          checklist: 1,
          tags: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
    ]);

    // 5. Calcul du nombre total de documents correspondant aux critères publics
    const count = await Note.countDocuments(matchStage);
    const totalPages = Math.ceil(count / perPage);

    let GetVar = req.session?.notification || null;
    if (req.session) req.session.notification = null;

    // 6. Rendu de la vue avec les variables de pagination
    res.render("dashboard/index", {
      userName,
      locals,
      GetVar,
      notes,
      userId: id,
      usernote,
      anoteruser: 0,
      current: page,
      pages: totalPages,
      layout: "./layouts/dashboard", // Aligné sur la racine de configuration views
      connecter: id ? 1 : 0,
    });
  } catch (error) {
    console.error("Erreur notesForAllUsers :", error);
    res.status(500).render("404", { layout: "./layouts/dashboard" });
  }
};

/**
 * PUT /dashboard/item-:id
 * Update Specific Note
 */

exports.dashboardUpdateNote = async (req, res) => {
  try {
    let userId = req.user?._id || req.session?.user?._id;
    if (!userId) return res.status(401).send("Non autorisé");

    const existingNote = await Note.findOne({
      _id: req.params.id,
      user: userId,
    });
    if (!existingNote) return res.status(404).send("Note introuvable");

    // 1. Traitement de la Checklist
    let checklist = [];
    if (req.body.isTodo === "true" && req.body.checklistItems) {
      const items = Array.isArray(req.body.checklistItems)
        ? req.body.checklistItems
        : [req.body.checklistItems];
      const status = Array.isArray(req.body.checklistStatus)
        ? req.body.checklistStatus
        : [req.body.checklistStatus];

      checklist = items
        .filter((text) => text.trim() !== "")
        .map((text, idx) => ({
          text: text,
          isDone: status[idx] === "true",
        }));
    }

    // 2. Traitement des pièces jointes à conserver ou effacer du disque
    let keepAttachments = req.body.keepAttachments || [];
    if (!Array.isArray(keepAttachments)) keepAttachments = [keepAttachments];

    let updatedAttachments = [];
    existingNote.attachments.forEach((file) => {
      if (keepAttachments.includes(file._id.toString())) {
        updatedAttachments.push(file);
      } else {
        const absolutePath = path.join(
          __dirname,
          "../../public",
          file.filepath,
        );
        if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
      }
    });

    // Insertion des nouveaux fichiers ajoutés
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        updatedAttachments.push({
          filename: file.originalname,
          filepath: "/uploads/" + file.filename,
        });
      });
    }

    // 3. Traitement des Tags
    const tagsArray = req.body.tags
      ? req.body.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== "")
      : [];

    // 4. Persistence en Base de Données
    await Note.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      {
        title: req.body.title || "Note sans titre",
        body: req.body.isTodo === "true" ? "" : req.body.body || "",
        isTodo: req.body.isTodo === "true",
        colorCategory: req.body.colorCategory || "default",
        isPinned: req.body.isPinned === "true" || req.body.isPinned === "on",
        isPrivate: req.body.isPrivate === "true" || req.body.isPrivate === "on",
        checklist: checklist,
        attachments: updatedAttachments,
        tags: tagsArray,
      },
    );

    req.session.notification = 3;
    res.redirect("/dashboard");
  } catch (error) {
    if (req.files)
      req.files.forEach((f) => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    res.status(500).send("Erreur serveur interne");
  }
};

/**
 * DELETE /dashboard/item-delete-:id
 * Supprime définitivement une note et ses fichiers physiques associés
 */
exports.dashboardDeleteNote = async (req, res) => {
  try {
    // 1. Récupération de l'identifiant de l'utilisateur (Passport ou Session classique)
    let userId = null;
    if (req.user && req.user._id) {
      userId = req.user._id;
    } else if (req.session && req.session.user && req.session.user._id) {
      userId = req.session.user._id;
    }

    if (!userId) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    // 2. Trouver la note pour analyser ses pièces jointes avant destruction
    const note = await Note.findOne({ _id: req.params.id, user: userId });

    if (!note) {
      return res
        .status(404)
        .json({ error: "Note introuvable ou non autorisée" });
    }

    // 3. Suppression physique de toutes les pièces jointes du disque dur
    if (note.attachments && note.attachments.length > 0) {
      note.attachments.forEach((file) => {
        // file.filepath ressemble à "/uploads/123456-image.jpg"
        const absoluteFilePath = path.join(
          __dirname,
          "../../public",
          file.filepath,
        );

        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath); // Efface le fichier du serveur
        }
      });
    }

    // 4. Suppression définitive du document dans la base de données MongoDB
    await Note.deleteOne({ _id: req.params.id, user: userId });

    // 5. Enregistrement du code de notification de succès pour l'interface
    req.session.notification = 2;

    // Renvoie l'URL de redirection que le script Fetch va intercepter et suivre
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Erreur complète lors de la suppression de la note :", error);
    res.status(500).json({
      error: "Une erreur est survenue lors de la suppression de la note.",
    });
  }
};

/**
 * Add /
 * Add Note
 */
exports.dashboardCreateNoteSubmit = async (req, res) => {
  try {
    let userId = null;
    if (req.user && req.user._id) {
      userId = req.user._id;
    } else if (req.session && req.session.user && req.session.user._id) {
      userId = req.session.user._id;
    }

    if (!userId) {
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      req.session.notification = 5;
      return res.redirect("/login");
    }

    // 1. Définition des formats de fichiers explicitement autorisés
    const allowedExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".pdf",
      ".docx",
      ".xlsx",
      ".xls",
      ".mp4",
    ];
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "video/mp4",
    ];

    // 2. Vérification stricte des fichiers reçus
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileExt = path.extname(file.originalname).toLowerCase();
        const fileMime = file.mimetype;

        if (
          !allowedExtensions.includes(fileExt) ||
          !allowedMimeTypes.includes(fileMime)
        ) {
          // Sécurité : Nettoyage immédiat
          req.files.forEach((f) => {
            if (fs.existsSync(f.path)) {
              fs.unlinkSync(f.path);
            }
          });

          req.session.notification = 6;
          return res.redirect("/dashboard");
        }
      }
    }

    // 3. Récupération et formatage de la checklist si présente
    let checklist = [];
    if (req.body.checklistItems) {
      const items = Array.isArray(req.body.checklistItems)
        ? req.body.checklistItems
        : [req.body.checklistItems];

      checklist = items
        .filter((text) => text.trim() !== "")
        .map((text) => ({
          text: text,
          isDone: false,
        }));
    }

    // 4. Traitement et stockage des fichiers validés
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        filename: file.originalname,
        filepath: "/uploads/" + file.filename, // Accès direct via le routage statique public
      }));
    }

    // 5. Préparation des données complètes
    // 5. Préparation des données complètes
    const newNote = {
      user: userId,
      title: req.body.title || "Note sans titre",
      // 🛠️ S'assure qu'une chaîne vide propre est fournie si le format est To-Do List
      body: req.body.isTodo === "true" ? "" : req.body.body || "",
      colorCategory: req.body.colorCategory || "default",
      isPinned: req.body.isPinned === "true" || req.body.isPinned === "on",
      isTodo: req.body.isTodo === "true",
      checklist: checklist,
      attachments: attachments,
      isPrivate: req.body.isPrivate !== "false",
      tags: req.body.tags
        ? req.body.tags.split(",").map((tag) => tag.trim())
        : [],
    };

    // 6. Sauvegarde en Base de Données
    await Note.create(newNote);

    req.session.notification = 1;
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Erreur complète lors de la création de la note:", error);

    // Nettoyage de secours des fichiers en cas d'échec
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }

    res.status(500).render("404", {
      title: "Erreur Serveur",
      description: "Une erreur est survenue lors du traitement.",
      page: 0,
      layout: "./layouts/dashboard", // Chemin corrigé (relatif au dossier views)
    });
  }
};

/**
 * GET /
 * View Specific Note
 */

// Le Contrôleur (server/controllers/dashboardController.js)
exports.dashboardViewNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id })
      .populate("user", "_id firstName lastName email avatar role")
      .lean();

    if (!note) {
      req.session.notification = 10;
      return res.redirect("/notes-for-all-users");
    }

    const locals = {
      title: "Note - " + note.title,
      description: "Free NodeJs Notes app.",
      page: 8,
      search: "",
    };

    let userName = null;
    if (req.session.user) {
      userName = req.session.user.firstName;
    } else if (req.user) {
      userName = req.user.firstName;
    }

    res.render("dashboard/view-note", {
      userName,
      locals,
      GetVar: "",
      note,
      noteID: req.params.id,
      layout: "../views/layouts/dashboard",
      connecter: 1,
    });
  } catch (error) {
    console.error("Erreur d'affichage de la note:", error);
    res.status(500).render("404", { layout: false });
  }
};
