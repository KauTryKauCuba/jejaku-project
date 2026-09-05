"use client";

// Only fires if the root layout itself throws (Providers, font loading,
// etc.) — a route-level error stays inside app/error.tsx instead. This
// replaces the whole document, so it can't rely on globals.css or the
// design-token classes the rest of the app uses; kept to inline styles.
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#f4faf8",
          color: "#07211c",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            textAlign: "center",
            padding: 30,
            border: "1px solid #dce9e5",
            borderRadius: 12,
            background: "#ffffff",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Something went wrong</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5, color: "#5c766e" }}>
            The app failed to load. Try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 19,
              height: 37,
              padding: "0 15px",
              borderRadius: 999,
              border: "none",
              background: "#00a19a",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
