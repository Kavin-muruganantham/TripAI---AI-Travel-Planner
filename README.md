# AI Trip Planner

Stack:
- Frontend: React 18 + Vite (client/)
- Backend: Node.js + Express (server/)
- Database: MySQL (optional seeded JSON fallback in server/data)
- Auth: JWT with bcrypt
- AI Integrations:
  - Gemini 2.5 Flash: itinerary generation (server/controllers/tripController.js)
  - Microsoft Foundry AI (Foundry IQ): Travel Risk & Smart Advisory Agent (server/utils/foundryClient.js)

Foundry Integration (Hackathon Requirements)
- A new Reasoning Agent "Travel Risk & Smart Advisory Agent" is implemented using Microsoft Foundry AI (Foundry IQ).
- After Gemini generates a trip itinerary, the server automatically sends the itinerary to Foundry for risk analysis and advisory.
- The advisory analyzes safety risks, weather concerns, seasonal warnings, transport disruptions, health precautions, packing checklist, budget risks, and local recommendations.
- Advisory is returned as structured JSON and included in the trip generation response and saved alongside the trip record.

API Changes
- POST `/api/trip/generate` — unchanged for clients; response now includes an `advisory` object when Foundry is configured.
- POST `/api/trip/advisory` — new route to run advisory analysis independently (protected by auth).

Environment Variables
- `GEMINI_API_KEY` — Gemini API key (itinerary generation)
- `FOUNDRY_API_KEY` — Foundry AI API key (advisory)
- `FOUNDRY_ENDPOINT` — Foundry API endpoint URL
- `OPENWEATHER_API_KEY`, `MYSQL_*`, `JWT_SECRET`, etc.

Frontend
- New component: `client/src/components/TravelRiskAdvisor.jsx` — displays risk level, alerts, packing checklist, budget warnings, transport warnings, and recommendations.
- Planner page (`client/src/pages/Planner.jsx`) now shows the advisory when available.

Security Note
- Do NOT expose `FOUNDRY_API_KEY` or `GEMINI_API_KEY` in client-side code. The chatbot component in the client currently reads `VITE_GEMINI_API_KEY` — consider proxying chatbot calls through the server to avoid exposing keys.

How it works
1. Client posts trip spec to `/api/trip/generate` with JWT.
2. Server calls Gemini 2.5 Flash to produce a structured itinerary.
3. Server calls Foundry IQ (if configured) to analyze the itinerary and returns a structured advisory JSON.
4. Server saves trip and advisory into the DB (or seeded storage) and returns the trip and advisory to the client.

Hackathon Note
- The new advisory feature is structured as a Reasoning Agent powered by Foundry IQ per Microsoft Agents League requirements.

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