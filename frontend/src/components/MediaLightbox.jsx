import { resolveMediaUrl } from "../utils/mediaUrl.js";

function MediaLightbox({ design, onClose }) {
  if (!design) {
    return null;
  }

  const isVideo = design.mediaType?.startsWith("video");
  const mediaUrl = resolveMediaUrl(design.mediaUrl);

  return (
    <div className="lightbox" role="dialog" aria-modal="true">
      <div className="lightbox__backdrop" onClick={onClose} />
      <div className="lightbox__content">
        <button type="button" className="lightbox__close" onClick={onClose}>
          ×
        </button>
        <div className="lightbox__media">
          {isVideo ? (
            <video src={mediaUrl} controls autoPlay />
          ) : (
            <img src={mediaUrl} alt={design.title} />
          )}
        </div>
        <div className="lightbox__details">
          <h3>{design.title}</h3>
          {design.description ? <p>{design.description}</p> : null}
          {design.category ? (
            <span className="lightbox__tag">{design.category}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default MediaLightbox;

