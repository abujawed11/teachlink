import apiClient from "./client";

export async function getSubjects() {
  const { data } = await apiClient.get("/lookups/subjects");
  return data.subjects;
}

export async function getGrades() {
  const { data } = await apiClient.get("/lookups/grades");
  return data.grades;
}

export async function getBoards() {
  const { data } = await apiClient.get("/lookups/boards");
  return data.boards;
}

export async function getLanguages() {
  const { data } = await apiClient.get("/lookups/languages");
  return data.languages;
}
