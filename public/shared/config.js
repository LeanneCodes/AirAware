// Local Express
const LOCAL_API = "http://localhost:3000";

// Deployed Express
const PROD_API = "https://airaware-k5lk.onrender.com";

// If running on localhost, use local API; otherwise use deployed API
window.API_BASE = window.location.hostname === "localhost" ? LOCAL_API : PROD_API;
