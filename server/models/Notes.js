const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NoteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  body: {
    type: String, // Stockera le HTML généré par Quill.js ou TinyMCE
    required: false,
  },
  // --- VISUALISATION & CLASSEMENT ---
  // 🎨 Mis à jour : Devient la classe CSS du dégradé style WhatsApp
  colorCategory: {
    type: String,
    default: "default",
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  isPinned: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  // --- CONFIGURATIONS SPÉCIALES ---
  isTodo: {
    type: Boolean,
    default: false,
  },
  checklist: [
    {
      text: String,
      isDone: { type: Boolean, default: false },
    },
  ],
  attachments: [
    {
      filename: String,
      filepath: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  // --- SÉCURITÉ & PARTAGE ---
  isPrivate: {
    type: Boolean,
    default: false,
  },
  shareLink: {
    type: String,
    unique: true,
    sparse: true,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  // --- RAPPELS ---
  reminderDate: {
    type: Date,
    default: null,
  },
  // --- TIMESTAMPS ---
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

NoteSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Note", NoteSchema);
