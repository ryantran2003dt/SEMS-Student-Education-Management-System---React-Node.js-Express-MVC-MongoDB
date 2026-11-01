const User = require('../models/User');
const Message = require('../models/Message');
const { Class } = require('../models/Class');
const { ParentStudentLink } = require('../models/Profiles');

class MessageService {
  async getContactIds(user) {
    if (user.role === 'admin') {
      const users = await User.find({ _id: { $ne: user._id }, status: 'active' }).select('_id');
      return users.map(({ _id }) => _id);
    }

    let relatedUserIds = [];
    if (user.role === 'teacher') {
      const classes = await Class.find({ teacherId: user._id }).select('studentIds');
      const studentIds = [...new Set(classes.flatMap((classItem) => classItem.studentIds.map(String)))];
      const links = studentIds.length
        ? await ParentStudentLink.find({
            studentUserId: { $in: studentIds },
            status: 'verified'
          }).select('parentUserId')
        : [];
      relatedUserIds = [
        ...classes.map((classItem) => classItem.studentIds).flat(),
        ...links.map((link) => link.parentUserId)
      ];
    } else if (user.role === 'student') {
      const classes = await Class.find({ studentIds: user._id }).select('teacherId');
      const links = await ParentStudentLink.find({
        studentUserId: user._id,
        status: 'verified'
      }).select('parentUserId');
      relatedUserIds = [
        ...classes.map((classItem) => classItem.teacherId),
        ...links.map((link) => link.parentUserId)
      ];
    } else if (user.role === 'parent') {
      const links = await ParentStudentLink.find({
        parentUserId: user._id,
        status: 'verified'
      }).select('studentUserId');
      const studentIds = links.map((link) => link.studentUserId);
      const classes = studentIds.length
        ? await Class.find({ studentIds: { $in: studentIds } }).select('teacherId')
        : [];
      relatedUserIds = [
        ...studentIds,
        ...classes.map((classItem) => classItem.teacherId)
      ];
    }

    const adminIds = await User.find({ role: 'admin', status: 'active' }).select('_id');
    const uniqueIds = [...new Set([...relatedUserIds, ...adminIds.map(({ _id }) => _id)].map(String))]
      .filter((id) => id !== String(user._id));
    const activeUsers = await User.find({ _id: { $in: uniqueIds }, status: 'active' }).select('_id');
    return activeUsers.map(({ _id }) => _id);
  }

  async getContacts(user) {
    const contactIds = await this.getContactIds(user);
    return User.find({ _id: { $in: contactIds } })
      .select('fullName role avatar')
      .sort({ fullName: 1 });
  }

  async getConversations(user) {
    const userId = user._id;
    const contactIds = await this.getContactIds(user);
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { recipientId: userId }]
        }
      },
      {
        $addFields: {
          peerId: {
            $cond: [{ $eq: ['$senderId', userId] }, '$recipientId', '$senderId']
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$peerId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$recipientId', userId] }, { $eq: ['$readAt', null] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'peer'
        }
      },
      { $unwind: '$peer' },
      { $sort: { 'lastMessage.createdAt': -1 } },
      {
        $project: {
          _id: 0,
          peer: { _id: '$peer._id', fullName: '$peer.fullName', role: '$peer.role', avatar: '$peer.avatar' },
          lastMessage: {
            _id: '$lastMessage._id',
            senderId: '$lastMessage.senderId',
            recipientId: '$lastMessage.recipientId',
            type: '$lastMessage.type',
            text: '$lastMessage.text',
            attachment: '$lastMessage.attachment',
            createdAt: '$lastMessage.createdAt'
          },
          unreadCount: 1
        }
      }
    ]);

    const allowedIds = new Set(contactIds.map(String));
    return conversations.filter((conversation) => allowedIds.has(String(conversation.peer._id)));
  }

  async getThread(user, peerId) {
    const messages = await Message.find({
      $or: [
        { senderId: user._id, recipientId: peerId },
        { senderId: peerId, recipientId: user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    await Message.updateMany(
      { senderId: peerId, recipientId: user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return messages.reverse();
  }

  async sendMessage(senderId, recipientId, { type = 'text', text = '', attachment = null }) {
    return Message.create({ senderId, recipientId, type, text, attachment });
  }
}

module.exports = new MessageService();
