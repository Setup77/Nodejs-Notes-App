const User = require("../models/User");
const Note = require("../models/Notes");
const Comment = require("../models/Comment");
const Category = require("../models/Category");
const mongoose = require("mongoose");

/**
 * GET /
 * Homepage
 */
exports.homepage = async (req, res) => {
  const GetVar = req.session.notification;
  req.session.notification = null;

  const locals = {
    title: "NodeJs Notes",
    description: "Free NodeJs Notes app.",
    logout: GetVar,
    accessDenied: "",
    page: 1,
    search: "",
  };

  res.render("index", {
    locals,
    layout: "../views/layouts/front-page",
  });
};

/**
 * GET /logout
 * Déconnexion de l'utilisateur
 */
exports.homepagelogout = async (req, res) => {
  req.session.notification = "Déconnexion réussie 🎉";
  req.session.user = null; // Nettoyage de la session active

  console.log("Déconnecté avec succès");
  res.redirect("/");
};

/**
 * GET /profil-:id
 * Affichage d'un profil ciblé avec statistiques de réseau social
 */
exports.profil = async (req, res) => {
  const locals = {
    title: "Profil - NodeJs Notes",
    description: "Free NodeJs Notes app.",
    page: 5,
    search: "",
  };

  try {
    const { id } = req.params;

    // Validation stricte du format ObjectID de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.session.notification = "ID de profil invalide";
      return res.redirect("/users");
    }

    // Gestion adaptative de la session visiteur anonyme
    const userSession = req.session.user ? req.session.user : { _id: "" };

    // Recherche de l'utilisateur ciblé
    const user = await User.findById(id);
    if (!user) {
      req.session.notification = "Utilisateur non trouvé";
      return res.redirect("/users");
    }

    // Extraction en parallèle des données statistiques du réseau social depuis vos modèles
    const [noteCount, commentCount, categoryCount, userCategories] =
      await Promise.all([
        Note.countDocuments({ user: id }),
        Comment.countDocuments({ user: id }),
        Category.countDocuments({ user: id }),
        Category.find({ user: id }),
      ]);

    res.render("profil", {
      locals,
      user,
      id,
      userSession,
      stats: { noteCount, commentCount, categoryCount },
      categories: userCategories,
    });
  } catch (err) {
    console.error("Erreur serveur profil :", err);
    req.session.notification = "Erreur interne du serveur";
    res.redirect("/users");
  }
};

/**
 * GET /users
 * Liste tous les utilisateurs avec leur volume total de notes rédigées
 */
exports.users = async (req, res) => {
  // Récupération et nettoyage de la notification de session
  const GetVar = req.session.notification || null;
  req.session.notification = null;

  const locals = {
    title: "Utilisateurs - Notes",
    description: "Application de notes en Node.js.",
    page: 4,
    search: "Rechercher un utilisateur (nom, email, rôle)",
  };

  // Récupération de l'ID de l'utilisateur connecté via Passport.js ou la Session classique
  let currentUserId = req.user?._id || req.session?.user?._id || null;
  let matchStage = {};

  // Exclure le compte connecté du catalogue pour éviter de s'auto-consulter
  if (currentUserId) {
    try {
      matchStage = { _id: { $ne: new mongoose.Types.ObjectId(currentUserId) } };
    } catch (idError) {
      console.error(
        "Format ObjectId invalide pour l'utilisateur courant :",
        idError,
      );
    }
  }

  try {
    const users = await User.aggregate([
      // 1. Filtrer pour exclure l'utilisateur en cours
      { $match: matchStage },

      // 2. Jointure avec la collection 'notes' (attention au nom exact de la collection sous MongoDB)
      {
        $lookup: {
          from: "notes",
          localField: "_id",
          foreignField: "user",
          as: "userNotes",
        },
      },

      // 3. Calculer la taille du tableau des notes récupérées
      {
        $addFields: {
          noteCount: { $size: "$userNotes" },
        },
      },

      // 4. Nettoyer les données sensibles et inutiles pour la vue publique
      {
        $project: {
          password: 0,
          userNotes: 0,
          security: 0,
          preferences: 0,
        },
      },

      // 5. Appliquer un tri stable par prénom, puis par nom
      {
        $sort: {
          firstName: 1,
          lastName: 1,
        },
      },
    ]);

    // Rendu de la vue améliorée avec les données nettoyées
    res.render("users", {
      locals,
      users,
      GetVar,
      layout: "./layouts/main", // Force l'utilisation du layout principal si nécessaire
    });
  } catch (err) {
    console.error("Erreur agrégation catalogue utilisateurs :", err);
    res.status(500).send("Une erreur interne est survenue sur le serveur.");
  }
};

/**
 * POST /update-profile
 * Sauvegarde dynamique d'un champ édité en AJAX
 */
exports.ProfilUpdate = async (req, res) => {
  try {
    const { field, value } = req.body;

    // Protection stricte : l'adresse email est retirée des autorisations de modification directe
    if (!["firstName", "lastName", "role"].includes(field)) {
      return res.status(400).json({
        success: false,
        error: "Ce champ ne peut pas être édité directement",
      });
    }

    if (!value.trim()) {
      return res.status(400).json({
        success: false,
        error: "La valeur soumise ne peut pas être vide",
      });
    }

    // Modification basée exclusivement sur l'utilisateur connecté via la session principale
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user._id,
      { [field]: value.trim() },
      { new: true },
    );

    // Actualisation de l'état de la session utilisateur globale en temps réel
    req.session.user[field] = updatedUser[field];

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
