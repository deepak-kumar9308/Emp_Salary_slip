const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;
        const filter = { recipient: req.user._id };
        if (unreadOnly === 'true') filter.isRead = false;

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        sendSuccess(res, 200, 'Notifications fetched.', {
            notifications, unreadCount,
            pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) }
        });
    } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
    try {
        const n = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!n) return sendError(res, 404, 'Notification not found.');
        sendSuccess(res, 200, 'Marked as read.', { notification: n });
    } catch (error) { next(error); }
};

const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
        sendSuccess(res, 200, 'All notifications marked as read.');
    } catch (error) { next(error); }
};

const deleteNotification = async (req, res, next) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
        sendSuccess(res, 200, 'Notification deleted.');
    } catch (error) { next(error); }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
