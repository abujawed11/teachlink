import apiClient from "./client";

export async function updateAccount(changes) {
  const { data } = await apiClient.patch("/users/me", changes);
  return data.user;
}

export async function changePassword(payload) {
  await apiClient.post("/users/me/password", payload);
}
