import { resolveMediaUrl } from "../utils/mediaUrl.js";

function DesignCard({ design, onSelect, isSelected, onPreview }) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(design.id);
      return;
    }
    if (onPreview) {
      onPreview(design);
    }
  };

  const mediaUrl = resolveMediaUrl(design.mediaUrl);

  return (
    <article
      className={`design-card ${isSelected ? "design-card--selected" : ""}`}
      onClick={handleClick}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(event) => {
        if (onSelect && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSelect(design.id);
        }
      }}
    >
      {design.mediaType?.startsWith("video") ? (
        <video src={mediaUrl} controls preload="metadata" />
      ) : (
        <img src={mediaUrl} alt={design.title} loading="lazy" />
      )}
      {!onSelect ? (
        <div className="design-card__overlay">
          <h4>{design.title}</h4>
          <span>{design.category}</span>
        </div>
      ) : null}
      <div className="design-card__body">
        <h3>{design.title}</h3>
        {design.description ? <p>{design.description}</p> : null}
        <span className="design-card__tag">{design.category}</span>
      </div>
    </article>
  );
}

export default DesignCard;

