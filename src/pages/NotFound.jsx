import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.errorCode}>404</div>
        <div style={styles.title}>No Match Found!</div>
        <div style={styles.subtitle}>
          We tried to match you with the perfect page, but this one seems to be out of our database. Maybe it's an indie
          film we haven't discovered yet?
        </div>
        <button
          style={styles.homeButton}
          onClick={() => navigate("/")}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 8px 25px rgba(255, 64, 129, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(255, 64, 129, 0.2)";
          }}
        >
          🎬 Back to Movies
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Arial', sans-serif",
    color: "white",
    textAlign: "center",
    padding: "20px",
  },
  content: {
    animation: "fadeInUp 1s ease-out",
    maxWidth: "600px",
  },
  errorCode: {
    fontSize: "clamp(8rem, 15vw, 12rem)",
    fontWeight: "900",
    background: "linear-gradient(45deg, #ff4081, #ff6ec7, #40c4ff)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
    marginBottom: "20px",
    textShadow: "0 0 30px rgba(255, 255, 255, 0.5)",
    animation: "glow 2s ease-in-out infinite alternate",
  },
  title: {
    fontSize: "clamp(2rem, 5vw, 3.5rem)",
    fontWeight: "700",
    marginBottom: "20px",
    textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
  },
  subtitle: {
    fontSize: "clamp(1rem, 3vw, 1.5rem)",
    marginBottom: "40px",
    lineHeight: "1.6",
    opacity: "0.9",
    maxWidth: "500px",
    margin: "0 auto 40px auto",
  },
  homeButton: {
    background: "linear-gradient(45deg, #ff4081, #ff6ec7)",
    border: "none",
    borderRadius: "50px",
    padding: "15px 30px",
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(255, 64, 129, 0.2)",
    outline: "none",
  },
};

// Add keyframe animations via a style tag
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes glow {
    from {
      filter: drop-shadow(0 0 20px rgba(255, 64, 129, 0.7));
    }
    to {
      filter: drop-shadow(0 0 30px rgba(64, 196, 255, 0.7));
    }
  }
`;
document.head.appendChild(styleSheet);

export default NotFound;
