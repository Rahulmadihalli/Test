import { useCallback, useEffect, useRef, useState } from "react";
import SectionHeading from "../components/SectionHeading.jsx";
import DesignCard from "../components/DesignCard.jsx";
import {
  uploadDesign,
  fetchBookings,
  deleteDesign,
  updateAdminToken,
} from "../api/adminApi.js";
import { fetchDesigns } from "../api/bookingApi.js";

function Admin() {
  const [designs, setDesigns] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    category: "bridal",
    mediaType: "image",
    file: null,
  });
  const [uploadStatus, setUploadStatus] = useState({ type: "idle", message: "" });
  const [deleteStatus, setDeleteStatus] = useState({ type: "idle", message: "" });
  const [authStatus, setAuthStatus] = useState({ type: "idle", message: "" });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return localStorage.getItem("adminToken") ?? "";
  });
  const [tokenInput, setTokenInput] = useState("");
  const initialTokenRef = useRef(adminToken);
  const [tokenForm, setTokenForm] = useState({
    newToken: "",
    confirmToken: "",
  });
  const [tokenUpdateStatus, setTokenUpdateStatus] = useState({
    type: "idle",
    message: "",
  });

  const refreshDesigns = useCallback(async () => {
    try {
      const data = await fetchDesigns();
      setDesigns(data);
    } catch {
      setDesigns([]);
    }
  }, [fetchDesigns]);

  const refreshBookings = useCallback(async (token) => {
    try {
      const data = await fetchBookings(token);
      setBookings(data);
      return data;
    } catch (error) {
      setBookings([]);
      throw error;
    }
  }, [fetchBookings]);

  const resetAdminSession = useCallback((message = "") => {
    setIsAuthenticated(false);
    setAdminToken("");
    setBookings([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
    }
    setAuthStatus(
      message ? { type: "error", message } : { type: "idle", message: "" },
    );
    setTokenForm({ newToken: "", confirmToken: "" });
    setTokenUpdateStatus({ type: "idle", message: "" });
  }, []);

  const verifyToken = useCallback(
    async (token, { silent = false } = {}) => {
      const trimmed = token.trim();
      if (!trimmed) {
        resetAdminSession(
          silent ? "" : "Please enter a valid admin access token.",
        );
        return false;
      }

      if (!silent) {
        setAuthStatus({ type: "loading", message: "Verifying access..." });
      }

      try {
        await refreshBookings(trimmed);
        await refreshDesigns();
        setIsAuthenticated(true);
        setAdminToken(trimmed);
        if (typeof window !== "undefined") {
          localStorage.setItem("adminToken", trimmed);
        }
        setAuthStatus(
          silent
            ? { type: "idle", message: "" }
            : { type: "success", message: "Admin access granted." },
        );
        return true;
      } catch (error) {
        const message =
          error?.response?.data?.error ?? "Invalid admin token.";
        resetAdminSession(silent ? "" : message);
        return false;
      }
    },
    [refreshBookings, refreshDesigns, resetAdminSession],
  );

  useEffect(() => {
    refreshDesigns();
  }, [refreshDesigns]);

  useEffect(() => {
    if (!initialTokenRef.current) {
      return;
    }
    verifyToken(initialTokenRef.current, { silent: true });
  }, [verifyToken]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    setFormState((prev) => ({ ...prev, file: event.target.files?.[0] ?? null }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const success = await verifyToken(tokenInput);
    if (success) {
      setTokenInput("");
    }
  };

  const handleLogout = () => {
    resetAdminSession();
    setAuthStatus({ type: "success", message: "Logged out." });
    setTokenForm({ newToken: "", confirmToken: "" });
    setTokenUpdateStatus({ type: "idle", message: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated || !adminToken) {
      setUploadStatus({
        type: "error",
        message: "Admin login is required to upload designs.",
      });
      return;
    }

    if (!formState.file) {
      setUploadStatus({
        type: "error",
        message: "Please select an image or video file.",
      });
      return;
    }

    try {
      setUploadStatus({ type: "loading", message: "Uploading design..." });
      await uploadDesign({
        file: formState.file,
        title: formState.title,
        description: formState.description,
        category: formState.category,
        mediaType: formState.mediaType,
        token: adminToken,
      });

      setUploadStatus({ type: "success", message: "Design uploaded successfully!" });
      setFormState({
        title: "",
        description: "",
        category: "bridal",
        mediaType: "image",
        file: null,
      });
      event.target.reset();
      await refreshDesigns();
    } catch (error) {
      if (error?.response?.status === 401) {
        resetAdminSession("Admin session expired. Please log in again.");
      }
      setUploadStatus({
        type: "error",
        message: error?.response?.data?.error ?? "Upload failed. Please try again.",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!isAuthenticated || !adminToken) {
      resetAdminSession("Admin login is required to manage designs.");
      return;
    }

    try {
      setDeleteStatus({ type: "loading", message: "Removing design..." });
      await deleteDesign(id, adminToken);
      setDeleteStatus({ type: "success", message: "Design removed." });
      await refreshDesigns();
    } catch (error) {
      if (error?.response?.status === 401) {
        resetAdminSession("Admin session expired. Please log in again.");
      }
      setDeleteStatus({
        type: "error",
        message: error?.response?.data?.error ?? "Failed to delete design.",
      });
    }
  };

  const handleTokenFormChange = (event) => {
    const { name, value } = event.target;
    setTokenForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTokenUpdate = async (event) => {
    event.preventDefault();
    const trimmedNewToken = tokenForm.newToken.trim();
    const trimmedConfirm = tokenForm.confirmToken.trim();

    if (trimmedNewToken.length < 4) {
      setTokenUpdateStatus({
        type: "error",
        message: "New access token must be at least 4 characters.",
      });
      return;
    }

    if (trimmedNewToken !== trimmedConfirm) {
      setTokenUpdateStatus({
        type: "error",
        message: "Token and confirmation do not match.",
      });
      return;
    }

    try {
      setTokenUpdateStatus({
        type: "loading",
        message: "Updating access token...",
      });
      await updateAdminToken({ token: adminToken, newToken: trimmedNewToken });
      setAdminToken(trimmedNewToken);
      if (typeof window !== "undefined") {
        localStorage.setItem("adminToken", trimmedNewToken);
      }
      setTokenForm({ newToken: "", confirmToken: "" });
      setTokenUpdateStatus({
        type: "success",
        message: "Access token updated successfully.",
      });
    } catch (error) {
      if (error?.response?.status === 401) {
        resetAdminSession("Admin session expired. Please log in again.");
      }
      setTokenUpdateStatus({
        type: "error",
        message: error?.response?.data?.error ?? "Failed to update token.",
      });
    }
  };

  return (
    <div className="page container">
      <SectionHeading
        title="Admin Dashboard"
        subtitle="Upload new mehandi designs and review booking submissions."
      />

      {authStatus.type !== "idle" && authStatus.message ? (
        <p className={`form-status form-status--${authStatus.type}`}>
          {authStatus.message}
        </p>
      ) : null}

      {!isAuthenticated ? (
        <section className="admin-card">
          <h3>Admin Access</h3>
          <form className="admin-form" onSubmit={handleLogin}>
            <label>
              Access Token
              <input
                type="password"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="Enter admin token"
              />
            </label>
            <button type="submit" className="button button--primary">
              Unlock Dashboard
            </button>
          </form>
        </section>
      ) : (
        <>
          <div className="admin-header-actions">
            <button
              type="button"
              className="button button--secondary button--logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          <div className="admin-grid">
            <section className="admin-card">
              <h3>Upload Design</h3>
              <form className="admin-form" onSubmit={handleSubmit}>
                <label>
                  Title *
                  <input
                    name="title"
                    value={formState.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Bridal Bloom"
                  />
                </label>
                <label>
                  Description
                  <textarea
                    name="description"
                    value={formState.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Optional notes about the design."
                  />
                </label>
                <label>
                  Category
                  <select
                    name="category"
                    value={formState.category}
                    onChange={handleInputChange}
                  >
                    <option value="bridal">Bridal</option>
                    <option value="festive">Festive</option>
                    <option value="minimal">Minimal</option>
                    <option value="kids">Kids</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                <label>
                  Media Type
                  <select
                    name="mediaType"
                    value={formState.mediaType}
                    onChange={handleInputChange}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </label>
                <label>
                  File *
                  <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
                </label>
                <button type="submit" className="button button--primary">
                  Upload Design
                </button>
                {uploadStatus.type !== "idle" ? (
                  <p className={`form-status form-status--${uploadStatus.type}`}>
                    {uploadStatus.message}
                  </p>
                ) : null}
              </form>
            </section>

            <section className="admin-card">
              <h3>Recent Bookings</h3>
              {bookings.length === 0 ? (
                <p className="info-text">No bookings yet.</p>
              ) : (
                <ul className="booking-list">
                  {bookings
                    .slice()
                    .reverse()
                    .map((booking) => (
                      <li key={booking.id}>
                        <div className="booking-list__header">
                          <strong>{booking.name}</strong>
                          <span>
                            {new Date(booking.submittedAt).toLocaleString()}
                          </span>
                        </div>
                        <p>
                          <strong>Contact:</strong> {booking.email} • {booking.phone}
                        </p>
                        {booking.eventDate ? (
                          <p>
                            <strong>Event Date:</strong>{" "}
                            {new Date(booking.eventDate).toLocaleDateString()}
                          </p>
                        ) : null}
                        {booking.preferredStyle ? (
                          <p>
                            <strong>Preferred Style:</strong> {booking.preferredStyle}
                          </p>
                        ) : null}
                        {booking.selectedDesignIds?.length ? (
                          <p>
                            <strong>Design IDs:</strong>{" "}
                            {booking.selectedDesignIds.join(", ")}
                          </p>
                        ) : null}
                        {booking.message ? <p>{booking.message}</p> : null}
                      </li>
                    ))}
                </ul>
              )}
            </section>
          </div>

          <section className="admin-card">
            <h3>Update Access Token</h3>
            <form className="admin-form" onSubmit={handleTokenUpdate}>
              <label>
                New Token *
                <input
                  type="password"
                  name="newToken"
                  value={tokenForm.newToken}
                  onChange={handleTokenFormChange}
                  placeholder="Enter new access token"
                  required
                />
              </label>
              <label>
                Confirm Token *
                <input
                  type="password"
                  name="confirmToken"
                  value={tokenForm.confirmToken}
                  onChange={handleTokenFormChange}
                  placeholder="Confirm new access token"
                  required
                />
              </label>
              <button type="submit" className="button button--primary">
                Update Token
              </button>
              {tokenUpdateStatus.type !== "idle" ? (
                <p className={`form-status form-status--${tokenUpdateStatus.type}`}>
                  {tokenUpdateStatus.message}
                </p>
              ) : null}
            </form>
          </section>

          <div className="admin-footer-actions">
            <button
              type="button"
              className="button button--secondary button--logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          <section className="section section--alt">
            <div className="section-heading">
              <h3>Manage Gallery</h3>
              {deleteStatus.type !== "idle" ? (
                <p className={`form-status form-status--${deleteStatus.type}`}>
                  {deleteStatus.message}
                </p>
              ) : null}
            </div>
            {designs.length === 0 ? (
              <p className="info-text">No designs uploaded yet.</p>
            ) : (
              <div className="design-grid">
                {designs.map((design) => (
                  <div key={design.id} className="design-card-wrapper">
                    <DesignCard design={design} />
                    <button
                      type="button"
                      className="button button--danger"
                      onClick={() => handleDelete(design.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Admin;

