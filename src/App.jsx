import { useState, useEffect, useRef } from "react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🧠 NEW: startup warning modal
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
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("babladeMemory", JSON.stringify(memory));
  }, [memory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // 🧠 CALM MODE KEYWORDS
  function isCalmRequest(text) {
    const t = text.toLowerCase();
    return (
      t.includes("give me solutions") ||
      t.includes("what should i do") ||
      t.includes("help me") ||
      t.includes("fix me") ||
      t.includes("i can't handle") ||
      t.includes("i cant handle") ||
      t.includes("overwhelmed")
    );
  }

  function calmResponse() {
    return (
      "I hear you. Let’s slow things down for a second.\n\n" +
      "Try this with me:\n" +
      "1) Inhale slowly for 4 seconds\n" +
      "2) Hold for 4 seconds\n" +
      "3) Exhale for 6–8 seconds\n\n" +
      "Do that a few times. You're not required to solve everything right now. " +
      "Just focus on the next small step, not the whole situation."
    );
  }

  const responseData = {
    greetings: [
      "Hey, I'm here for you.",
      "It's good to hear from you.",
      "How has your day been feeling so far?",
      "Welcome back. How are things mentally today?",
      "Hey. What's been on your mind lately?",
    ],

    stress: [
      "That sounds mentally exhausting honestly.",
      "You've probably been carrying too much pressure lately.",
      "It's okay if your brain feels overloaded right now.",
      "Want to slow things down for a second together?",
      "You don't need to solve everything tonight.",
    ],

    sad: [
      "That sounds really heavy emotionally.",
      "I'm listening.",
      "You don't have to pretend everything is okay here.",
      "That would've hurt anyone honestly.",
      "Want to talk more about what caused it?",
    ],

    anxiety: [
      "Your thoughts seem like they're moving really fast right now.",
      "Try not to fight every thought at once.",
      "Anxiety can make everything feel bigger than it actually is.",
      "Take things one step at a time.",
      "You don't need every answer immediately.",
    ],

    motivation: [
      "Small progress still counts.",
      "You've already made it through difficult days before.",
      "Try focusing on momentum instead of perfection.",
      "Even tiny steps matter right now.",
    ],

    default: [
      "I'm here with you.",
      "Tell me a little more about that.",
      "That sounds important to you.",
      "How long have you been feeling like this?",
      "I'm listening.",
    ],

    followUps: [
      "Has this been bothering you for a while?",
      "What do you think affected you the most?",
      "Do you usually keep these feelings to yourself?",
      "Has your sleep been okay lately?",
      "What's been draining your energy the most recently?",
      "Do you feel like you've had enough time to mentally rest?",
      "Want to talk a little more about it?",
    ],
  };

  function getUniqueResponse(category) {
    const responses = responseData[category];

    const unused = responses.filter(
      (r) => !usedResponses.current.has(r)
    );

    if (unused.length === 0) {
      usedResponses.current.clear();
      return responses[Math.floor(Math.random() * responses.length)];
    }

    const chosen =
      unused[Math.floor(Math.random() * unused.length)];

    usedResponses.current.add(chosen);
    return chosen;
  }

  function detectCategory(text) {
    const lower = text.toLowerCase();

    if (
      lower.includes("hello") ||
      lower.includes("hi") ||
      lower.includes("hey")
    ) return "greetings";

    if (
      lower.includes("stress") ||
      lower.includes("tired") ||
      lower.includes("pressure") ||
      lower.includes("burnout") ||
      lower.includes("exam")
    ) return "stress";

    if (
      lower.includes("sad") ||
      lower.includes("hurt") ||
      lower.includes("cry") ||
      lower.includes("lonely") ||
      lower.includes("depressed")
    ) return "sad";

    if (
      lower.includes("anxiety") ||
      lower.includes("anxious") ||
      lower.includes("overthinking") ||
      lower.includes("panic") ||
      lower.includes("worried")
    ) return "anxiety";

    if (
      lower.includes("motivate") ||
      lower.includes("goal") ||
      lower.includes("productive") ||
      lower.includes("improve")
    ) return "motivation";

    return "default";
  }

  function sendMessage() {
    if (input.trim() === "") return;

    const currentInput = input;

    const userMessage = {
      sender: "user",
      text: currentInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    setMemory((prev) => ({
      ...prev,
      lastMood: detectCategory(currentInput),
      lastTopic: currentInput,
    }));

    setTimeout(() => {
      let reply;

      // 🧠 CALM MODE OVERRIDE (IMPORTANT PART)
      if (isCalmRequest(currentInput)) {
        reply = calmResponse();
      } else {
        const category = detectCategory(currentInput);

        reply = getUniqueResponse(category);

        if (memory.lastMood === category) {
          reply += " You've been feeling this way for a bit now.";
        }

        const shouldAskFollowUp = Math.random() > 0.5;

        if (shouldAskFollowUp) {
          const randomFollowUp =
            responseData.followUps[
              Math.floor(Math.random() * responseData.followUps.length)
            ];
          reply += " " + randomFollowUp;
        }
      }

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: reply },
      ]);

      setTyping(false);
    }, 1200);
  }

  return (
    <div className="h-screen overflow-hidden bg-black text-white relative font-sans">

      {/* 🧠 DISCLAIMER MODAL */}
      {showDisclaimer && (
        <div className="fixed inset-0 bg-black/95 z-[99999] flex items-center justify-center px-6">
          <div className="max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl p-6 text-sm leading-6">
            <h2 className="text-xl font-semibold mb-4">
              Important Notice
            </h2>

            <p className="text-zinc-300">
              This AI is designed for conversational and emotional support purposes only.
              It does not provide medical, psychological, or clinical diagnosis or treatment.
              Any suggestions or responses should not be interpreted as professional advice.
              If you are experiencing serious distress or a mental health crisis, please seek
              help from a qualified professional or trusted support services in your area.
              This system may generate general coping suggestions such as breathing exercises,
              grounding techniques, or reflective prompts, but these are not substitutes for care.
            </p>

            <button
              onClick={() => setShowDisclaimer(false)}
              className="mt-5 px-5 py-2 bg-blue-600 rounded-full hover:scale-105 transition"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* loading screen */}
      {loading && (
        <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center animate-fadeOut">
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

      {/* rest stays SAME UI */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,140,255,0.08),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(0,140,255,0.06),transparent_25%)]"></div>

      {/* topbar */}
      <div className="h-16 border-b border-white/5 backdrop-blur-xl flex items-center px-6 relative z-10">
        <div className="flex items-center gap-3">
          <img
            src="https://i.ibb.co/DHMJR9c3/Chat-GPT-Image-May-27-2026-09-46-55-AM.png"
            className="w-9 h-9 object-contain"
          />
          <span className="font-semibold text-lg">
            bablade.ai
          </span>
        </div>
      </div>

      {/* messages */}
      <div className="h-[calc(100vh-64px)] overflow-y-auto pb-40 relative z-10">
        <div className="max-w-4xl mx-auto px-5 pt-10">

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-5 flex ${
                msg.sender === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div className="max-w-[75%] px-5 py-4 rounded-3xl bg-zinc-900 border border-white/5">
                {msg.text}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex justify-start mb-5">
              <div className="bg-zinc-900 px-5 py-4 rounded-3xl flex gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef}></div>
        </div>
      </div>

      {/* input */}
      <div className="absolute bottom-0 w-full flex justify-center px-5 pb-6">
        <div className="w-full max-w-4xl bg-zinc-900 rounded-full flex items-center p-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-transparent outline-none px-5"
          />
          <button
            onClick={sendMessage}
            className="w-12 h-12 bg-blue-600 rounded-full"
          >
            ↑
          </button>
        </div>
      </div>

      {/* animations */}
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
        .animate-float { animation: float 2s infinite; }
        .animate-loadingBar { animation: loadingBar 2.5s ease forwards; }
        .animate-fadeOut { animation: fadeOut 1s ease forwards; animation-delay: 2.5s; }
      `}</style>
    </div>
  );
}