import apiClient from "./client";

export async function getMyProfile() {
  const { data } = await apiClient.get("/teachers/me");
  return data.profile;
}

export async function updateMyProfile(patch) {
  const { data } = await apiClient.patch("/teachers/me", patch);
  return data.profile;
}

export async function publishMyProfile() {
  const { data } = await apiClient.post("/teachers/me/publish");
  return data.profile;
}

export async function unpublishMyProfile() {
  const { data } = await apiClient.post("/teachers/me/unpublish");
  return data.profile;
}

export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append("photo", file);
  const { data } = await apiClient.post("/teachers/me/photo", formData);
  return data.profile;
}
