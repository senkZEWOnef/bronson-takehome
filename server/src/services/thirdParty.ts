// This file is responsible for talking to the third-party API.

import type { Movie } from "../types/movie";

// Base URL for the third-party service (JSON Fakery)
const BASE_URL = "https://jsonfakery.com/movies";

/**
 * This describes the shape we expect from the third-party API.
 * We don't type every field, only what we actually use.
 */
type ThirdPartyMovie = {
  movie_id: number;
  original_title?: string;
  title?: string;
  release_date?: string; // example: "Wed, 11/19/1958"
};

/**
 * Convert a third-party movie object into OUR normalized Movie type.
 * This is the "translator" layer.
 */
function normalizeThirdPartyMovie(raw: ThirdPartyMovie): Movie {
  const title = raw.original_title ?? raw.title ?? "Untitled";

  // Year extraction:
  // If parsing fails or release_date is missing, year=0 means "unknown".
  let year = 0;
  if (raw.release_date) {
    const parsed = new Date(raw.release_date);
    year = Number.isNaN(parsed.getTime()) ? 0 : parsed.getFullYear();
  }

  return {
    id: `tp_${raw.movie_id}`,
    title,
    year,
    source: "api",
  };
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

  const payload = (await res.json()) as { data?: ThirdPartyMovie[] };

  const data = Array.isArray(payload.data) ? payload.data : [];
  return data.map(normalizeThirdPartyMovie);
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

  const payload = (await res.json()) as ThirdPartyMovie[];

  const data = Array.isArray(payload) ? payload : [];
  return data.map(normalizeThirdPartyMovie);
}
