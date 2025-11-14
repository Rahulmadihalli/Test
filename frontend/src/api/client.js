import axios from "axios";

// Use environment variable for production, fallback to production backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://mehandibackend.vercel.app/api";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default client;

