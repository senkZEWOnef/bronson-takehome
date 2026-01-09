import { useEffect, useMemo, useState } from "react";

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

type MoviesArrayResponse = Movie[];

export default function App() {
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

  // Modal state (Bootstrap modal rendered conditionally)
  const [showModal, setShowModal] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState<string>("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

      const data = (await res.json()) as
        | MoviesPaginatedResponse
        | MoviesArrayResponse;
      const items = Array.isArray(data) ? data : data.items;

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
    // avoid StrictMode “double effect” weirdness causing race conditions
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

    // Simple validation
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

      // Nice UX: show new local movies immediately
      // Put user back on page 1 so they can see it (locals appear first in "all")
      setPage(1);
      setSource("all");
      setAppliedSearch("");
      setSearchText("");

      closeModal();

      // reload list after state updates
      await loadMovies();
    } catch (err) {
      console.error(err);
      setCreateError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Top bar */}
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <span className="navbar-brand fw-semibold">🎬 Movies</span>
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
        {/* Controls Card */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              {/* Source */}
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

              {/* Page size */}
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

              {/* Search */}
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

            {/* Status line */}
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

        {/* Error */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Movies list */}
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
                      <div className="fw-semibold">{m.title}</div>
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

          {/* Pagination */}
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

      {/* -------- Modal (Bootstrap, no JS dependency) -------- */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div className="modal-backdrop fade show" />

          {/* Modal */}
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
                    <div className="alert alert-danger" role="alert">
                      {createError}
                    </div>
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createLocalMovie();
                        if (e.key === "Escape") closeModal();
                      }}
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createLocalMovie();
                        if (e.key === "Escape") closeModal();
                      }}
                    />
                    <div className="form-text">Valid range: 1888–2100</div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeModal}
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
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
