// src/api.js
import { API_BASE_URL } from "./config";

export async function getData(endpoint) {
  const response = await fetch(`${API_BASE_URL}/${endpoint}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  return response.json();
}
