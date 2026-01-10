# Bronson Take-Home – Movies API & React Client

This project is a full-stack take-home assignment demonstrating a simple movies
application built with a **TypeScript Express API** and a **React + TypeScript client**.

The backend acts as a middleware layer that combines **locally persisted movie data**
with **third-party movie data**, normalizes the data into a consistent shape,
and exposes a clean, predictable API.  
The frontend consumes this API and provides pagination,
filtering, searching, and basic CRUD functionality.

---

## Project Structure

bronson-takehome/
├── server/ # Express + TypeScript API
├── client/ # React + TypeScript UI (Vite)
└── README.md

---

## Tech Stack

### Backend

- Node.js
- Express
- TypeScript
- File-based persistence (`movies.json`)

### Frontend

- React
- TypeScript
- Vite
- Bootstrap (styling)

---

## Features

### Backend API

#### `GET /movies`

Returns a paginated list of movies from local storage, third-party API data, or both.

**Query Parameters**

- `page` (number, default: 1)
- `pageSize` (number, default: 12)
- `source` (`all | local | third_party`, default: `all`)
- `search` (string, optional – filters by movie title)

---

#### `GET /movies/random/:count`

Returns a list of randomly selected movies from the third-party API.

---

#### `GET /movies/:id`

Returns a single locally stored movie by ID.

---

#### `POST /movies`

Creates a new local movie and persists it to disk.

**Request Body**

```json
{
  "title": "Movie Title",
  "year": 2024
}
```

### Data Shape

All movies returned by the API are normalized
to the same structure regardless of origin:
{
id: string;
title: string;
year: number;
source: "local" | "api";
}

### Frontend Application

The React client provides:
Movie list view with pagination
Source filtering (all / local / third-party)
Adjustable page size
Search by movie title
Add Movie form (local movies)
Movie detail display
Recommendation feature (fetches 3 random movies)
Loading, empty, and error states
Responsive layout using Bootstrap

### Running the Project Locally

This project contains two separate applications
that must be run simultaneously:

### SERVER (API)

cd server
npm install
npm run dev

Runs on: http://localhost:4000
Persists local movies to: server/data/movies.json

### Client (React UI)

Open a second terminal window:

cd client
npm install
npm run dev

Runs on: http://localhost:5173
Uses a Vite proxy to forward /movies requests to the backend

### Important

Both the server and client must be running at
the same time for the application to function correctly.

### Notes & Tradeoffs

Third-party movie data is paginated and outside
of the application's control.
Searching third-party data is implemented
as a best-effort filter on fetched pages.
Local movie data is fully searchable and
persisted between server restarts.
A traditional database was intentionally not used;
file-based persistence was chosen for clarity and
simplicity given the scope of the assignment.
The backend never trusts external API data and always
normalizes it before exposing it to the client.

### Possible Improvements

Global third-party search across multiple pages
Expanded movie metadata (genre, cast, description)
Server-side caching
Automated tests
Authentication / user-based movie ownership

Author
Ralph Ulysse
