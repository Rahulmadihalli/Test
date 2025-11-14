import client from "./client.js";

function withAdminHeaders(token) {
  return token
    ? {
        "x-admin-token": token,
      }
    : {};
}

export async function uploadDesign({
  file,
  title,
  description,
  category,
  mediaType,
  token,
}) {
  const formData = new FormData();
  formData.append("media", file);
  formData.append("title", title);
  formData.append("description", description);
  formData.append("category", category);
  formData.append("mediaType", mediaType);

  const response = await client.post("/admin/designs", formData, {
    headers: {
      ...withAdminHeaders(token),
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function deleteDesign(id, token) {
  const response = await client.delete(`/admin/designs/${id}`, {
    headers: withAdminHeaders(token),
  });
  return response.data;
}

export async function fetchBookings(token) {
  const response = await client.get("/admin/bookings", {
    headers: withAdminHeaders(token),
  });
  return response.data;
}

export async function updateAdminToken({ token, newToken }) {
  const response = await client.post(
    "/admin/token",
    { newToken },
    {
      headers: withAdminHeaders(token),
    },
  );
  return response.data;
}

