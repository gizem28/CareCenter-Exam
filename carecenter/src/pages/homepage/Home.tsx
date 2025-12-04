import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../../css/Home.css";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  const getUserType = (): string | null => {
    if (!user) return null;
    const role = user.role || "";
    // Map React app roles (capitalized) to Razor view roles (lowercase)
    if (role === "Admin") return "admin";
    if (role === "Worker") return "staff";
    if (role === "Client") return "patient";
    // Fallback for lowercase roles
    const roleLower = role.toLowerCase();
    if (roleLower === "admin") return "admin";
    if (roleLower === "worker") return "staff";
    if (roleLower === "client") return "patient";
    return roleLower;
  };

  const getUserName = (): string => {
    return user?.fullName || user?.email || "User";
  };

  const getWelcomeMessage = (): string => {
    const userType = getUserType();
    if (userType === "admin") {
      return "Manage your healthcare center efficiently with full administrative access.";
    } else if (userType === "staff") {
      return "Access your dashboard to manage appointments and support your patients.";
    } else if (userType === "patient") {
      return "Track your appointments and manage your healthcare requests.";
    }
    return "";
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="spinner-border text-teal" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Additional check: ensure user data is valid
  // This helps catch cases where localStorage has stale/invalid data
  const actuallyAuthenticated =
    isAuthenticated && user && user.email && user.role && user.fullName; // Ensure fullName exists too

  return (
    <>
      {/* ------------------- MAIN CONTENT ------------------- */}
      <main className="pb-2">
        {/* HEADER / HERO SECTION */}
        <section className="section py-3">
          <div className="container">
            <div className="row align-items-center g-5">
              {/* ------------------- LEFT COLUMN ------------------- */}
              {/* Main heading and subtext */}
              <div className="col-lg-6 text-lg-start text-center">
                <h1 className="fw-bold display-5 lh-sm mb-3">
                  <span className="text-teal">Easy appointment management</span>
                  <br />
                  for homecare services.
                </h1>
                <p className="lead text-muted mb-4">
                  Efficient communication between healthcare staff and elderly
                  clients.
                </p>
              </div>

              {/* ------------------- RIGHT COLUMN ------------------- */}
              {/* Hero image (illustration of healthcare service) */}
              <div className="col-lg-6 text-center">
                <img
                  src="/images/hero.webp"
                  alt="Nurse supporting an elderly patient"
                  className="img-fluid rounded-3 shadow-sm"
                  style={{ maxWidth: "80%", height: "auto" }}
                  onError={(e) => {
                    // Fallback if image doesn't exist
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {!actuallyAuthenticated ? (
          /* ROLE SELECTION SECTION - Only show when not logged in */
          <section className="section section-muted">
            <div className="container">
              <div className="text-center mb-3">
                <h2 className="mb-1">Choose your role</h2>
              </div>

              <div className="row g-4">
                {/* ------------------- PATIENT CARD ------------------- */}
                <div className="col-md-6">
                  <div className="card card-elev h-100">
                    <div className="card-body">
                      <h5 className="card-title">Patient</h5>
                      <p className="card-text text-secondary">
                        Book and track appointments easily, stay informed and
                        supported.
                      </p>
                      <a
                        className="btn btn-teal"
                        href="/login?type=patient"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/login?type=patient");
                        }}
                      >
                        Continue as Patient
                      </a>
                    </div>
                  </div>
                </div>

                {/* ------------------- HEALTHCARE PERSONNEL CARD ------------------- */}
                <div className="col-md-6">
                  <div className="card card-elev h-100">
                    <div className="card-body">
                      <h5 className="card-title">Healthcare Personnel</h5>
                      <p className="card-text text-secondary">
                        Manage schedules, see tasks, and support your patients
                        efficiently.
                      </p>
                      <a
                        className="btn btn-teal"
                        href="/login?type=healthcare"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/login?type=healthcare");
                        }}
                      >
                        Continue as Staff
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* WELCOME SECTION - Show when logged in */
          <section className="section section-muted">
            <div className="container">
              <div className="text-center mb-4">
                <h2 className="mb-3">Welcome back, {getUserName()}!</h2>
                <p className="lead text-muted mb-4">{getWelcomeMessage()}</p>
              </div>

              <div className="row justify-content-center">
                <div className="col-md-6 text-center">
                  {getUserType() === "admin" && (
                    <>
                      <a
                        className="btn btn-teal me-3"
                        href="/admin/dashboard"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/admin/dashboard");
                        }}
                      >
                        Admin Dashboard
                      </a>
                    </>
                  )}

                  {getUserType() === "staff" && (
                    <>
                      <a
                        className="btn btn-teal"
                        href="/healthcare/dashboard"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/healthcare/dashboard");
                        }}
                      >
                        My Dashboard
                      </a>
                    </>
                  )}

                  {getUserType() === "patient" && (
                    <>
                      <a
                        className="btn btn-teal"
                        href="/patient/dashboard"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/patient/dashboard");
                        }}
                      >
                        My Dashboard
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
};

export default Home;
