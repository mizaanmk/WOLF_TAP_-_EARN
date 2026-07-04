import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route to securely expose the Firebase environment variables requested by the user
app.get("/api/firebase-config", (req, res) => {
  res.json({
    apiKey: process.env.API_KEY || "",
    authDomain: process.env.AUTH_DOMAIN || "",
    projectId: process.env.PROJECT_ID || "",
    storageBucket: process.env.STORAGE_BUCKET || "",
    messagingSenderId: process.env.MESSAGING_SENDER_ID || "",
    appId: process.env.APP_ID || "",
  });
});

// API route to expose the Supabase configuration variables requested by the user
app.get("/api/supabase-config", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  });
});


// Vite middleware integration for dynamic preview rendering
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server:", err);
});
