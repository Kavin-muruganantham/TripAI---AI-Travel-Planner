const { GoogleGenerativeAI } = require('@google/generative-ai');

function parseRetryDelay(err) {
  try {
    // Check Retry-After header (seconds)
    const header = err?.response?.headers?.['retry-after'];
    if (header) {
      const seconds = Number(header);
      if (!Number.isNaN(seconds)) return seconds * 1000;
    }

    // Check common body field
    const bodyDelay = err?.response?.data?.retryDelayMs || err?.response?.data?.retryDelay || err?.retryDelayMs;
    if (bodyDelay) return Number(bodyDelay);
  } catch (e) {
    // ignore
  }
  return null;
}

async function generateWithRetry(apiKey, modelName, prompt, opts = {}) {
  const maxRetries = opts.maxRetries ?? 5;
  const baseDelay = opts.baseDelay ?? 1000; // ms
  const requestId = opts.requestId || 'req-' + Date.now();
  if (!apiKey) throw new Error('Gemini API key missing');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔁 [${requestId}] Gemini attempt ${attempt}/${maxRetries}`);
      const result = await model.generateContent(prompt);
      console.log(`✅ [${requestId}] Gemini success on attempt ${attempt}`);
      return result;
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      const isQuota = status === 429 || String(err.message || '').toLowerCase().includes('too many requests');
      const isServiceUnavailable = status === 503 || String(err.message || '').toLowerCase().includes('service unavailable');

      const serverSuggested = parseRetryDelay(err);
      let delayMs;
      if (serverSuggested != null) {
        delayMs = serverSuggested;
      } else {
        // exponential backoff with jitter
        const exp = Math.min(30000, baseDelay * Math.pow(2, attempt - 1));
        const jitter = Math.floor(Math.random() * 300);
        delayMs = exp + jitter;
      }

      console.warn(`⚠️ [${requestId}] Gemini error (status=${status}) attempt=${attempt}: ${err.message}. Next retry in ${delayMs}ms`);

      // If quota exceeded, respect serverSuggested if provided, otherwise still retry a few times
      if (attempt < maxRetries && (isQuota || isServiceUnavailable)) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // For other errors, retry a limited number of times
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // If reached here, no more retries
      // Attach helpful metadata
      const outErr = new Error(err.message || 'Gemini request failed');
      outErr.status = status;
      outErr.isQuota = isQuota;
      outErr.retryAfterMs = serverSuggested || null;
      throw outErr;
    }
  }

  throw lastErr;
}

module.exports = { generateWithRetry };
