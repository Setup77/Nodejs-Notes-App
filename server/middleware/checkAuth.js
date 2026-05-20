/**
 * Middleware : Bloque l'accès aux utilisateurs NON connectés
 * Utilisé pour : /dashboard, /profil, etc.
 */
exports.isLoggedIn = function (req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    const locals = {
      title: "Accès Refusé - Notes",
      description: "Free NodeJs Notes app.",
      logout: "",
      page: 1, // Fixe la page sur l'accueil par défaut
      search: "",
      accessDenied: "Accès Refusé. Veuillez vous connecter",
    };

    // Renvoie à l'accueil en notifiant l'obligation de connexion
    res.render("index", {
      locals,
      layout: "../views/layouts/front-page",
    });
  }
};

/**
 * Middleware : Bloque l'accès aux utilisateurs DÉJÀ connectés
 * Utilisé pour : /login, /register
 */
exports.isLoggedOut = function (req, res, next) {
  if (req.session && req.session.user) {
    // Redirection immédiate vers le tableau de bord pour éviter le double login
    return res.redirect("/dashboard");
  }
  // Si pas de session, on laisse accéder aux formulaires d'authentification
  next();
};
