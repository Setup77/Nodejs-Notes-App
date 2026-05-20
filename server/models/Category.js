const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    default: "#3498db", // Couleur par défaut du badge de la catégorie
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Empêche un utilisateur d'avoir deux catégories avec le même nom
CategorySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", CategorySchema);
