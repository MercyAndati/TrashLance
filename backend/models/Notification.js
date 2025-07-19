const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'booking_confirmed',
      'booking_cancelled',
      'booking_rescheduled',
      'service_started',
      'service_completed',
      'payment_received',
      'payment_failed',
      'comment_received',
      'provider_arriving',
      'provider_delayed',
      'system_maintenance',
      'account_verified',
      'password_changed',
      'new_message',
      'new_comment',
      'promotion',
      'reminder'
    ]
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  data: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  channels: {
    inApp: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      read: { type: Boolean, default: false },
      readAt: Date
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      opened: { type: Boolean, default: false },
      openedAt: Date
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      clicked: { type: Boolean, default: false },
      clickedAt: Date
    }
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  category: {
    type: String,
    enum: ['booking', 'payment', 'account', 'system', 'marketing'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  expiresAt: Date,
  scheduledFor: Date
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.channels.inApp.read = true;
  this.channels.inApp.readAt = new Date();
};

// Static method to create and send notification
notificationSchema.statics.createAndSend = async function(notificationData) {
  const notification = new this(notificationData);
  await notification.save();
  
  // Here you would integrate with your notification service
  // to send via different channels (email, SMS, push, etc.)
  
  return notification;
};

module.exports = mongoose.model('Notification', notificationSchema);