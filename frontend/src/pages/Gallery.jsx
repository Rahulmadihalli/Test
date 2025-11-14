import { useEffect, useState } from "react";
import DesignCard from "../components/DesignCard.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import { fetchDesigns } from "../api/bookingApi.js";
import MediaLightbox from "../components/MediaLightbox.jsx";

function Gallery() {
  const [designs, setDesigns] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [activeDesign, setActiveDesign] = useState(null);

  useEffect(() => {
    fetchDesigns()
      .then(setDesigns)
      .catch(() => setDesigns([]))
      .finally(() => setIsLoading(false));
  }, []);

  const categories = Array.from(
    new Set(designs.map((design) => design.category ?? "general")),
  );

  const filteredDesigns =
    filter === "all"
      ? designs
      : designs.filter((design) => design.category === filter);

  return (
    <div className="page container">
      <SectionHeading
        title="Design Gallery"
        subtitle="Browse the curated collection of bridal and festive mehandi art."
      />

      <div className="filter-bar">
        <button
          type="button"
          className={`chip ${filter === "all" ? "chip--active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`chip ${filter === category ? "chip--active" : ""}`}
            onClick={() => setFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="info-text">Loading designs...</p>
      ) : filteredDesigns.length > 0 ? (
        <>
          <div className="design-grid">
            {filteredDesigns.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                onPreview={setActiveDesign}
              />
            ))}
          </div>
          <MediaLightbox
            design={activeDesign}
            onClose={() => setActiveDesign(null)}
          />
        </>
      ) : (
        <p className="info-text">No designs available yet. Please check back later.</p>
      )}
    </div>
  );
}

export default Gallery;

