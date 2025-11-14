function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <h4>Shital Gawas</h4>
          <p>Bespoke mehandi designs for weddings, festivals, and joyous moments.</p>
        </div>
        <div>
          <p className="footer__contact">
            WhatsApp: <a href="tel:+9019944295">+91 9019944295</a>
          </p>
          <p className="footer__contact">
            Email: <a href="mailto:sheetalgawas27@gmail.com">sheetalgawas27@gmail.com</a>
          </p>
        </div>
      </div>
      <div className="footer__bottom">
        © {currentYear} Shital Gawas. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;

