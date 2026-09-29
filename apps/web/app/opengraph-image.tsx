import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "Interviewlyy — AI Voice Interviews for Candidates & Hiring Teams";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Read the logo file from the public directory
  const logoData = readFileSync(
    join(process.cwd(), "app", "favicon", "android-chrome-512x512.png")
  );
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#20201e",
          padding: "48px 60px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            display: "flex",
          }}
        />

        {/* Logo + Brand Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <img
            src={logoBase64}
            width={52}
            height={52}
            style={{ borderRadius: "50%" }}
          />
          <span
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.04em",
            }}
          >
            Interviewlyy
          </span>
        </div>

        {/* Two columns */}
        <div
          style={{
            display: "flex",
            flex: 1,
            marginTop: 40,
            gap: 0,
          }}
        >
          {/* Left — For Candidates */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              paddingRight: 40,
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: "#f4cf4b",
                color: "#20201e",
                fontSize: 15,
                fontWeight: 700,
                padding: "6px 14px",
                borderRadius: 0,
                alignSelf: "flex-start",
                letterSpacing: "0.02em",
              }}
            >
              For Candidates
            </div>
            <p
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "#f5f3eb",
                lineHeight: 1.35,
                marginTop: 20,
              }}
            >
              Practice with AI voice interviews tailored to your resume
            </p>
          </div>

          {/* Golden divider */}
          <div
            style={{
              width: 2,
              backgroundColor: "#f4cf4b",
              opacity: 0.5,
              display: "flex",
            }}
          />

          {/* Right — For Hiring Teams */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              paddingLeft: 40,
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: "#f4cf4b",
                color: "#20201e",
                fontSize: 15,
                fontWeight: 700,
                padding: "6px 14px",
                borderRadius: 0,
                alignSelf: "flex-start",
                letterSpacing: "0.02em",
              }}
            >
              For Hiring Teams
            </div>
            <p
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: "#f5f3eb",
                lineHeight: 1.35,
                marginTop: 20,
              }}
            >
              Screen candidates with structured AI interviews & reports
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: "#f4cf4b",
              opacity: 0.7,
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            AI Voice Interviews for Candidates & Hiring Teams
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
