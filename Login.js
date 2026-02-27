import React, { useState, useEffect, useRef } from "react";
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120,120,120,${p.alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );
}
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    document.body.style.margin = 0;
    document.title = "Secure Authentication";

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert("Login Successful 🚀");
    }, 1500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {}
      {!isMobile && (
        <div
          style={{
            flex: 1,
            position: "relative",
            background: "#111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 60,
            color: "#fff",
          }}
        >
          <ParticleCanvas />
          <div style={{ textAlign: "center", zIndex: 2 }}>
            <h1
              style={{
                fontSize: "clamp(56px, 6vw, 80px)",
                letterSpacing: 4,
                fontWeight: 800,
              }}
            >
              FINZO<span style={{ color: "#bbb" }}>.</span>
            </h1>

            <p
              style={{
                color: "#ccc",
                marginTop: 24,
                fontSize: "clamp(20px, 2vw, 26px)",
              }}
            >
              “Money clarity. Zero stress.”
            </p>
          </div>
        </div>
      )}

      {}
      <div
        style={{
          width: isMobile ? "100%" : "480px",
          padding: isMobile ? "40px 24px" : "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 320 }}>

          {/* CSS LOGO */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 30,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #000, #333)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 40,
                fontWeight: 800,
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.1) rotate(8deg)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "scale(1) rotate(0deg)")
              }
            >
              $
            </div>
          </div>

          {/* EMAIL */}
          <fieldset
            style={{
              border: "1.5px solid #ddd",
              borderRadius: 12,
              padding: "12px 16px 16px",
              marginBottom: 20,
              background: "#f9f9f9",
            }}
          >
            <legend style={{ padding: "0 6px", fontSize: 13, fontWeight: 600 }}>
              Email Address
            </legend>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 14,
              }}
            />
          </fieldset>

          {/* PASSWORD */}
          <fieldset
            style={{
              border: "1.5px solid #ddd",
              borderRadius: 12,
              padding: "12px 16px 16px",
              marginBottom: 10,
              background: "#f9f9f9",
              position: "relative",
            }}
          >
            <legend style={{ padding: "0 6px", fontSize: 13, fontWeight: 600 }}>
              Password
            </legend>

            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 14,
              }}
            />

            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </fieldset>

          {/* FORGOT PASSWORD */}
          <div style={{ textAlign: "right", marginBottom: 25 }}>
            <span
              style={{ fontSize: 13, color: "#555", cursor: "pointer" }}
              onClick={() => alert("Redirect to Forgot Password")}
            >
              Forgot Password?
            </span>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: "#000",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {loading ? "Processing..." : "Sign In →"}
          </button>

          {/* DIVIDER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "25px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#ddd" }} />
            <span style={{ margin: "0 10px", fontSize: 12, color: "#888" }}>
              OR
            </span>
            <div style={{ flex: 1, height: 1, background: "#ddd" }} />
          </div>

          {/* CREATE ACCOUNT */}
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 14, color: "#666" }}>
              Don’t have an account?
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#000",
                cursor: "pointer",
                marginLeft: 6,
              }}
              onClick={() => alert("Redirect to Sign Up")}
            >
              Create Account
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}


export default Login;
