// server/src/services/thirdParty.ts
// This file is responsible for talking to the third-party API.

import type { Movie } from "../types/movie";

// Base URL for the third-party service (JSON Fakery)
const BASE_URL = "https://jsonfakery.com/movies";

/**
 * Third-party shape (only what we use).
 */
type ThirdPartyMovie = {
  movie_id: number;
  original_title?: string;
  title?: string;
  release_date?: string; // example: "Wed, 11/19/1958"
};

// In-memory cache so we can serve /movies/:id for third-party movies
// Key example: "tp_12345"
const thirdPartyCache = new Map<string, Movie>();

/**
 * Convert a third-party movie object into OUR normalized Movie type.
 */
function normalizeThirdPartyMovie(raw: ThirdPartyMovie): Movie {
  const title = raw.original_title ?? raw.title ?? "Untitled";

  let year = 0;
  if (raw.release_date) {
    const parsed = new Date(raw.release_date);
    year = Number.isNaN(parsed.getTime()) ? 0 : parsed.getFullYear();
  }

  const movie: Movie = {
    id: `tp_${raw.movie_id}`,
    title,
    year,
    source: "api",
  };

  // cache it so /movies/:id can find it later
  thirdPartyCache.set(movie.id, movie);

  return movie;
}

/**
 * Retrieve a cached third-party movie by id (e.g. tp_123).
 */
export function getCachedThirdPartyMovie(id: string): Movie | null {
  return thirdPartyCache.get(id) ?? null;
}

/**
 * Fetch a page of movies from the third-party paginated endpoint.
 */
export async function fetchThirdPartyMoviesPage(
  page: number
): Promise<Movie[]> {
  const url = `${BASE_URL}/paginated?page=${page}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Third-party fetch failed: ${res.status}`);
  }

  // Third-party response: { data: ThirdPartyMovie[] }
  const payload = (await res.json()) as { data: ThirdPartyMovie[] };

  return payload.data.map(normalizeThirdPartyMovie);
}

/**
 * Fetch N random movies from third-party.
 */
export async function fetchThirdPartyRandom(count: number): Promise<Movie[]> {
  const url = `${BASE_URL}/random/${count}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Third-party random fetch failed: ${res.status}`);
  }

  // Third-party response is an array
  const payload = (await res.json()) as ThirdPartyMovie[];

  return payload.map(normalizeThirdPartyMovie);
}
