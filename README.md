# AirAware MVC Project Structure Guide

This document explains the purpose of each folder and key file in the AirAware project. The project follows a **Node.js + Express MVC architecture**, with a clear separation between frontend (public) and backend (server) responsibilities.

---

## Root Files

### `index.js`

The main entry point of the application. It starts the Express server and listens for incoming requests on a specified port.

### `app.js`

Initialises and configures the Express application. This includes registering middleware, serving static files from the public folder, and wiring routes to controllers.

### `.env`

Stores environment variables such as database credentials, JWT secrets, and API keys. This file should never be committed to version control.

### `.gitignore`

Specifies which files and folders should be excluded from Git (for example `node_modules` and `.env`).

### `README.md`

High-level overview of the project, including setup instructions and a summary of the architecture.

---

## `public/` – View Layer (Frontend)

Contains all client-facing files. This represents the **View** in MVC, along with client-side JavaScript for user interaction.

### `public/index.html`

Login and registration page.

### `public/dashboard.html`

Displays personalised air quality information and risk insights for the user.

### `public/threshold.html`

Allows users to set and update their pollutant tolerance thresholds.

### `public/location.html`

Allows users to select or update their location preferences.

### `public/css/`

Contains global styling for the application.

* `style.css` – Main stylesheet used across all pages.

### `public/js/`

Client-side JavaScript files. Each file corresponds to a specific HTML page and handles DOM interaction and API calls.

* `index.js` – Handles login and registration logic.
* `dashboard.js` – Fetches and displays dashboard data.
* `threshold.js` – Handles threshold form submission.
* `location.js` – Handles location updates.

### `public/assets/`

Static assets such as images and icons used in the UI.

### `public/__tests__/`

Frontend tests that validate client-side behaviour and logic for each page.

---

## `server/` – Controller & Model Layer (Backend)

Contains all backend logic, including controllers, models, routes, database access, and middleware.

### `server/controllers/`

Controllers handle incoming HTTP requests, coordinate models, and return responses.

* `authController.js` – Handles user registration and login.
* `userController.js` – Handles user profile operations.
* `thresholdController.js` – Handles saving and retrieving threshold data.
* `dashboardController.js` – Aggregates data from multiple sources for the dashboard.

### `server/models/`

Models represent the application’s data structures and interact directly with the database.

* `User.js` – User account and authentication data.
* `Threshold.js` – Pollution tolerance data per user.
* `Location.js` – User location data.

### `server/routers/`

Defines API endpoints and maps them to controller functions. Routers contain no business logic.

* `authRoutes.js`
* `userRoutes.js`
* `thresholdRoutes.js`
* `dashboardRoutes.js`

### `server/db/`

Responsible for database configuration and setup.

* `connect.js` – Establishes a connection to the PostgreSQL database.
* `setup.js` – Handles database initialisation and setup tasks.
* `schema.sql` – Defines the database schema (tables, relationships, constraints).

### `server/middleware/`

Reusable middleware functions applied to routes.

* `authMiddleware.js` – Verifies JWTs and protects authenticated routes.

### `server/__tests__/`

Backend tests that validate controllers, routes, and database interactions.

---

## Architecture Summary

* **Views** live in the `public` folder and are responsible for presentation.
* **Controllers** live in `server/controllers` and handle request logic.
* **Models** live in `server/models` and manage data persistence.
* **Routes** connect HTTP endpoints to controllers.
* **Database access** is encapsulated in the `server/db` folder.

This structure ensures clear separation of concerns, improved maintainability, and a design that is easy to explain and assess.

---

## Project Tree Structure

```
AirAware
├─ README.md
├─ docs
│  ├─ locationLogic.md
│  └─ userJourney.md
├─ package-lock.json
├─ package.json
├─ public
│  ├─ __tests__
│  │  ├─ dashboard.test.js
│  │  ├─ location.test.js
│  │  ├─ login.test.js
│  │  └─ threshold.test.js
│  ├─ assets
│  │  ├─ logo-clear-bg.png
│  │  └─ logo-white-bg.png
│  ├─ css
│  │  └─ style.css
│  ├─ dashboard.html
│  ├─ index.html
│  ├─ js
│  │  ├─ dashboard.js
│  │  ├─ index.js
│  │  ├─ location.js
│  │  └─ threshold.js
│  ├─ location.html
│  └─ threshold.html
└─ server
   ├─ __tests__
   │  ├─ integration
   │  │  ├─ config.js
   │  │  └─ reset.all.sql
   │  └─ unit
   │     ├─ controllers
   │     │  ├─ authController.test.js
   │     │  ├─ dashboardController.test.js
   │     │  ├─ thresholdController.test.js
   │     │  └─ userController.test.js
   │     ├─ models
   │     │  ├─ Auth.test.js
   │     │  ├─ Location.test.js
   │     │  ├─ Threshold.test.js
   │     │  └─ User.test.js
   │     └─ services
   │        ├─ airQualityService.test.js
   │        └─ locationService.test.js
   ├─ app.js
   ├─ controllers
   │  ├─ authController.js
   │  ├─ dashboardController.js
   │  ├─ locationController.js
   │  ├─ thresholdController.js
   │  └─ userController.js
   ├─ db
   │  ├─ connect.js
   │  ├─ schema.sql
   │  └─ setup.js
   ├─ index.js
   ├─ middleware
   │  └─ authMiddleware.js
   ├─ models
   │  ├─ Auth.js
   │  ├─ Location.js
   │  ├─ Threshold.js
   │  └─ User.js
   └─ services
      ├─ airQualityService.js
      └─ locationService.js

```