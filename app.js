require("dotenv").config();

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const path = require("path");
const dayjs = require("dayjs");
require("dayjs/locale/fr"); // Obligatoire pour charger la locale française
const relativeTime = require("dayjs/plugin/relativeTime");

// Configuration Globale
const app = express();
const port = process.env.PORT || 5000;

// Connexion Base de Données
const connectDB = require("./server/config/db");
connectDB();

// Configuration DayJS
dayjs.extend(relativeTime);
dayjs.locale("fr");
app.locals.dayjs = dayjs;

// Fichiers Statiques (Dossier Public)
app.use(express.static(path.join(__dirname, "public")));

// Middlewares de décodage des requêtes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(cookieParser());

// Configuration Session & Stockage Mongo
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false, // Optimisation : éviter les réécritures inutiles
    saveUninitialized: false, // RGPD : ne crée pas de session sans données
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: false, // Passer à true uniquement si vous utilisez HTTPS
      //secure: process.env.NODE_ENV === "production", // Sécurisé uniquement en HTTPS (production)
      //httpOnly: true, // Protège contre les attaques XSS
    },
  }),
);

// Initialisation Passeport & Flash (Après la session)
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Middleware d'injection des variables globales de session
app.use((req, res, next) => {
  res.locals.session = req.session || null;
  res.locals.user = req.user || null; // Utilise req.user injecté par Passport
  next();
});

// Moteur de Template EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "./layouts/main");

// --- APPLICATION DU MIDDLEWARE CSRF ---
const {
  injectCsrfToken,
  doubleCsrfProtection,
} = require("./server/middleware/csrfProtection");

app.use(injectCsrfToken); // Génère le token pour les formulaires EJS

// Recommandation : Appliquez 'doubleCsrfProtection' directement à l'intérieur de vos fichiers de routes (ex: auth.js, dashboard.js) sur les requêtes POST/PUT/DELETE plutôt qu'ici globalement.

// Routes
app.use("/", require("./server/routes/auth"));
app.use("/", require("./server/routes/dashboard"));
app.use("/", require("./server/routes/index"));

// Gestion Erreur 404 (Toujours en dernier) dans app.js
app.get("*", function (req, res) {
  const locals = {
    title: "404 - Page Introuvable",
    description: "La page que vous recherchez n'existe pas.",
    page: 0, // Évite d'activer un lien de la navbar
  };

  // On enlève "layout: false" pour utiliser "./layouts/main" par défaut
  res.status(404).render("404", {  layout: "../views/layouts/dashboard"  });
});

// Lancement du Serveur
app.listen(port, () => {
  console.log(`Le serveur tourne sur le port : http://localhost:${port}`);
});
