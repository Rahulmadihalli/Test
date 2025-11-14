import { useEffect, useState } from "react";
import { fetchDesigns, submitBooking } from "../api/bookingApi.js";
import DesignCard from "./DesignCard.jsx";

function BookingForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventDate: "",
    preferredStyle: "",
    message: "",
  });
  const [designs, setDesigns] = useState([]);
  const [selectedDesignIds, setSelectedDesignIds] = useState([]);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDesigns()
      .then(setDesigns)
      .catch(() => {
        setStatus({
          type: "error",
          message: "Failed to load designs. You can still submit your booking.",
        });
      });
  }, []);

  const toggleDesignSelection = (id) => {
    setSelectedDesignIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "loading", message: "Submitting booking..." });

    try {
      await submitBooking({ ...formData, selectedDesignIds });
      setStatus({
        type: "success",
        message: "Thank you! Your booking has been received. We will contact you soon.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        eventDate: "",
        preferredStyle: "",
        message: "",
      });
      setSelectedDesignIds([]);
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.response?.data?.error ?? "Booking failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="booking">
      <form className="booking__form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="name">Full Name *</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="phone">Phone *</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="WhatsApp / phone number"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="eventDate">Event Date</label>
          <input
            id="eventDate"
            name="eventDate"
            type="date"
            value={formData.eventDate}
            onChange={handleChange}
          />
        </div>
        <div className="form-row">
          <label htmlFor="preferredStyle">Preferred Style</label>
          <input
            id="preferredStyle"
            name="preferredStyle"
            type="text"
            value={formData.preferredStyle}
            onChange={handleChange}
            placeholder="e.g. Bridal, Arabic, Minimal"
          />
        </div>
        <div className="form-row">
          <label htmlFor="message">Notes</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Share event details, number of guests, or anything else"
            rows={4}
          />
        </div>
        <button type="submit" className="button button--primary" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Booking"}
        </button>
        {status.type !== "idle" ? (
          <p className={`form-status form-status--${status.type}`}>{status.message}</p>
        ) : null}
      </form>

      <div className="booking__designs">
        <h3>Select preferred designs (optional)</h3>
        {designs.length === 0 ? (
          <p className="booking__designs-empty">Designs will appear here once the admin uploads.</p>
        ) : (
          <div className="design-grid">
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                onSelect={toggleDesignSelection}
                isSelected={selectedDesignIds.includes(design.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default BookingForm;

