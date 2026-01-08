// This file defines all /movies HTTP endpoints.
// It coordinates between:
// - third-party service (API fetch)
// - local store (JSON persistence)
// - Express request/response handling

import { Router } from "express";
import {
  fetchThirdPartyMoviesPage,
  fetchThirdPartyRandom,
} from "../services/thirdParty";
import {
  createLocalMovie,
  findLocalMovieById,
  readLocalMovies,
} from "../services/store";

const router = Router();

/** ROUTES
 * GET /movies
 * Returns local movies + third-party movies
 */
router.get("/", async (req, res) => {
  try {
    const localMovies = await readLocalMovies();
    const apiMovies = await fetchThirdPartyMoviesPage(1);

    res.json([...localMovies, ...apiMovies]);
  } catch {
    res.status(500).json({ error: "Failed to load movies" });
  }
});

/**
 * GET /movies/random/:count
 * Fetch random movies from third-party API
 */
router.get("/random/:count", async (req, res) => {
  const count = Number(req.params.count);

  if (Number.isNaN(count) || count <= 0) {
    return res.status(400).json({ error: "Invalid count" });
  }

  try {
    const movies = await fetchThirdPartyRandom(count);
    res.json(movies);
  } catch {
    res.status(500).json({ error: "Failed to fetch random movies" });
  }
});

/**
 * GET /movies/:id
 * Find a movie by id (local first, then API)
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const localMovie = await findLocalMovieById(id);
    if (localMovie) {
      return res.json(localMovie);
    }

    // For now, if it's not local, we say not found
    // (later we could search the API too)
    res.status(404).json({ error: "Movie not found" });
  } catch {
    res.status(500).json({ error: "Failed to fetch movie" });
  }
});

/**
 * POST /movies
 * Create a new local movie
 */
router.post("/", async (req, res) => {
  const { title, year } = req.body;

  if (!title || typeof year !== "number") {
    return res.status(400).json({ error: "title and year are required" });
  }

  try {
    const movie = await createLocalMovie({ title, year });
    res.status(201).json(movie);
  } catch {
    res.status(500).json({ error: "Failed to create movie" });
  }
});

export default router;
