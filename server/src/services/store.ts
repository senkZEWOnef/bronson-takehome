// This file is the "local database" layer.

import fs from "fs/promises";
import path from "path";
import type { Movie } from "../types/movie";

// Absolute path to data/movies.json (safe no matter where the process is run from)
const MOVIES_PATH = path.join(process.cwd(), "data", "movies.json");

/**
 * Read the JSON file and return local movies.
 * If the file is missing or invalid, return an empty list.
 */
export async function readLocalMovies(): Promise<Movie[]> {
  try {
    const raw = await fs.readFile(MOVIES_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Movie[];

    // Basic sanity check: ensure it's an array
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch {
    // If file doesn't exist or JSON is bad, treat it as "no local movies yet"
    return [];
  }
}

/**
 * Write the full array of local movies back to the JSON file.
 */
async function writeLocalMovies(movies: Movie[]): Promise<void> {
  const json = JSON.stringify(movies, null, 2); // pretty print for readability
  await fs.writeFile(MOVIES_PATH, json, "utf-8");
}

/**
 * Create and persist a new local movie.
 * We generate an id and force source="local" no matter what the caller sends.
 */
export async function createLocalMovie(input: {
  title: string;
  year: number;
}): Promise<Movie> {
  const movies = await readLocalMovies();

  const movie: Movie = {
    id: `local_${Date.now()}`,
    title: input.title,
    year: input.year,
    source: "local",
  };

  movies.push(movie);
  await writeLocalMovies(movies);

  return movie;
}

/**
 * Find a local movie by id.
 */
export async function findLocalMovieById(id: string): Promise<Movie | null> {
  const movies = await readLocalMovies();
  return movies.find((m) => m.id === id) ?? null;
}
