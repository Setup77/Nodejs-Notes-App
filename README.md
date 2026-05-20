# Node.js Notes App 📝

Une application web de gestion de notes sécurisée et performante construite avec une architecture MVC.

## 🚀 Fonctionnalités
- **Authentification Sécurisée** : Gestion des utilisateurs avec Passport.js.
- **Tableau de Bord** : Interface complète pour créer, lire, modifier et supprimer (CRUD) des notes.
- **Sécurité Renforcée** : Protection contre les failles CSRF et gestion sécurisée des sessions.
- **Persistance des Données** : Base de données MongoDB avec stockage des sessions via `connect-mongo`.
- **Interface Fluide** : Rendu dynamique avec EJS, Express Layouts, Bootstrap 5 et Day.js pour le formatage des dates en français.

## 🛠️ Technologies Utilisées
- **Backend** : Node.js, Express.js
- **Base de données** : MongoDB, Mongoose
- **Moteur de template** : EJS (Express HTML)
- **Sécurité & Auth** : Passport.js, Express-session, CSRF protection
- **Design** : Bootstrap 5, Font-Awesome

## 📦 Installation et Lancement

### 1. Prérequis
Assurez-vous d'avoir [Node.js](https://nodejs.org) et [MongoDB](https://mongodb.com) installés.

### 2. Cloner le projet
```bash
git clone <URL_DE_VOTRE_DEPOT_GITHUB>
cd nodejs-notes
```

### 3. Installer les dépendances
```bash
npm install
```

### 4. Configuration de l'environnement
Créez un fichier `.env` à la racine du projet et ajoutez vos variables :
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_session_key
```

### 5. Démarrer l'application
```bash
npm start
```
L'application sera accessible sur : `http://localhost:5000`
