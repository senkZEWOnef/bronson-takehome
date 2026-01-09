import express from "express";
import cors from "cors";
import moviesRouter from "./routes/movies";

const app = express();
const PORT = 4000;

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());

/**
 * Routes
 */
app.use("/movies", moviesRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
