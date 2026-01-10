// server/src/routes/movies.ts
import { Router } from "express";
import {
  fetchThirdPartyMoviesPage,
  fetchThirdPartyRandom,
  getCachedThirdPartyMovie,
} from "../services/thirdParty";
import {
  createLocalMovie,
  findLocalMovieById,
  readLocalMovies,
} from "../services/store";

const router = Router();

/**
 * GET /movies/recommendations
 * Returns 3 recommended movies.
 * Simple approach: use third-party random(3).
 */
router.get("/recommendations", async (_req, res) => {
  try {
    const items = await fetchThirdPartyRandom(3);
    return res.json({ items });
  } catch {
    return res.status(500).json({ error: "Failed to fetch recommendations" });
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
    return res.json(movies);
  } catch {
    return res.status(500).json({ error: "Failed to fetch random movies" });
  }
});

/**
 * GET /movies
 * Paginated list of movies
 *
 * Query:
 * - page (default 1)
 * - pageSize (default 12)
 * - source: all | local | third_party (default all)
 * - search: string (optional, filters by title contains search)
 */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(
      50,
      Math.max(1, Number(req.query.pageSize ?? 12))
    );

    const source = String(req.query.source ?? "all");
    const searchRaw = String(req.query.search ?? "").trim();
    const search = searchRaw.toLowerCase();

    const localMovies = await readLocalMovies();

    const matchesSearch = (title: string) => {
      if (!search) return true;
      return title.toLowerCase().includes(search);
    };

    const filteredLocal = localMovies.filter((m) => matchesSearch(m.title));
    const start = (page - 1) * pageSize;

    // ---- source=local ----
    if (source === "local") {
      const items = filteredLocal.slice(start, start + pageSize);
      return res.json({
        page,
        pageSize,
        items,
        meta: {
          source: "local",
          search: searchRaw,
          localCount: filteredLocal.length,
        },
      });
    }

    // ---- source=third_party ----
    if (source === "third_party") {
      const apiMovies = await fetchThirdPartyMoviesPage(page);
      const filteredApi = apiMovies.filter((m) => matchesSearch(m.title));
      const items = filteredApi.slice(0, pageSize);

      return res.json({
        page,
        pageSize,
        items,
        meta: { source: "third_party", search: searchRaw },
      });
    }

    // ---- source=all ----
    const localSlice = filteredLocal.slice(start, start + pageSize);
    const remaining = pageSize - localSlice.length;

    let apiSlice: any[] = [];
    if (remaining > 0) {
      const apiMovies = await fetchThirdPartyMoviesPage(page);
      const filteredApi = apiMovies.filter((m) => matchesSearch(m.title));
      apiSlice = filteredApi.slice(0, remaining);
    }

    const items = [...localSlice, ...apiSlice];

    return res.json({
      page,
      pageSize,
      items,
      meta: {
        source: "all",
        search: searchRaw,
        localCount: filteredLocal.length,
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to load movies" });
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
    return res.status(201).json(movie);
  } catch {
    return res.status(500).json({ error: "Failed to create movie" });
  }
});

/**
 * GET /movies/:id
 * Return a single movie.
 * - local first
 * - then third-party cache (if this movie appeared in list/random earlier)
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const localMovie = await findLocalMovieById(id);
    if (localMovie) return res.json(localMovie);

    const cached = getCachedThirdPartyMovie(id);
    if (cached) return res.json(cached);

    return res.status(404).json({ error: "Movie not found" });
  } catch {
    return res.status(500).json({ error: "Failed to fetch movie" });
  }
});

export default router;
