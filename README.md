# Game Content Pipeline

A local portfolio application for authoring, validating, staging, and rolling back live-game content.
<img width="1885" height="863" alt="image" src="https://github.com/user-attachments/assets/68e110c2-939a-466e-b80f-b01cbcc03ef2" />
<img width="1886" height="868" alt="image" src="https://github.com/user-attachments/assets/1c09ea93-1a68-45a2-a5c9-b9c88c5b38ae" />

## Architecture

- **React + TypeScript** — content editor and operations console.
- **C++20** — native validation engine invoked as a subprocess.
- **Python 3** — HTTP API and release pipeline.
- **SQLite** — durable local release history and rollback records.

The hosted `chatgpt.site` demo remains separate. The local application does not require a domain or an internet connection after the first toolchain setup.

## Run locally

Requirements: Node.js 20+ and Python 3.11+.

```powershell
npm install
npm run local:setup
npm run local
```

Open <http://127.0.0.1:8000>. Stop the server with `Ctrl+C`.

`local:setup` compiles the native C++20 engine and builds the frontend. On Windows, when no C++ compiler is installed, it downloads a portable Zig toolchain into the system temporary directory. It does not install anything globally.

## Development mode

Run the Python API:

```powershell
npm run dev:api
```

In another terminal, run Vite:

```powershell
npm run dev
```

Open <http://127.0.0.1:5173>. Vite proxies `/api` requests to the Python service on port 8000.

## Tests

```powershell
npm test
```

This runs the native C++ tests, Python integration tests, and the production frontend build.

## Local data

Release history is stored at `release-pipeline/data/pipeline.db`. The database and compiled binaries are intentionally ignored by Git.
