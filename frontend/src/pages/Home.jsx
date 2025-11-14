import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionHeading from "../components/SectionHeading.jsx";
import TypeCard from "../components/TypeCard.jsx";
import DesignCard from "../components/DesignCard.jsx";
import { fetchTypes, fetchDesigns } from "../api/bookingApi.js";

function Home() {
  const [types, setTypes] = useState([]);
  const [featuredDesigns, setFeaturedDesigns] = useState([]);

  useEffect(() => {
    fetchTypes().then(setTypes).catch(() => {});
    fetchDesigns()
      .then((data) => setFeaturedDesigns(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="hero__badge">Premium mehandi artistry</span>
            <h1>Timeless Mehandi for Your Celebrations</h1>
            <p>
              Elegant bridal and festive mehandi crafted with vibrant jewel tones and delicate
              detailing, customised for every ceremony.
            </p>
            <div className="hero__actions">
              <Link className="button button--primary" to="/booking">
                Book Your Session
              </Link>
              <Link className="button button--secondary" to="/gallery">
                Browse Gallery
              </Link>
            </div>
          </div>
          <div className="hero__media">
            <div className="hero__media-primary">
              <img
                className="hero__image"
                src="/images/mehendi-hero-1.jpg"
                alt="Bridal hands adorned with intricate mehandi florals"
                loading="lazy"
              />
              <span className="hero__caption">Hand-drawn bridal motifs with gemstone accents</span>
            </div>
            <div className="hero__media-secondary">
              <img
                className="hero__image"
                src="/images/mehendi-hero-2.jpg"
                alt="Artist applying detailed henna patterns"
                loading="lazy"
              />
            </div>
            <div className="hero__orb" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="experience-highlight">
          <div className="experience-highlight__image">
            <img
              src="/images/mehendi-detail.jpg"
              alt="Detailed mehandi pattern featuring floral and paisley art"
              loading="lazy"
            />
          </div>
          <div className="experience-highlight__content">
            <h3>Signature Mehandi Experience</h3>
            <p>
              From contemporary celebrations to traditional ceremonies, we create richly layered
              designs that celebrate your story with colour, symmetry, and grace.
            </p>
            <ul className="experience-highlight__list">
              <li>Custom concepts for bridal, sangeet, and festive gatherings</li>
              <li>Long-lasting natural henna with jewel-toned embellishments</li>
              <li>On-location artistry for families and bridal parties</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container artist-section">
          <div className="artist-section__image">
            <img
              src="/images/artist-shital.jpg"
              alt="Shital Gawas applying intricate mehendi art"
              loading="lazy"
            />
          </div>
          <div className="artist-section__content">
            <span className="artist-section__badge">Meet the artist</span>
            <h2>Shital Gawas</h2>
            <p>
              Shital brings over a decade of experience crafting intricate mehandi for brides,
              destination weddings, and intimate celebrations. Her signature style blends traditional
              motifs with contemporary elements to create designs that feel personal and luxurious.
            </p>
            <ul className="artist-section__list">
              <li>Specialises in bespoke bridal concepts with detailed storytelling</li>
              <li>Certified in natural henna mixing for rich, long-lasting stains</li>
              <li>Available for on-location bookings across Maharashtra and Goa</li>
            </ul>
            <div className="artist-section__cta">
              <Link className="button button--primary" to="/booking">
                Book Shital for your event
              </Link>
              <Link className="button button--outline" to="/gallery">
                View her portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <SectionHeading
          title="Popular Mehandi Styles"
          subtitle="Discover signature styles curated for weddings, festivals, and intimate events."
        />
        <div className="card-grid">
          {types.map((type) => (
            <TypeCard key={type.id} type={type} />
          ))}
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <SectionHeading
            title="Featured Designs"
            subtitle="A glimpse of our latest handcrafted artistry. Explore the full gallery for more."
          />
          {featuredDesigns.length > 0 ? (
            <div className="design-grid">
              {featuredDesigns.map((design) => (
                <DesignCard key={design.id} design={design} />
              ))}
            </div>
          ) : (
            <p className="info-text">
              Designs will appear here once uploaded. Check back soon!
            </p>
          )}
          <div className="centered">
            <Link className="button button--outline" to="/gallery">
              View Full Gallery
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

