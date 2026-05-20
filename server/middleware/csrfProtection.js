const crypto = require("crypto");

const injectCsrfToken = (req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(48).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

const doubleCsrfProtection = (req, res, next) => {
  // EXCLUSION DES ROUTES D'API DE VALIDATION EN TEMPS RÉEL
  if (req.path === "/api/check-email" || req.path === "/api/check-captcha") {
    return next();
  }

  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // 2. Récupération avec tolérance aux majuscules/minuscules des en-têtes HTTP
  const clientToken =
    req.body._csrf || req.headers["x-csrf-token"] || req.headers["csrf-token"];
  const sessionToken = req.session.csrfToken;

  if (!clientToken || clientToken !== sessionToken) {
    console.error(
      `🚨 Tentative d'attaque CSRF bloquée sur la route : ${req.originalUrl}`,
    );
    return res.status(403).render("404", {
      layout: false,
      locals: { title: "Accès Refusé", description: "", page: 0, search: "" },
      errors: {
        emailExist:
          "Validation de sécurité échouée (CSRF invalide). Veuillez recharger la page.",
      },
    });
  }

  next();
};

module.exports = {
  injectCsrfToken,
  doubleCsrfProtection,
};
