import React, { useState } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import axios from 'axios';

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: 'Hello! I\'m your AI Travel Assistant. Ask me anything about travel planning! ✈️', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = input;
    setMessages((prev) => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      // Proxy request to server to avoid exposing API keys from client
      const requestId = `c-${Date.now()}`;
      console.log(`[${requestId}] Sending chat message to server`);
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
      const resp = await axios.post(`${apiBase}/chat/message`, { message: userMessage });
      if (resp?.data?.success) {
        setMessages((prev) => [...prev, { text: resp.data.reply, sender: 'bot' }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: resp?.data?.message || 'Chatbot error. Please try again later.', sender: 'bot' },
        ]);
      }
    } catch (error) {
      console.error('Chatbot proxy error:', error);
      const msg = error.response?.data?.message || 'Sorry, I encountered an error. Please try again later.';
      setMessages((prev) => [...prev, { text: msg, sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-xl pulse-glow'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-96 bg-white/95 backdrop-blur rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-blue-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 font-bold text-lg">
            🤖 AI Travel Assistant
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Typing...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything..."
              disabled={loading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
