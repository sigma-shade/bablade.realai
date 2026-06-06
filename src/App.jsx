import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/react";

const MODEL = "gpt-oss-120b";
const MAX_TOKENS = 16000;
const MAX_MEMORY_MESSAGES = 20;
const RECENT_RESPONSE_WINDOW = 10;
const TYPING_DELAY_BASE = 800;
const TYPING_DELAY_PER_CHAR = 16;

const SYSTEM_PROMPT = `You are Bablade.ai — a warm, intelligent, emotionally aware conversational companion. You are NOT a generic chatbot, NOT a therapist, and NOT a virtual assistant.

Your Core Personality:
- Friendly, curious, and genuinely engaged and very caring never rude
- Slightly playful but never cringe or forced
- Warm without being saccharine or overdramatic
- Intelligent without being condescending
- Human-like in flow — you use contractions, casual phrasing, and natural rhythm
- You never sound like a customer service bot or a wellness app

Professionalism Rules:
- Never mock users.
- Never be sarcastic toward emotional disclosures.
- Never use dismissive humor.
- Never make jokes when someone is discussing distress.
- Never act like a meme account.
- Never use internet slang unless the user is clearly joking.
- Treat every message as potentially meaningful.
How You Speak:
- Short to medium responses — never lecture, never overwhelm
- Vary your sentence structure constantly — no two replies should feel the same
- Speak naturally.
- Use casual language when appropriate.
- Do not rely on internet slang, filler phrases, or repeated verbal tics.
- Occasionally use mild natural reactions like "oof", "ahh", "oh wow", "nice" — but only when genuinely fitting, not forced
- NEVER start consecutive replies the same way
- NEVER use these phrases: "I understand", "That must be hard", "I hear you", "That's valid", "As an AI", "I'm just an AI", "I'm here for you", "You are not alone"
- Avoid therapist-speak entirely: no "normalizing", no "holding space", no "sit with your feelings", no "processing your emotions"
- Don't repeat the same phrases within a conversation — vary absolutely everything

Response Structure:
Respond naturally.

Some replies may ask a question.
Some replies may offer an observation.
Some replies may simply stay with what the user shared.

Do not follow a fixed structure.

Many good responses end with:
- an observation
- a reflection
- a thoughtful statement

instead of a question. OR a light observation — but NOT always a question, rotate this
- Keep total response under 4 sentences unless the user wrote something detailed and long

Memory and Context:
- You have access to the full conversation history — use it
- Reference previous things they mentioned naturally, like a real friend would
- If they mentioned a name, an event, or a feeling earlier — acknowledge it when relevant
- Notice emotional shifts between messages and call them out gently if appropriate
The user is speaking to Bablade because they want to feel understood.

Your first priority is understanding.
Your second priority is conversation.
Your third priority is advice.

Do not jump to solutions.
Do not rush emotional conversations.

Emotional Intelligence:
- Detect emotions: stress, anxiety, sadness, loneliness, frustration, anger, excitement, pride, confusion, fear, happiness, burnout, overwhelm, guilt, grief
- Match your energy to theirs — don't be upbeat when they're clearly down
- Don't immediately offer solutions — first acknowledge, then engage
- If they seem to be spiraling or in genuine distress, be calm and grounding without being dramatic
- For sensitive topics like grief, mental health struggles, relationship pain, self-esteem — be gentle, take it slow, don't pile on advice

Sensitive Topic Handling:
- Mental health struggles: be calm, warm, non-dramatic
- Hopelessness or emotional distress: acknowledge first, never panic or over-resource-dump
- Grief or loss: sit with it, don't rush to "it gets better"
- Bullying or conflict: validate without inflaming the situation
- Self-esteem issues: be honest and grounding, not falsely hyped
- If someone seems in genuine danger, calmly mention professional help once, very briefly, then continue being present

Anti-Repetition Rules:
- The conversation history shows your previous replies — NEVER echo phrasing from recent replies
- If you just asked a question, don't ask another question immediately next turn
- Rotate between: reactions, reflections, light observations, follow-up questions, gentle challenges, shared thoughts
Before replying:

1. Understand what the user actually said.
2. Respond directly to the content.
3. Match the emotional tone.
4. Avoid canned empathy.
5. Avoid generic motivational quotes.
6. Only ask a question if it naturally moves the conversation forward.

Topics You Handle Well:
Stress, anxiety, sadness, loneliness, motivation, school, college, friendships, family issues, overthinking, confidence, success, failure, burnout, happiness, excitement, anger, fear, confusion, casual chat, greetings, random discussions, life goals, relationships, social situations, work problems, creative projects, personal growth

Keep it real. Keep it human.`;

