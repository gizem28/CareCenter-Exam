import React from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../../css/Navbar.css";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, logout } = useAuth();

  const getUserName = (): string => {
    return user?.fullName || user?.email || "User";
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isLoginPageActive = (type: "patient" | "healthcare") => {
    if (location.pathname !== "/login") return false;
    const typeParam = searchParams.get("type");
    return typeParam === type;
  };

  // Additional check: ensure user data is valid
  const actuallyAuthenticated =
    isAuthenticated && user && user.email && user.role && user.fullName;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom shadow-sm">
      <div className="container">
        <a
          className="navbar-brand fw-semibold"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          TrioCareCenter
        </a>
        {/* Mobile hamburger menu */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        {/* Menu items */}
        <div id="mainNav" className="collapse navbar-collapse">
          <ul className="navbar-nav ms-3">
            <li className="nav-item">
              <a
                className={`nav-link ${isActive("/") ? "active-link" : ""}`}
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
              >
                Home
              </a>
            </li>
            {/* Show login buttons only when not logged in */}
            {!actuallyAuthenticated && (
              <>
                <li className="nav-item">
                  <a
                    className={`nav-link ${
                      isLoginPageActive("patient") ? "active-link" : ""
                    }`}
                    href="/login?type=patient"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login?type=patient");
                    }}
                  >
                    Patient
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className={`nav-link ${
                      isLoginPageActive("healthcare") ? "active-link" : ""
                    }`}
                    href="/login?type=healthcare"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login?type=healthcare");
                    }}
                  >
                    Staff
                  </a>
                </li>
              </>
            )}
          </ul>
          {/* Logout button - show when logged in */}
          {actuallyAuthenticated && (
            <div className="ms-auto d-flex align-items-center">
              <span className="navbar-text me-3 text-white">
                {getUserName()}
              </span>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                style={{
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  color: "white",
                }}
              >
                <i className="bi bi-box-arrow-right"></i> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
