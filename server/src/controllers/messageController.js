const mongoose = require('mongoose');
const path = require('path');
const messageService = require('../services/messageService');
const Message = require('../models/Message');
const { sendSuccess, sendError } = require('../utils/response');

const STICKERS = ['😀', '😄', '🥰', '😂', '👏', '👍', '❤️', '🎉', '🤔', '🙏', '💪', '🌟'];

class MessageController {
  async ensureAttachmentAccess(req, res, next) {
    try {
      const { filename } = req.params;
      if (path.basename(filename) !== filename || !/^[a-f0-9-]+\.[a-z0-9]+$/i.test(filename)) {
        return sendError(res, 'Tệp đính kèm không hợp lệ', 400);
      }
      const attachmentUrl = `/api/messages/files/${filename}`;
      const message = await Message.findOne({
        'attachment.url': attachmentUrl,
        $or: [{ senderId: req.user._id }, { recipientId: req.user._id }]
      }).select('_id senderId recipientId attachment');
      if (!message) {
        return sendError(res, 'Không tìm thấy tệp đính kèm', 404);
      }
      const peerId = String(message.senderId) === String(req.user._id)
        ? message.recipientId
        : message.senderId;
      const contactIds = await messageService.getContactIds(req.user);
      if (!contactIds.some((id) => String(id) === String(peerId))) {
        return sendError(res, 'Bạn không còn quyền truy cập cuộc trò chuyện này', 403);
      }
      req.chatAttachment = message.attachment;
      next();
    } catch (err) {
      next(err);
    }
  }

  getAttachment(req, res, next) {
    const filename = path.basename(req.params.filename);
    const filePath = path.resolve(__dirname, '../../private-uploads/chat', filename);
    const isImage = req.chatAttachment.mimeType.startsWith('image/');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `${isImage ? 'inline' : 'attachment'}; filename="${filename}"`);
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) next(err);
    });
  }

  async ensureContact(req, res, next) {
    try {
      const { userId } = req.params;
      if (!mongoose.isValidObjectId(userId)) {
        return sendError(res, 'Người nhận không hợp lệ', 400);
      }
      const contactIds = await messageService.getContactIds(req.user);
      if (!contactIds.some((id) => String(id) === userId)) {
        return sendError(res, 'Bạn không có quyền trao đổi tin nhắn với người dùng này', 403);
      }
      next();
    } catch (err) {
      next(err);
    }
  }

  async getContacts(req, res, next) {
    try {
      const contacts = await messageService.getContacts(req.user);
      return sendSuccess(res, contacts);
    } catch (err) {
      next(err);
    }
  }

  async getConversations(req, res, next) {
    try {
      const conversations = await messageService.getConversations(req.user);
      return sendSuccess(res, conversations);
    } catch (err) {
      next(err);
    }
  }

  async getThread(req, res, next) {
    try {
      const { userId } = req.params;
      if (!mongoose.isValidObjectId(userId)) {
        return sendError(res, 'Người nhận không hợp lệ', 400);
      }
      const contactIds = await messageService.getContactIds(req.user);
      if (!contactIds.some((id) => String(id) === userId)) {
        return sendError(res, 'Bạn không có quyền trao đổi tin nhắn với người dùng này', 403);
      }
      const messages = await messageService.getThread(req.user, userId);
      return sendSuccess(res, messages);
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const { userId } = req.params;
      const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
      if (text.length > 3000) {
        return sendError(res, 'Tin nhắn không được vượt quá 3000 ký tự', 400);
      }

      if (req.file) {
        const type = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
        const message = await messageService.sendMessage(req.user._id, userId, {
          type,
          text,
          attachment: {
            url: `/api/messages/files/${req.file.filename}`,
            name: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
          }
        });
        return sendSuccess(res, message, 'Đã gửi tệp', 201);
      }

      const type = req.body.type || 'text';
      if (type === 'sticker') {
        if (!STICKERS.includes(text)) {
          return sendError(res, 'Sticker không được hỗ trợ', 400);
        }
        const message = await messageService.sendMessage(req.user._id, userId, { type, text });
        return sendSuccess(res, message, 'Đã gửi sticker', 201);
      }
      if (type !== 'text' || !text) {
        return sendError(res, 'Tin nhắn không được để trống', 400);
      }

      const message = await messageService.sendMessage(req.user._id, userId, { type, text });
      return sendSuccess(res, message, 'Đã gửi tin nhắn', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MessageController();
