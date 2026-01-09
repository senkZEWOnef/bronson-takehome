# Bronson Take-Home – Movies API & React Client

This project is a full-stack take-home assignment that demonstrates
a simple movies application using a **TypeScript Express API**
and a **React + TypeScript client**.

The backend combines **locally persisted movie data** with
**third-party movie data**, normalizes the data shape, and exposes a clean API.  
The frontend consumes this API and provides pagination, filtering, and search.

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

---

## Features

### Backend API

#### `GET /movies`

Returns a paginated list of movies.

Query parameters:

- `page` (number, default: 1)
- `pageSize` (number, default: 12)
- `source` (`all | local | third_party`, default: all)
- `search` (string, optional – filters by movie title)

#### `GET /movies/random/:count`

Returns a list of random movies fetched from a third-party API.

#### `GET /movies/:id`

Returns a locally stored movie by id.

#### `POST /movies`

Creates a new local movie and persists it to disk.

Request body:

```json
{
  "title": "Movie Title",
  "year": 2024
}
```

### Data Shape

All movies returned by the API are normalized to the same shape:
{
id: string;
title: string;
year: number;
source: "local" | "api";
}

### Frontend UI

- Displays movies with pagination
- Filter by data source (all / local / third-party)
- djustable page size
- Search by movie title
- Loading and empty states

### Instuctions to run the project

This project contains two separate applications that must be run in two terminals:

- Server (API)
  cd server
  npm install
  npm run dev

Runs on: http://localhost:4000
Persists local movies to server/data/movies.json

- Client (React UI)
  Open a new terminal window:
  cd client
  npm install
  npm run dev

Runs on: http://localhost:5173
Uses a Vite proxy to forward /movies requests to the backend

### Important

Both the server and the client must be running
at the same time for the application to work.

### Notes & Tradeoffs

Third-party movie data is paginated and outside
of the application’s control.
Search on third-party movies is implemented
as best-effort filtering on the fetched page.
Local movie data is fully searchable
and persisted between server restarts.
A database was intentionally not used;
file persistence was chosen for simplicity and clarity.

### Possible Improvements

Global third-party search across multiple pages
Movie detail page in the frontend
Server-side caching
Automated tests

Author
Ralph Ulysse
