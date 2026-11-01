const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['text', 'image', 'file', 'sticker'], default: 'text' },
    text: { type: String, trim: true, maxlength: 3000, default: '' },
    attachment: {
      url: String,
      name: String,
      mimeType: String,
      size: Number
    },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, readAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
