import apiClient from "./client";

export async function getAdminUsers(params) {
  const { data } = await apiClient.get("/admin/users", { params });
  return data;
}

export async function setUserStatus(id, status) {
  const { data } = await apiClient.patch(`/admin/users/${id}/status`, { status });
  return data.user;
}

export async function getAdminTeachers(params) {
  const { data } = await apiClient.get("/admin/teachers", { params });
  return data;
}

export async function moderateTeacher(id, changes) {
  const { data } = await apiClient.patch(`/admin/teachers/${id}`, changes);
  return data.teacher;
}

export async function getAdminLookup(type) {
  const { data } = await apiClient.get(`/admin/lookups/${type}`);
  return data.items;
}

export async function createLookupItem(type, payload) {
  const { data } = await apiClient.post(`/admin/lookups/${type}`, payload);
  return data.item;
}

export async function updateLookupItem(type, id, changes) {
  const { data } = await apiClient.patch(`/admin/lookups/${type}/${id}`, changes);
  return data.item;
}