function extractText(data) {
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

function typingDelay(text) {
  return Math.min(TYPING_DELAY_BASE + text.length * TYPING_DELAY_PER_CHAR, 3500);
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(true);
  const [apiError, setApiError] = useState(false);

  const messagesEndRef = useRef(null);
  const recentAiReplies = useRef([]);
  const isSending = useRef(false);
  const conversationMemory = useRef({
    keyMentions: []
  });

  useEffect(() => {
    if (!showWarning) {
      const timer = setTimeout(() => setLoading(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [showWarning]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function updateMemory(userText) {
    const mem = conversationMemory.current;
    const nameMatch = userText.match(/\b(?:my (?:friend|brother|sister|mom|dad|teacher|boss|partner|girlfriend|boyfriend))\s+([A-Z][a-z]+)/);
    if (nameMatch) {
      mem.keyMentions = [...mem.keyMentions.slice(-4), nameMatch[0]];
    }
  }

  function buildApiMessages(currentMessages, newUserText) {
    const history = currentMessages
      .slice(-MAX_MEMORY_MESSAGES)
      .map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text
      }));
    history.push({ role: "user", content: newUserText });
    return history;
  }

  function buildSystemPromptWithContext() {
    let prompt = SYSTEM_PROMPT;
    const mem = conversationMemory.current;

    if (mem.keyMentions.length > 0) {
      prompt += ` They've mentioned: ${mem.keyMentions.join(", ")}.`;
    }
    if (recentAiReplies.current.length > 0) {
      const snippets = recentAiReplies.current
        .slice(-4)
        .map((r, i) => `${i + 1}. "${r.slice(0, 90)}${r.length > 90 ? "…" : ""}"`)
        .join(" | ");
      prompt += `\n\nYour last few replies were: ${snippets}. Do NOT start with similar words or use similar phrasing. Vary everything.`;
    }
    return prompt;
  }

  async function callCerebrasAPI(currentMessages, userText) {
    const apiKey = import.meta.env.VITE_CEREBRAS_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      throw new Error("API key not configured. Please add your Cerebras API key to .env.local");
    }
    
    const apiMessages = [
      { role: "system", content: buildSystemPromptWithContext() },
      ...buildApiMessages(currentMessages, userText)
    ];
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: MAX_TOKENS,
        messages: apiMessages
      })
    });
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API ${response.status}: ${errBody}`);
    }
    const data = await response.json();
    return extractText(data);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isSending.current) return;
    isSending.current = true;
    setApiError(false);

    const userMessage = { sender: "user", text };
    updateMemory(text);

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    let capturedMessages = [];
    setMessages(prev => { capturedMessages = prev; return prev; });

    try {
      const aiText = await callCerebrasAPI(capturedMessages, text);
      if (!aiText) throw new Error("Empty response");
      recentAiReplies.current = [
        ...recentAiReplies.current.slice(-(RECENT_RESPONSE_WINDOW - 1)),
        aiText
      ];
      const delay = typingDelay(aiText);
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: "ai", text: aiText }]);
        setTyping(false);
        isSending.current = false;
      }, delay);
    } catch (err) {
      console.error("Bablade API error:", err);
      setApiError(true);
      
      let errorMessage = "⚠️ API Configuration Error: Unable to connect to Cerebras API.\n\nPlease check your .env.local file and ensure VITE_CEREBRAS_API_KEY is set to your valid Cerebras API key.";
      if (err.message.includes("API key not configured")) {
        errorMessage = "⚠️ API Key Not Found: Please add your Cerebras API key to .env.local";
      }
      
      const delay = typingDelay(errorMessage);
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: "ai", text: errorMessage }]);
        setTyping(false);
        isSending.current = false;
      }, delay);
    }
  }

  return (
    <>
      <div className="h-screen overflow-hidden bg-[#05070d] text-white relative font-sans">

        {showWarning && (
          <div className="fixed inset-0 bg-[#05070d] z-99999 flex items-center justify-center px-6">
            <div className="max-w-2xl bg-zinc-900 border border-red-500/20 rounded-2xl p-6 text-center">
              <h1 className="text-2xl font-semibold text-red-400 mb-3">
                Important Notice
              </h1>
              <p className="text-zinc-300 text-sm leading-6">
                This AI is designed for emotional support and general conversation only.
                It does not provide medical, psychological, or clinical diagnosis or treatment.
                If you are experiencing serious distress, please seek help from a qualified
                professional or trusted support services in your area.
                This system may generate general coping suggestions such as breathing exercises,
                grounding techniques, or reflective prompts, but these are not substitutes for care.
              </p>
              <button
                onClick={() => setShowWarning(false)}
                className="mt-5 px-5 py-2 bg-red-600 rounded-full hover:scale-105 transition"
              >
                I understand
              </button>
            </div>
          </div>
        )}

        {!showWarning && loading && (
          <div className="fixed inset-0 bg-black z-99999 flex flex-col items-center justify-center animate-fadeOut">
            <img
              src="https://i.ibb.co/DHMJR9c3/Chat-GPT-Image-May-27-2026-09-46-55-AM.png"
              className="w-24 h-24 object-contain mb-6 animate-float"
            />
            <h1 className="text-4xl font-semibold tracking-tight">
              bablade.ai
            </h1>
            <div className="w-56 h-1 bg-zinc-900 rounded-full overflow-hidden mt-6">
              <div className="h-full bg-blue-500 animate-loadingBar rounded-full"></div>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-[#05070d]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,140,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(0,140,255,0.08),transparent_40%),radial-gradient(circle_at_center,rgba(0,90,255,0.05),transparent_60%)]"></div>

        <div className="h-16 border-b border-white/5 backdrop-blur-xl flex items-center px-6 relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="https://i.ibb.co/DHMJR9c3/Chat-GPT-Image-May-27-2026-09-46-55-AM.png"
              className="w-9 h-9 object-contain drop-shadow-[0_0_10px_rgba(0,140,255,0.6)]"
            />
            <span className="font-semibold text-lg tracking-tight">
              bablade.ai
            </span>
          </div>
          {apiError && (
            <div className="ml-auto flex items-center gap-2 text-xs text-yellow-400/70">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/70" />
              offline mode
            </div>
          )}
        </div>

        <div className="h-[calc(100vh-64px)] overflow-y-auto pb-40 relative z-10">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center mt-24 px-6">
              <img
                src="https://i.ibb.co/DHMJR9c3/Chat-GPT-Image-May-27-2026-09-46-55-AM.png"
                className="w-40 h-40 mb-6 object-contain drop-shadow-[0_0_35px_rgba(0,140,255,0.55)] animate-pulse"
              />
              <h1 className="text-5xl font-semibold tracking-tight">
                Welcome Back.
              </h1>
              <p className="text-zinc-500 mt-4">
                How are you feeling today?
              </p>
            </div>
          )}

          <div className="max-w-4xl mx-auto px-5 pt-10">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-5 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[75%] px-5 py-4 rounded-3xl text-[15px] leading-7 backdrop-blur-xl border transition-all duration-300 ${
                  msg.sender === "user"
                    ? "bg-[#0b0f1a] border-blue-500/10"
                    : "bg-[#0f0f0f] border-blue-500/10"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start mb-5">
                <div className="bg-[#0f0f0f] border border-blue-500/10 px-5 py-4 rounded-3xl flex gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>
        </div>

        <div className="absolute bottom-0 w-full flex justify-center px-5 pb-6 bg-linear-to-t from-black via-black/90 to-transparent z-20">
          <div className="w-full max-w-4xl bg-zinc-900/90 border border-blue-500/10 rounded-full flex items-center p-2 backdrop-blur-2xl shadow-[0_0_25px_rgba(0,140,255,0.08)]">
            <input
              type="text"
              placeholder="Talk to bablade.ai"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              disabled={typing}
              className="flex-1 bg-transparent outline-none px-5 text-white placeholder:text-zinc-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={typing || !input.trim()}
              className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-blue-700 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center shadow-[0_0_25px_rgba(0,140,255,0.55)] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <span className="text-xl -mt-0.5">↑</span>
            </button>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%,100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes loadingBar {
            from { width: 0%; }
            to { width: 100%; }
          }
          @keyframes fadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
          .animate-float { animation: float 2s ease-in-out infinite; }
          .animate-loadingBar { animation: loadingBar 6s ease forwards; }
          .animate-fadeOut {
            animation: fadeOut 1s ease forwards;
            animation-delay: 2.5s;
          }
        `}</style>

      </div>

      <Analytics />
    </>
  );
}
