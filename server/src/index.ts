import express from "express";
import cors from "cors";

//Express application
const app = express();

// Default port
const PORT = 4000;

/**
 * MIDDLEWARE
 * Middleware runs before every request
 */

app.use(cors());
app.use(express.json());

/**
 * Routes
 */

//health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * START SERVER
 */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
