#  AirAware

AirAware is a data-driven web application designed to help users understand how air pollution impacts respiratory health, with a particular focus on asthma and allergies. The platform aims to raise awareness, provide insights through data visualisation, and support informed decision-making for individuals sensitive to air quality.

---

## Project Description

Air pollution is a major environmental risk to health, especially for people with asthma and allergies. **AirAware** aggregates and analyses air quality and health-related data to highlight trends, risks, and insights in a clear and accessible way.  

The project was built as part of a data-focused MVP, combining backend development, data analysis, and visualisation tools.

---

## Installation & Usage

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/airaware.git
   ```
2. Navigate into the project directory:
   ```bash 
   cd airaware
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a ```.env ``` file and add required environment variables:
   ``` bash
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret
   ```

### Usage
1. Start the development server:
   ``` bash 
   npm run dev
   ```
2. Access the API locally via:
   ``` arduino
   http://localhost:3000
   ```
3. Use Postman or a frontend client to interact with the available endpoints. 

---

### Example API Request

**Register a new user**

   ``` http
POST /api/auth/register HTTP/1.1
Host: localhost:3000
Content-Type: application/json
```
``` json 
{
  "email": "user@example.com",
  "password": "password123",
  "condition": "asthma",
  "sensitivity": "high"
}
```
### Scripts 
``` bash
npm run dev       # Start development server 
npm start         # Start production server
npm test          # Run unit and integration tests
```
## Development vs Production 
### Development
- Uses ``` npm run dev ```
- Includes detailed error logging
- Intended for local development and testing
- Environment variables loaded from .env
### Production
- Uses ``` npm start ```
- Optimised for performance and stability
- Environment variables managed by the hosting platform
- Debug logging disabled

Before deploying to production, ensure:
- Environment variables are securely configured
- Database migrations are up to date
- All tests pass successfully
---
## Testing

This project uses **Jest** for unit and integration testing.

### Running Tests

Run all tests with:
```bash
npm test

- Example test 
``` js 
describe("Health check endpoint", () => {
  it("should return status 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
  });
});
```
The tests cover 
- User authentication logic
- Model functions
- Protected routes
- Error handling

### Authentication Flow
AirAware uses JWT-based authentication.
### Authentication Steps
1. User registers with email and password.
2. Password is hashed using ``` bcrypt```.
3. A JWT is generated and returned to the user.
4. The JWT is stored client-side (e.g. localStorage).
5. Protected routes require a valid JWT in the ``` Authorisation``` header.

If the token is missing, invalid, or expired, access is denied.

## Deployment 
The application can be deployed to platforms such as **Render**, **Railway**, or **Heroku**.
### General Deployment Steps
1. Push the project to GitHub.
2. Create a new service on your chosen platform.
3. Set the following environment variables:
``` nginx 
DATABASE_URL
JWT_SECRET
```
4. Ensure the build and start commands are set correctly:
``` bash 
npm install
npm start
```
### Notes
- Use a managed PostgreSQL database.
- Do not commit the ```.env``` file.
- Run tests before deploying to production.
---
## API endpoints 
| Method | Endpoint             | Description                | Auth Required |
|--------|----------------------|----------------------------|---------------|
| POST   | `/api/auth/register` | Register a new user        | ❌ No         |
| POST   | `/api/auth/login`    | Log in an existing user    | ❌ No         |
| GET    | `/api/users/profile` | Get logged-in user profile | ✅ Yes        |
| PUT    | `/api/users/profile` | Update user information    | ✅ Yes        |
| GET    | `/api/health`        | API health check           | ❌ No         |

---

## Problem Statement & USP

### Problem Statement

Air pollution is a significant environmental and public health issue, particularly for individuals with respiratory conditions such as asthma and allergies. While air quality data is widely available, it is often fragmented, difficult to interpret, and not directly linked to health impacts. This makes it challenging for affected individuals and stakeholders to understand risks and make informed decisions.

### Unique Selling Point (USP)

**AirAware** bridges the gap between raw air quality data and real-world health impacts by:
- Combining environmental and health-related datasets
- Presenting insights through clear, interactive visualisations
- Focusing specifically on asthma and allergy-related sensitivities
- Providing a foundation for personalised, data-driven health awareness

---

## Data Analysis & Visualisation

Data analysis is a core component of the AirAware project, enabling the transformation of raw datasets into meaningful insights.

### Databricks

- Used for data cleaning, preparation, and exploratory analysis
- Handled missing values and inconsistent records
- Performed aggregations and trend analysis on air pollution and health data
- Enabled scalable data processing using Python notebooks

### Tableau

- Used to create interactive dashboards and visualisations
- Highlighted trends in air pollution levels over time
- Visualised relationships between pollutants and respiratory health outcomes
- Allowed filtering by location, pollutant type, and time period

These tools together support evidence-based insights and enhance the accessibility of complex datasets.

---

## System Architecture
The AirAware application is built using a modular, layered architecture that separates backend services, data processing, and visualisation. This ensures scalability, maintainability, and clear responsibility across components.

### Architecture Diagram (Logical View)

```text
┌───────────────────────┐
│   Client / Consumer   │
│ (Postman / Frontend)  │
└───────────┬───────────┘
            │ HTTP Requests
            ▼
┌───────────────────────┐
│  Node.js / Express API│
│  - Auth (JWT)         │
│  - Business Logic     │
└───────────┬───────────┘
            │ SQL Queries
            ▼
┌───────────────────────┐
│     PostgreSQL DB     │
│  - Users              │
│  - App Data           │
└───────────┬───────────┘
            │ Data Export
            ▼
┌───────────────────────┐
│     Databricks        │
│  - Data Cleaning      │
│  - Analysis (Python)  │
└───────────┬───────────┘
            │ Processed Data
            ▼
┌───────────────────────┐
│       Tableau         │
│  - Dashboards         │
│  - Visual Insights    │
└───────────────────────┘
```

### Architecture Overview

- **Client / API Consumer**
  - Postman or frontend application
- **Backend**
  - Node.js & Express.js REST API
  - JWT-based authentication
- **Database**
  - PostgreSQL for persistent user and application data
- **Data Layer**
  - Data processing and analysis in Databricks
- **Visualisation Layer**
  - Tableau dashboards for insights and reporting

### Diagram

---

## Results & Insights

Analysis of air quality and health-related datasets revealed several key insights.

### Key Findings

- Certain pollutants (such as particulate matter) consistently showed higher concentrations in urban areas.
- Periods of increased air pollution aligned with higher reported respiratory health risks.
- Seasonal trends indicated worse air quality during specific months.
- Geographic variation highlighted regions with consistently poorer air quality.

### Dashboard Insights

Tableau dashboards enabled:

- Comparison of pollutant levels over time
- Filtering by location and pollutant type
- Identification of high-risk periods for asthma and allergy sufferers

These insights demonstrate the value of combining environmental and health data to support awareness and informed decision-making.

---

## Data Quality & Limitations

While the project provides valuable insights, several data limitations were identified.

### Data Quality Considerations

- Missing values were present in some datasets and required cleaning.
- Data sources varied in granularity and update frequency.
- Health data was aggregated and did not represent individual diagnoses.

### Limitations

- No real-time data integration in the MVP.
- Limited geographic coverage depending on data availability.
- Correlation does not imply causation between pollution levels and health outcomes.

These limitations were considered during analysis and provide direction for future improvements.


