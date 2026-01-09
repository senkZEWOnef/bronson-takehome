import { useEffect, useState } from "react";

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

  // ✅ default is 12 now (matches backend default)
  const [pageSize, setPageSize] = useState(12);

  const [source, setSource] = useState<"all" | "local" | "third_party">("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchMovies() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          source,
        });

        const res = await fetch(`/movies?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to load movies (${res.status})`);

        const data = (await res.json()) as
          | MoviesPaginatedResponse
          | MoviesArrayResponse;

        // Support both shapes (array or paginated object)
        const items = Array.isArray(data) ? data : data.items;

        if (!Array.isArray(items)) {
          throw new Error("Unexpected response shape from /movies");
        }

        if (!ignore) setMovies(items);
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setMovies([]);
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchMovies();

    return () => {
      ignore = true;
    };
  }, [page, pageSize, source]);

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "40px auto",
        padding: 16,
        fontFamily: "sans-serif",
      }}
    >
      <h1>🎬 Movies</h1>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <label style={{ marginRight: 8 }}>Source:</label>
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value as "all" | "local" | "third_party");
              setPage(1); // ✅ reset page when changing source
            }}
          >
            <option value="all">All</option>
            <option value="local">Local</option>
            <option value="third_party">Third Party</option>
          </select>
        </div>

        <div>
          <label style={{ marginRight: 8 }}>Page size:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1); // ✅ reset page when changing page size
            }}
          >
            <option value={5}>5</option>
            <option value={12}>12</option>
            <option value={25}>25</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: "crimson", marginTop: 8 }}>
          <strong>Error:</strong> {error}
        </p>
      )}

      {/* List */}
      {loading ? (
        <p>Loading...</p>
      ) : movies.length === 0 ? (
        <p>No movies found.</p>
      ) : (
        <ul>
          {movies.map((m) => (
            <li key={m.id}>
              <strong>{m.title}</strong> ({m.year}) — {m.source}
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      <div style={{ marginTop: 20 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          ◀ Prev
        </button>

        <span style={{ margin: "0 12px" }}>Page {page}</span>

        <button onClick={() => setPage((p) => p + 1)}>Next ▶</button>
      </div>
    </div>
  );
}
