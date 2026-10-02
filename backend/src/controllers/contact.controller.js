const asyncHandler = require("../middleware/asyncHandler");
const AppError = require("../utils/AppError");
const contactService = require("../services/contact.service");

const send = asyncHandler(async (req, res) => {
  const request = await contactService.sendRequest(req.user.sub, req.params.slug, req.body);
  res.status(201).json({ request });
});

const revealNumber = asyncHandler(async (req, res) => {
  const contact = await contactService.revealContactNumber(req.user.sub, req.params.slug);
  res.json(contact);
});

const received = asyncHandler(async (req, res) => {
  const result = await contactService.listReceived(req.user.sub);
  res.json(result);
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await contactService.getUnreadCount(req.user.sub);
  res.json({ unreadCount: count });
});

const markRead = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Request not found", 404, "NOT_FOUND");
  }
  await contactService.markRead(req.user.sub, id);
  res.status(204).end();
});

const sent = asyncHandler(async (req, res) => {
  const requests = await contactService.listSent(req.user.sub);
  res.json({ requests });
});

module.exports = { send, revealNumber, received, unreadCount, markRead, sent };
