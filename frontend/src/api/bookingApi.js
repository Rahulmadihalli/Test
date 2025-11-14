import client from "./client.js";

export async function fetchDesigns() {
  const response = await client.get("/designs");
  return response.data;
}

export async function fetchTypes() {
  const response = await client.get("/types");
  return response.data;
}

export async function submitBooking(payload) {
  const response = await client.post("/bookings", payload);
  return response.data;
}

