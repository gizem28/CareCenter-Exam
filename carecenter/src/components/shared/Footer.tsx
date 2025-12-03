import "../../css/Footer.css";

function Footer() {
  return (
    <footer className="border-top bg-light">
      <div className="container py-3">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            {/* Contact Information Row */}
            <div className="row mb-3">
              {/* Left: Contact Us & Address */}
              <div className="col-md-6 mb-2 mb-md-0">
                <h6 className="fw-bold text-dark mb-2 small">Contact Us</h6>
                <p className="text-muted small mb-0">
                  Karl Johans Gate 1 - 0154 Oslo, Norway
                </p>
              </div>

              {/* Right: Phone & Email */}
              <div className="col-md-6">
                <p className="text-muted small mb-1">+47 22 20 00 00</p>
                <p className="text-muted small mb-0">info@triocarecenter.no</p>
              </div>
            </div>

            {/* Copyright - Centered at Bottom */}
            <div className="row">
              <div className="col-12 text-center">
                <p className="text-muted small mb-0">
                  © 2025 TrioCareCenter. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

