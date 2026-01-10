import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";

type Movie = {
  id: string;
  title: string;
  year: number;
  source: "api" | "local";
};

type MoviesPaginatedResponse = {
  page: number;
  pageSize: number;
  items: Movie[];
  meta?: unknown;
};

function MoviesListPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(12);
  const [source, setSource] = useState<"all" | "local" | "third_party">("all");

  // Search: input vs applied
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // Global UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState<string>("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Recommendations
  const [recs, setRecs] = useState<Movie[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  const normalizedAppliedSearch = useMemo(
    () => appliedSearch.trim(),
    [appliedSearch]
  );

  async function loadMovies() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        source,
      });

      if (normalizedAppliedSearch) {
        params.set("search", normalizedAppliedSearch);
      }

      const res = await fetch(`/movies?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to load movies (${res.status})`);

      const data = (await res.json()) as MoviesPaginatedResponse;
      const items = data.items;

      if (!Array.isArray(items)) {
        throw new Error("Unexpected response shape from /movies");
      }

      setMovies(items);
    } catch (err) {
      console.error(err);
      setMovies([]);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    (async () => {
      if (!ignore) await loadMovies();
    })();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, source, normalizedAppliedSearch]);

  function applySearch() {
    setAppliedSearch(searchText);
    setPage(1);
  }

  function clearSearch() {
    setSearchText("");
    setAppliedSearch("");
    setPage(1);
  }

  function openModal() {
    setCreateError(null);
    setNewTitle("");
    setNewYear("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

  function sourceBadgeClass(s: Movie["source"]) {
    return s === "local" ? "bg-success" : "bg-secondary";
  }

  async function createLocalMovie() {
    setCreateError(null);

    const title = newTitle.trim();
    const yearNum = Number(newYear);

    if (!title) {
      setCreateError("Title is required.");
      return;
    }
    if (!Number.isFinite(yearNum) || yearNum < 1888 || yearNum > 2100) {
      setCreateError("Year must be a valid number (1888–2100).");
      return;
    }

    try {
      setCreating(true);

      const res = await fetch("/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, year: yearNum }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg.error ?? `Create failed (${res.status})`);
      }

      setPage(1);
      setSource("all");
      setAppliedSearch("");
      setSearchText("");

      closeModal();
      await loadMovies();
    } catch (err) {
      console.error(err);
      setCreateError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  async function loadRecommendations() {
    try {
      setRecsLoading(true);
      setRecsError(null);

      const res = await fetch("/movies/recommendations");
      if (!res.ok)
        throw new Error(`Failed to load recommendations (${res.status})`);

      const data = (await res.json()) as { items: Movie[] };
      setRecs(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error(err);
      setRecs([]);
      setRecsError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRecsLoading(false);
    }
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Top bar */}
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <Link
            to="/"
            className="navbar-brand fw-semibold text-decoration-none"
          >
            🎬 Movies
          </Link>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-warning" onClick={openModal}>
              + Add Local Movie
            </button>
            <span className="navbar-text small text-white-50">
              React UI ↔ Express API
            </span>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {/* Recommendations */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">Recommendations</div>
                <div className="text-muted small">
                  Fetch 3 recommended movies.
                </div>
              </div>
              <button
                className="btn btn-outline-primary"
                onClick={loadRecommendations}
                disabled={recsLoading}
              >
                {recsLoading ? "Loading..." : "Get 3 recommendations"}
              </button>
            </div>

            {recsError && (
              <div className="alert alert-danger mt-3 mb-0" role="alert">
                {recsError}
              </div>
            )}

            {!recsLoading && recs.length > 0 && (
              <div className="row g-3 mt-1">
                {recs.map((m) => (
                  <div className="col-12 col-md-4" key={m.id}>
                    <div className="border rounded p-3 bg-white h-100">
                      <div className="fw-semibold">{m.title}</div>
                      <div className="text-muted small">{m.year}</div>
                      <div className="mt-2">
                        <Link
                          to={`/movies/${m.id}`}
                          className="btn btn-sm btn-dark"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls Card */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-3">
                <label className="form-label">Source</label>
                <select
                  className="form-select"
                  value={source}
                  onChange={(e) => {
                    setSource(
                      e.target.value as "all" | "local" | "third_party"
                    );
                    setPage(1);
                  }}
                >
                  <option value="all">All</option>
                  <option value="local">Local</option>
                  <option value="third_party">Third Party</option>
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label">Page size</label>
                <select
                  className="form-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={12}>12</option>
                  <option value={25}>25</option>
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Search title</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    placeholder="e.g. the, star, life..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applySearch();
                      if (e.key === "Escape") clearSearch();
                    }}
                  />
                  <button className="btn btn-primary" onClick={applySearch}>
                    Search
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={clearSearch}
                    disabled={!searchText && !appliedSearch}
                  >
                    Clear
                  </button>
                </div>
                <div className="form-text">
                  Press <kbd>Enter</kbd> to search, <kbd>Esc</kbd> to clear.
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">
                Showing <strong>{movies.length}</strong> result(s)
                {normalizedAppliedSearch ? (
                  <>
                    {" "}
                    for{" "}
                    <span className="fw-semibold">
                      “{normalizedAppliedSearch}”
                    </span>
                  </>
                ) : null}
              </div>

              <div className="small text-muted">
                Page <strong>{page}</strong>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <span className="fw-semibold">Movies</span>
            {loading ? (
              <span className="badge text-bg-warning">Loading…</span>
            ) : (
              <span className="badge text-bg-dark">Ready</span>
            )}
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="p-4 d-flex align-items-center gap-3">
                <div
                  className="spinner-border"
                  role="status"
                  aria-label="Loading"
                />
                <div className="text-muted">Loading movies…</div>
              </div>
            ) : movies.length === 0 ? (
              <div className="p-4 text-muted">No movies found.</div>
            ) : (
              <ul className="list-group list-group-flush">
                {movies.map((m) => (
                  <li
                    key={m.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <Link
                        to={`/movies/${m.id}`}
                        className="fw-semibold text-decoration-none"
                      >
                        {m.title}
                      </Link>
                      <div className="text-muted small">
                        {m.year} • ID: {m.id}
                      </div>
                    </div>
                    <span className={`badge ${sourceBadgeClass(m.source)}`}>
                      {m.source}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card-footer bg-white d-flex justify-content-between align-items-center">
            <button
              className="btn btn-outline-dark"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              ◀ Prev
            </button>

            <span className="text-muted small">
              Tip: changing filters resets to page 1
            </span>

            <button
              className="btn btn-dark"
              disabled={loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next ▶
            </button>
          </div>
        </div>

        <div className="text-center text-muted small mt-4">
          Built with React + Express (TypeScript)
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="modal-backdrop fade show" />
          <div
            className="modal fade show"
            style={{ display: "block" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Local Movie</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={closeModal}
                    disabled={creating}
                  />
                </div>

                <div className="modal-body">
                  {createError && (
                    <div className="alert alert-danger">{createError}</div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      className="form-control"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. My New Movie"
                      autoFocus
                      disabled={creating}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Year</label>
                    <input
                      className="form-control"
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      placeholder="e.g. 2024"
                      disabled={creating}
                      inputMode="numeric"
                    />
                    <div className="form-text">Valid range: 1888–2100</div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={closeModal}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={createLocalMovie}
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMovie(movieId: string) {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/movies/${movieId}`);
      if (!res.ok) throw new Error(`Failed to load movie (${res.status})`);

      const data = (await res.json()) as Movie;
      setMovie(data);
    } catch (err) {
      console.error(err);
      setMovie(null);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    loadMovie(id);
  }, [id]);

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <Link
            to="/"
            className="navbar-brand fw-semibold text-decoration-none"
          >
            🎬 Movies
          </Link>
        </div>
      </nav>

      <div className="container py-4">
        <div className="mb-3">
          <Link to="/" className="btn btn-outline-dark">
            ← Back to list
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <span className="fw-semibold">Movie Details</span>
            {loading ? (
              <span className="badge text-bg-warning">Loading…</span>
            ) : (
              <span className="badge text-bg-dark">Ready</span>
            )}
          </div>

          <div className="card-body">
            {loading ? (
              <div className="d-flex align-items-center gap-3">
                <div
                  className="spinner-border"
                  role="status"
                  aria-label="Loading"
                />
                <div className="text-muted">Loading movie…</div>
              </div>
            ) : !movie ? (
              <div className="text-muted">Movie not found.</div>
            ) : (
              <>
                <h3 className="mb-1">{movie.title}</h3>
                <div className="text-muted mb-3">
                  {movie.year} •{" "}
                  <span className="text-uppercase">{movie.source}</span>
                </div>

                <dl className="row mb-0">
                  <dt className="col-sm-3">ID</dt>
                  <dd className="col-sm-9">{movie.id}</dd>

                  <dt className="col-sm-3">Title</dt>
                  <dd className="col-sm-9">{movie.title}</dd>

                  <dt className="col-sm-3">Year</dt>
                  <dd className="col-sm-9">{movie.year}</dd>

                  <dt className="col-sm-3">Source</dt>
                  <dd className="col-sm-9">{movie.source}</dd>
                </dl>

                <div className="alert alert-info mt-3 mb-0">
                  Note: The third-party API only provides limited fields. The
                  middleware normalizes all movies to a consistent shape.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MoviesListPage />} />
      <Route path="/movies/:id" element={<MovieDetailPage />} />
    </Routes>
  );
}
