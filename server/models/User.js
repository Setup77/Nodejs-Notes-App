const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true // Évite les doublons de comptes
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  preferences: {
    darkMode: { type: Boolean, default: false }
  },
  security: {
    pinCode: { type: String, default: null } // Pour déverrouiller les notes sensibles
  }
});

module.exports = mongoose.model('User', UserSchema);
