// src/api.js
// Connexion centralisée à l'API FastAPI du backend Swim AI
import axios from "axios";

// Instance Axios configurée une fois pour toutes.
// baseURL = l'adresse du backend FastAPI.
const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

export default api;