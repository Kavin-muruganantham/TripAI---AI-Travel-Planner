const axios = require('axios');

const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT;
const FOUNDRY_API_KEY = process.env.FOUNDRY_API_KEY;

const defaultFallback = () => ({
  riskLevel: 'unknown',
  keyAlerts: ['Advisory service unavailable. Proceed with caution.'],
  packingChecklist: [],
  healthPrecautions: [],
  budgetWarnings: [],
  transportWarnings: [],
  recommendations: [],
});

async function analyzeItinerary(itinerary, meta = {}) {
  if (!FOUNDRY_ENDPOINT || !FOUNDRY_API_KEY) {
    console.warn('⚠️ Foundry AI credentials missing');
    return defaultFallback();
  }

  try {
    const prompt = buildFoundryPrompt(itinerary, meta);

    const resp = await axios.post(
      FOUNDRY_ENDPOINT,
      { prompt, format: 'json' },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${FOUNDRY_API_KEY}`,
        },
        timeout: 20000,
      }
    );

    // Expect the Foundry service to return structured JSON matching our schema
    const data = resp.data;
    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Foundry returned unexpected data:', typeof data);
      return defaultFallback();
    }

    // Basic shape validation and safe defaults
    return {
      riskLevel: data.riskLevel || 'unknown',
      keyAlerts: Array.isArray(data.keyAlerts) ? data.keyAlerts : [],
      packingChecklist: Array.isArray(data.packingChecklist) ? data.packingChecklist : [],
      healthPrecautions: Array.isArray(data.healthPrecautions) ? data.healthPrecautions : [],
      budgetWarnings: Array.isArray(data.budgetWarnings) ? data.budgetWarnings : [],
      transportWarnings: Array.isArray(data.transportWarnings) ? data.transportWarnings : [],
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    };
  } catch (err) {
    console.error('❌ Foundry analysis failed:', err.message);
    return defaultFallback();
  }
}

function buildFoundryPrompt(itinerary, meta) {
  // Provide context and a strict JSON schema to Foundry IQ for reasoning
  const header = `You are Foundry IQ - a travel risk and advisory reasoning agent. Analyze the following trip itinerary and produce a JSON object with travel risks, alerts, packing checklist, health precautions, budget and transport warnings, and recommendations. Be concise and precise.`;

  const schema = `Return ONLY valid JSON with this shape:\n{\n  \"riskLevel\": \"low|medium|high|unknown\",\n  \"keyAlerts\": [string],\n  \"packingChecklist\": [string],\n  \"healthPrecautions\": [string],\n  \"budgetWarnings\": [string],\n  \"transportWarnings\": [string],\n  \"recommendations\": [string]\n}`;

  const metaText = meta.destination ? `Destination: ${meta.destination}\nDates: ${meta.startDate} to ${meta.endDate}\nBudget: ${meta.budget}` : '';

  const body = `ITINERARY_JSON:\n${JSON.stringify(itinerary)}`;

  return [header, metaText, schema, body].filter(Boolean).join('\n\n');
}

module.exports = { analyzeItinerary };
