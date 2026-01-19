# AirAware+ Project Structure Guide

This document explains the purpose of each file and folder in the AirAware+ project. It is intended as a shared reference for the team to maintain a clear layered architecture using vanilla JavaScript, HTML, and CSS.

---

## Root HTML Pages (Presentation – UI)

### `index.html` (Login page)

* Entry point to the application
* Collects basic user login or session start information
* Contains no business or risk logic

### `threshold.html`

* Allows the user to define their personal pollution tolerance thresholds
* Focused purely on input and display

### `location.html`

* Allows the user to set or confirm their location (city or coordinates)
* Does not decide how location is resolved or used

### `dashboard.html`

* Displays air quality information and personalised risk insights
* Renders data already processed by the application and domain layers

---

## `css/`

### `main.css`

* Global styling for all pages
* Contains layout, colours, typography, and responsive rules
* No JavaScript or logic-related concerns

---

## `js/presentation/` (Presentation Logic)

Page-specific JavaScript responsible for:

* Handling user interactions (clicks, form submissions)
* Reading input values from the DOM
* Passing data to the application layer
* Rendering returned results

### `login.js`

* Handles login form events
* Calls the login use case

### `threshold.js`

* Captures user-defined tolerance levels
* Sends raw input to the application layer

### `location.js`

* Handles location input or browser location permissions
* Delegates resolution logic elsewhere

### `dashboard.js`

* Requests dashboard data from the application layer
* Updates UI elements with risk insights

---

## `js/application/` (Use Cases)

This layer coordinates what the system *does*. It:

* Orchestrates steps across domain and infrastructure layers
* Represents user-driven actions

### `loginUser.js`

* Handles the login flow
* Stores or retrieves user session data

### `saveThreshold.js`

* Validates and saves user tolerance preferences
* Uses domain value objects before persisting

### `resolveLocation.js`

* Determines the user’s active location
* Coordinates with location services

### `buildDashboard.js`

* Retrieves air quality data
* Invokes domain risk assessment
* Returns structured data ready for display

---

## `js/domain/` (Core Business Logic)

This is the most important layer. It contains:

* Asthma-related reasoning
* Pollution interpretation rules
* No browser, API, or storage dependencies

### `models/`

#### `UserProfile.js`

* Represents a user and their sensitivity preferences

#### `PollutionReading.js`

* Represents a pollution measurement (PM2.5, NO₂, time, location)

### `services/`

#### `RiskAssessmentService.js`

* Converts pollution readings and user tolerance into risk levels
* Encapsulates all decision-making logic

### `valueObjects/`

#### `ToleranceLevel.js`

* Defines valid threshold ranges
* Prevents invalid or inconsistent tolerance values

---

## `js/infrastructure/` (External Systems)

This layer handles all interactions with the outside world.

### `airQualityApi.js`

* Fetches air quality data from public APIs
* Returns raw or lightly normalised data

### `locationService.js`

* Resolves user location via browser APIs or manual input

### `storageService.js`

* Handles persistence (e.g. localStorage)
* Isolated so storage can be replaced later if needed

---

## `js/config/`

### `constants.js`

* Central place for shared constants
* Includes pollutant names, default values, and app-wide settings

---

## `assets/`

### `icons/`

* Stores UI icons and static visual assets

---

## `docs/`

### `architecture.md`

* Explains the chosen architecture
* Justifies the layered approach
* References system context and design decisions

---

## Guiding Principles

* Presentation never contains business logic
* Domain never depends on browser or APIs
* Dependencies always point inwards
* The system provides decision-support, not medical diagnosis

This structure ensures clarity, maintainability, and strong architectural justification.
