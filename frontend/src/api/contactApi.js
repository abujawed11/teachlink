import apiClient from "./client";

export async function sendContactRequest(slug, payload) {
  const { data } = await apiClient.post(`/teachers/${slug}/contact`, payload);
  return data.request;
}

export async function getReceivedRequests() {
  const { data } = await apiClient.get("/contact-requests/received");
  return data;
}

export async function getUnreadCount() {
  const { data } = await apiClient.get("/contact-requests/received/unread-count");
  return data.unreadCount;
}

export async function markRequestRead(id) {
  await apiClient.patch(`/contact-requests/${id}/read`);
}

export async function getSentRequests() {
  const { data } = await apiClient.get("/contact-requests/sent");
  return data.requests;
}

export async function revealContactNumber(slug) {
  const { data } = await apiClient.get(`/teachers/${slug}/contact-number`);
  return data;
}
