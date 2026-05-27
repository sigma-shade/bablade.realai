import { useState, useEffect, useRef } from "react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ SAFE: disclaimer (NOT blocking UI anymore)
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const messagesEndRef = useRef(null);
  const usedResponses = useRef(new Set());

  const [memory, setMemory] = useState(() => {
    const saved = localStorage.getItem("babladeMemory");
    return saved
      ? JSON.parse(saved)
      : {
          lastMood: "",
          lastTopic: "",
        };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("babladeMemory", JSON.stringify(memory));
  }, [memory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // 🧠 CALM MODE DETECTOR
  function isCalmRequest(text) {
    const t = text.toLowerCase();
    return (
      t.includes("give me solutions") ||
      t.includes("what should i do") ||
      t.includes("help me") ||
      t.includes("fix me") ||
      t.includes("overwhelmed") ||
      t.includes("i can't handle") ||
      t.includes("i cant handle")
    );
  }

  function calmResponse() {
    return (
      "I hear you. Let’s slow things down.\n\n" +
      "Try this:\n" +
      "• Inhale for 4 seconds\n" +
      "• Hold for 4 seconds\n" +
      "• Exhale for 6–8 seconds\n\n" +
      "Do this a few times. You don’t need to solve everything right now — just the next small step."
    );
  }

  const responseData = {
    greetings: [
      "Hey, I'm here for you.",
      "How has your day been feeling?",
      "Welcome back. What's going on?",
    ],
    stress: [
      "That sounds mentally exhausting.",
      "You’ve been under a lot of pressure.",
      "It’s okay to slow down.",
    ],
    sad: [
      "That sounds really heavy.",
      "I’m listening.",
      "You don’t have to hold it in here.",
    ],
    anxiety: [
      "Your thoughts seem really fast right now.",
      "Let’s take it one step at a time.",
      "You don’t need all answers at once.",
    ],
    motivation: [
      "Small progress still counts.",
      "You’ve handled hard days before.",
    ],
    default: [
      "I’m here with you.",
      "Tell me more about it.",
      "I’m listening.",
    ],
    followUps: [
      "Has this been going on for a while?",
      "What’s been affecting you most?",
      "Do you want to talk more about it?",
    ],
  };

  function getUniqueResponse(category) {
    const responses = responseData[category];
    const unused = responses.filter(
      (r) => !usedResponses.current.has(r)
    );

    const pool = unused.length ? unused : responses;
    const chosen =
      pool[Math.floor(Math.random() * pool.length)];

    usedResponses.current.add(chosen);
    return chosen;
  }

  function detectCategory(text) {
    const t = text.toLowerCase();

    if (t.match(/hi|hello|hey/)) return "greetings";
    if (t.match(/stress|tired|burnout|exam/)) return "stress";
    if (t.match(/sad|cry|lonely|depressed/)) return "sad";
    if (t.match(/anxiety|panic|worried|overthinking/))
      return "anxiety";
    if (t.match(/motivat|goal|productive|improve/))
      return "motivation";

    return "default";
  }

  function sendMessage() {
    if (!input.trim()) return;

    const currentInput = input;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: currentInput },
    ]);

    setInput("");
    setTyping(true);

    const category = detectCategory(currentInput);

    setMemory((prev) => ({
      ...prev,
      lastMood: category,
      lastTopic: currentInput,
    }));

    setTimeout(() => {
      let reply;

      // 🧠 CALM MODE OVERRIDE
      if (isCalmRequest(currentInput)) {
        reply = calmResponse();
      } else {
        reply = getUniqueResponse(category);

        if (memory.lastMood === category) {
          reply += " You’ve been feeling this way recently.";
        }

        if (Math.random() > 0.5) {
          reply +=
            " " +
            responseData.followUps[
              Math.floor(
                Math.random() *
                  responseData.followUps.length
              )
            ];
        }
      }

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: reply },
      ]);

      setTyping(false);
    }, 1000);
  }

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden font-sans">

      {/* 🚨 NON-BLOCKING DISCLAIMER (safe version) */}
      {showDisclaimer && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] bg-zinc-900 border border-white/10 px-4 py-3 rounded-xl flex items-center gap-4 max-w-xl">
          <p className="text-xs text-zinc-300">
            This AI is for general support only and not medical advice.
          </p>

          <button
            onClick={() => setShowDisclaimer(false)}
            className="text-xs px-3 py-1 bg-blue-600 rounded-full"
          >
            OK
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center">
          <h1 className="text-3xl">bablade.ai</h1>
        </div>
      )}

      {/* CHAT AREA */}
      <div className="h-[calc(100vh-80px)] overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">

          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-3 flex ${
                m.sender === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl max-w-[75%] text-sm ${
                  m.sender === "user"
                    ? "bg-blue-600"
                    : "bg-zinc-800"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {typing && (
            <div className="text-zinc-400 text-sm">
              typing...
            </div>
          )}

          <div ref={messagesEndRef}></div>
        </div>
      </div>

      {/* INPUT */}
      <div className="absolute bottom-0 w-full p-3 bg-black border-t border-white/10">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            className="flex-1 bg-zinc-900 px-4 py-3 rounded-full outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && sendMessage()
            }
            placeholder="Talk to bablade.ai"
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 px-5 rounded-full"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}