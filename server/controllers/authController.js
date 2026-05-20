const User = require("../models/User");
const bcrypt = require("bcrypt");

/**
 * GET /register
 * Afficher la page d'inscription
 */
exports.register = async (req, res) => {
  const locals = {
    title: "Register - NodeJs Notes",
    description: "Free NodeJs Notes app.",
    page: 2,
    search: "",
  };
  const errors = {};
  res.render("register", { locals, errors });
};

/**
 * GET /login
 * Afficher la page de connexion
 */
exports.login = async (req, res) => {
  const locals = {
    title: "Login - NodeJs Notes",
    description: "Free NodeJs Notes app.",
    page: 1,
    search: "",
  };

  const errors = { emailExist: "" };

  // 1. On capture IMMÉDIATEMENT la donnée avant toute modification de session
  const registeredUser = req.session.flashSuccessUser
    ? { ...req.session.flashSuccessUser }
    : null;

  // 2. Si un utilisateur vient de s'inscrire, on nettoie et on synchronise d'abord la BDD
  if (registeredUser) {
    delete req.session.flashSuccessUser;

    return req.session.save((err) => {
      if (err) console.error("Erreur nettoyage session :", err);
      // On effectue le rendu seulement APRÈS confirmation de la sauvegarde
      return res.render("login", {
        locals,
        registeredUser, // Contient la copie sécurisée des données
        errors,
      });
    });
  }

  // 3. Comportement d'affichage standard (accès direct à la page /login)
  res.render("login", {
    locals,
    registeredUser: null,
    errors: {}
  });
};

/**
 * POST /register
 * Traitement de l'inscription d'un utilisateur
 */
exports.registerAddUserSubmit = async (req, res) => {
  const locals = {
    title: "Register - NodeJs Notes",
    description: "Free NodeJs Notes app.",
    page: 2,
    search: "",
  };

  try {
    const { firstName, lastName, email, password, password2, captcha } =
      req.body;

    // 1. Validation du CAPTCHA
    if (!captcha || captcha.toLowerCase() !== req.session.captcha) {
      const errors = {
        emailExist: "Le code CAPTCHA est incorrect. Veuillez réessayer.",
      };
      return res.render("register", { locals, errors });
    }

    // 2. Vérification de la correspondance des mots de passe
    if (password !== password2) {
      const errors = {
        emailExist: "Oops! Les deux mots de passe sont différents.",
      };
      return res.render("register", { locals, errors });
    }

    // 3. Vérification de l'existence de l'email en BDD
    let user = await User.findOne({ email: email });
    if (user) {
      const errors = { emailExist: "Oops! Cet Email est déjà utilisé." };
      return res.render("register", { locals, errors });
    }

    // 4. Hachage du mot de passe et création du compte
    const hashedPassword = await bcrypt.hash(password, 10);

    // CORRECTION : Ajout de "const newUser = " devant "await User.create"
    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatar: "photoDefaut.jpg",
      role: "user",
    });

    console.log("✅ Nouvel utilisateur créé avec succès !");

    // Fonctionne désormais correctement
    req.session.flashSuccessUser = {
      firstName: newUser.firstName,
      email: newUser.email,
    };

    // Sauvegarde et redirection
    req.session.save((err) => {
      if (err) console.error("Erreur session :", err);
      return res.redirect("/login");
    });
  } catch (e) {
    console.error("Erreur lors de l'inscription :", e);
    const errors = {
      emailExist:
        "Une erreur interne est survenue lors de la création du compte.",
    };
    res.render("register", { locals, errors });
  }
};

/**
 * POST /login
 * Traitement de la connexion utilisateur
 */
exports.loginConnexion = async (req, res) => {
  const locals = {
    title: "Login - NodeJs Notes",
    description: "Free NodeJs Notes app.",
    page: 3,
    search: "",
  };

  try {
    const { email, password } = req.body;

    // 1. Recherche de l'utilisateur par Email
    let user = await User.findOne({ email: email });

    if (!user) {
      const errors = { emailExist: "Identifiants invalides ou compte inexistant." };
      return res.render("login", {
        locals,
        registeredUser: null,
        user: {}, // Évite les erreurs si la vue lit des propriétés de user
        errors,
      });
    }

    // 2. Vérification du mot de passe avec bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      const errors = { emailExist: "Mot de passe incorrect." };
      return res.render("login", {
        locals,
        registeredUser: null,
        user: {},
        errors,
      });
    }

    // 3. Configuration et initialisation de la session utilisateur
    req.session.notification = 4;
    req.session.user = {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    };

    console.log("✅ Session créée :", req.session.user);

    // Sauvegarde explicite de la session avant la redirection
    req.session.save((err) => {
      if (err) {
        console.error("Erreur de sauvegarde de session :", err);
        return res.redirect("/login");
      }
      res.redirect("/dashboard");
    });
  } catch (e) {
    console.error("Erreur lors de la connexion :", e);
    return res.render("login", {
      locals,
      registeredUser: null,
      user: {},
      errors: { emailExist: "Une erreur technique est survenue." },
    });
  }
};
