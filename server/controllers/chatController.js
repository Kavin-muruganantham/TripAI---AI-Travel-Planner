const { generateWithRetry } = require('../utils/geminiClient');

exports.chatMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const requestId = `chat-${Date.now()}`;
    const prompt = `You are a helpful travel assistant. Respond concisely to the user message:\n\n${message}`;

    let result;
    try {
      result = await generateWithRetry(process.env.GEMINI_API_KEY, 'gemini-2.5-flash', prompt, { maxRetries: 4, requestId });
    } catch (err) {
      console.error('❌ Chat Gemini error:', err.message);
      if (err.isQuota || err.status === 429) {
        return res.status(429).json({ success: false, message: 'Gemini API quota temporarily exceeded. Please wait 30 seconds and try again.' });
      }
      return res.status(500).json({ success: false, message: 'Chat service temporarily unavailable.' });
    }

    const text = result.response.text();
    res.json({ success: true, reply: text });
  } catch (err) {
    console.error('❌ ChatController failed:', err.message);
    res.status(500).json({ success: false, message: 'Failed to process chat message' });
  }
};
