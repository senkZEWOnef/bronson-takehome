import { useCallback, useEffect, useMemo, useState } from "react";

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

  // Search state
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // Global UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const normalizedAppliedSearch = useMemo(
    () => appliedSearch.trim(),
    [appliedSearch]
  );

  const loadMovies = useCallback(async () => {
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
      if (!res.ok) {
        throw new Error(`Failed to load movies (${res.status})`);
      }

      const data = (await res.json()) as
        | MoviesPaginatedResponse
        | MoviesArrayResponse;

      const items = Array.isArray(data) ? data : data.items;

      if (!Array.isArray(items)) {
        throw new Error("Unexpected response shape from /movies");
      }

      setMovies(items);
    } catch (err) {
      setMovies([]);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, source, normalizedAppliedSearch]);

  useEffect(() => {
    // Guard against state updates after unmount (dev StrictMode may re-run effects)
    let cancelled = false;

    (async () => {
      if (!cancelled) {
        await loadMovies();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadMovies]);

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
      setCreateError("Year must be between 1888 and 2100.");
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
      setCreateError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <span className="navbar-brand fw-semibold">🎬 Movies</span>
          <button className="btn btn-sm btn-warning" onClick={openModal}>
            + Add Local Movie
          </button>
        </div>
      </nav>

      <div className="container py-4">
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
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

              <div className="col-md-3">
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

              <div className="col-md-6">
                <label className="form-label">Search title</label>
                <div className="input-group">
                  <input
                    className="form-control"
                    value={searchText}
                    placeholder="Search by title..."
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
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card shadow-sm">
          <ul className="list-group list-group-flush">
            {loading ? (
              <li className="list-group-item">Loading…</li>
            ) : movies.length === 0 ? (
              <li className="list-group-item text-muted">No movies found.</li>
            ) : (
              movies.map((m) => (
                <li
                  key={m.id}
                  className="list-group-item d-flex justify-content-between"
                >
                  <div>
                    <strong>{m.title}</strong> ({m.year})
                  </div>
                  <span className={`badge ${sourceBadgeClass(m.source)}`}>
                    {m.source}
                  </span>
                </li>
              ))
            )}
          </ul>

          <div className="card-footer d-flex justify-content-between">
            <button
              className="btn btn-outline-dark"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              ◀ Prev
            </button>
            <button
              className="btn btn-dark"
              disabled={loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next ▶
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Local Movie</h5>
                  <button className="btn-close" onClick={closeModal} />
                </div>

                <div className="modal-body">
                  {createError && (
                    <div className="alert alert-danger">{createError}</div>
                  )}

                  <input
                    className="form-control mb-2"
                    placeholder="Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />

                  <input
                    className="form-control"
                    placeholder="Year"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                  />
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={createLocalMovie}
                    disabled={creating}
                  >
                    {creating ? "Creating…" : "Create"}
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
