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

export async function setMySubjects(ids) {
  const { data } = await apiClient.put("/teachers/me/subjects", { ids });
  return data.profile;
}

export async function setMyGrades(ids) {
  const { data } = await apiClient.put("/teachers/me/grades", { ids });
  return data.profile;
}

export async function setMyBoards(ids) {
  const { data } = await apiClient.put("/teachers/me/boards", { ids });
  return data.profile;
}

export async function setMyLanguages(ids) {
  const { data } = await apiClient.put("/teachers/me/languages", { ids });
  return data.profile;
}

export async function addQualification(payload) {
  const { data } = await apiClient.post("/teachers/me/qualifications", payload);
  return data.profile;
}

export async function deleteQualification(id) {
  const { data } = await apiClient.delete(`/teachers/me/qualifications/${id}`);
  return data.profile;
}

export async function addExperience(payload) {
  const { data } = await apiClient.post("/teachers/me/experience", payload);
  return data.profile;
}

export async function deleteExperience(id) {
  const { data } = await apiClient.delete(`/teachers/me/experience/${id}`);
  return data.profile;
}

export async function addAvailability(payload) {
  const { data } = await apiClient.post("/teachers/me/availability", payload);
  return data.profile;
}

export async function deleteAvailability(id) {
  const { data } = await apiClient.delete(`/teachers/me/availability/${id}`);
  return data.profile;
}

export async function getPublicTeacher(slug) {
  const { data } = await apiClient.get(`/teachers/${slug}`);
  return data.profile;
}

export async function searchTeachers(params) {
  const { data } = await apiClient.get("/teachers", { params });
  return data;
}
