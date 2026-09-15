const Notification = require('../models/Notification');
const { successResponse, asyncHandler, ApiError } = require('../utils/helpers');

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
  return successResponse(res, 200, 'Notifications retrieved', { notifications, unreadCount });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, 'Notification not found.');
  if (!notification.userId.equals(req.user._id)) throw new ApiError(403, 'Forbidden.');

  notification.read = true;
  await notification.save();
  return successResponse(res, 200, 'Notification marked as read', { notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
  return successResponse(res, 200, 'All notifications marked as read');
});

module.exports = { listNotifications, markRead, markAllRead };
