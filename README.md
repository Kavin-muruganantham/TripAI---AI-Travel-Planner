# AI Trip Planner

Stack:
- Frontend: React 18 + Vite (client/)
- Backend: Node.js + Express (server/)
- Database: MySQL (optional seeded JSON fallback in server/data)
- Auth: JWT with bcrypt
- AI Integrations:
  - Gemini 2.5 Flash: itinerary generation (server/controllers/tripController.js)
 
API Changes
- POST `/api/trip/generate` — unchanged for clients; response now includes an `advisory` object when Foundry is configured.
- POST `/api/trip/advisory` — new route to run advisory analysis independently (protected by auth).

Environment Variables
- `GEMINI_API_KEY` — Gemini API key (itinerary generation)
- `OPENWEATHER_API_KEY`, `MYSQL_*`, `JWT_SECRET`, etc.

Frontend
- New component: `client/src/components/TravelRiskAdvisor.jsx` — displays risk level, alerts, packing checklist, budget warnings, transport warnings, and recommendations.
- Planner page (`client/src/pages/Planner.jsx`) now shows the advisory when available.

Security Note
- Do NOT expose `FOUNDRY_API_KEY` or `GEMINI_API_KEY` in client-side code. The chatbot component in the client currently reads `VITE_GEMINI_API_KEY` — consider proxying chatbot calls through the server to avoid exposing keys.

How it works
1. Client posts trip spec to `/api/trip/generate` with JWT.
2. Server calls Gemini 2.5 Flash to produce a structured itinerary.
3. Server saves trip and advisory into the DB (or seeded storage) and returns the trip and advisory to the client.


How to run (dev)
```powershell
cd server
npm install
npm run dev

cd ../client
npm install
npm run dev
```

If you want, I can:
- Proxy the client chatbot through the server to protect API keys,
- Add unit tests around the Foundry client and advisory controller,
- Or wire more detailed storage for advisory in the database schema.

*** End of README ***
