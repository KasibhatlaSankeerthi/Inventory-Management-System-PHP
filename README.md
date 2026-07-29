# Inventory Management System Migration

This repository now contains the original PHP inventory management app and the new React + Node.js foundation created for epic `DT-15`.

## DT-15 Scope Delivered

The following stories and tasks are implemented:

- `DT-19`: Create frontend and backend base projects
- `DT-20`: Create React app for inventory UI
- `DT-21`: Create Node.js + Express app for APIs
- `DT-22`: Configure project folders and environment files
- `DT-23`: Connect backend to MySQL
- `DT-24`: Add MySQL connection setup in Node.js
- `DT-25`: Verify backend can read `user` and `product` tables
- `DT-26`: Add basic error handling for database failures

## Project Structure

- `frontend/`: React app bootstrapped with Vite
- `backend/`: Express API with reusable MySQL connection pool
- `inventorymanagement.sql`: Existing MySQL schema and seed data
- `index.html`, `login.php`, `table.php`, `additem.php`, `edit.php`, `delete.php`: Legacy PHP implementation retained for reference during migration

## Environment Setup

1. Install dependencies:

```sh
npm install
```

2. Create local environment files:

```sh
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

3. Update `backend/.env` values if your MySQL connection differs from the defaults.

## Run The New Apps

Start the backend:

```sh
npm run dev:backend
```

Start the frontend in another terminal:

```sh
npm run dev:frontend
```

## Backend Bootstrap Endpoints

- `GET /api/health`: basic API health check
- `GET /api/bootstrap/tables`: verifies MySQL connectivity and returns sample rows from `user` and `product`

If the database is unavailable, the backend returns a safe `503` response with a clear message instead of exposing raw driver errors.

## Legacy App

The original PHP implementation is still present and unchanged so the migration can continue incrementally.

