import { NavLink, Link } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/booking", label: "Book Now" },
  { to: "/admin", label: "Admin" },
];

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand">
          Mehandi Artistry
        </Link>
        <nav className="navbar__nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `navbar__link ${isActive ? "navbar__link--active" : ""}`
              }
              end={link.to === "/"}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;

