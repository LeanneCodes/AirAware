# AirAware Routes Map (Backend)

This document lists the routes we expect to build, grouped by route area.
Each row maps to a controller function we need to implement.

---

## 1) Auth Routes (authController)

| Route group | Method | Path           | Action (what it does)                  | Controller function (suggested) |
|------------|--------|----------------|----------------------------------------|----------------------------------|
| auth       | POST   | /auth/signup   | Create a new account                    | signup()                         |
| auth       | POST   | /auth/login    | Log in and receive token/session        | login()                          |
| auth       | POST   | /auth/logout   | Log out (optional for JWT)              | logout()                         |

---

## 2) User Routes (userController)

| Route group | Method | Path        | Action (what it does)                     | Controller function (suggested) |
|------------|--------|-------------|-------------------------------------------|----------------------------------|
| user       | GET    | /user/me    | Get the logged-in user’s profile          | getMe()                          |
| user       | PATCH  | /user/me    | Update profile settings (DOB, gender etc) | updateMe()                       |

---

## 3) Location Routes (locationController)

| Route group | Method | Path        | Action (what it does)                           | Controller function (suggested) |
|------------|--------|-------------|-------------------------------------------------|----------------------------------|
| location   | GET    | /location   | Get saved location (for forms + dashboard)      | getLocation()                    |
| location   | PATCH    | /location   | Save/update location (postcode/city/lat/lon)    | updateLocation()                 |

---

## 4) Threshold Routes (thresholdController)

| Route group | Method | Path         | Action (what it does)                   | Controller function (suggested) |
|------------|--------|--------------|-----------------------------------------|----------------------------------|
| thresholds | GET    | /thresholds  | Get current thresholds for the user     | getThresholds()                  |
| thresholds | PATCH    | /thresholds  | Set/update thresholds (pm25, no2 etc)   | updateThresholds()               |

---

## 5) Dashboard Routes (dashboardController)

| Route group | Method | Path        | Action (what it does)                                  | Controller function (suggested) |
|------------|--------|-------------|--------------------------------------------------------|----------------------------------|
| dashboard  | GET    | /dashboard  | Return combined data (location + AQ + thresholds)      | getDashboard()                   |