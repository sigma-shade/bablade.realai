import { useState, useEffect, useRef } from "react";

export default function App() {

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showWarning, setShowWarning] = useState(true);

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
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("babladeMemory", JSON.stringify(memory));
  }, [memory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typing]);

  const responseData = {
    greetings: [
      "Hey, I'm here for you.",
      "It's good to hear from you.",
      "How has your day been feeling so far?",
      "Welcome back. How are things mentally today?",
      "Hey. What's been on your mind lately?"
    ],
    stress: [
      "That sounds mentally exhausting honestly.",
      "You've probably been carrying too much pressure lately.",
      "It's okay if your brain feels overloaded right now.",
      "Want to slow things down for a second together?",
      "You don't need to solve everything tonight."
    ],
    sad: [
      "That sounds really heavy emotionally.",
      "I'm listening.",
      "You don't have to pretend everything is okay here.",
      "That would've hurt anyone honestly.",
      "Want to talk more about what caused it?"
    ],
    anxiety: [
      "Your thoughts seem like they're moving really fast right now.",
      "Try not to fight every thought at once.",
      "Anxiety can make everything feel bigger than it actually is.",
      "Take things one step at a time.",
      "You don't need every answer immediately."
    ],
    motivation: [
      "Small progress still counts.",
      "You've already made it through difficult days before.",
      "Try focusing on momentum instead of perfection.",
      "Even tiny steps matter right now."
    ],
    default: [
      "I'm here with you.",
      "Tell me a little more about that.",
      "That sounds important to you.",
      "How long have you been feeling like this?",
      "I'm listening."
    ],
    followUps: [
      "Has this been bothering you for a while?",
      "What do you think affected you the most?",
      "Do you usually keep these feelings to yourself?",
      "Has your sleep been okay lately?",
      "What's been draining your energy the most recently?",
      "Do you feel like you've had enough time to mentally rest?",
      "Want to talk a little more about it?"
    ]
  };

  function getUniqueResponse(category) {
    const responses = responseData[category];

    const unused = responses.filter(
      response => !usedResponses.current.has(response)
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

    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
      return "greetings";
    }

    if (
      lower.includes("stress") ||
      lower.includes("tired") ||
      lower.includes("pressure") ||
      lower.includes("burnout") ||
      lower.includes("exam")
    ) {
      return "stress";
    }

    if (
      lower.includes("sad") ||
      lower.includes("hurt") ||
      lower.includes("cry") ||
      lower.includes("lonely") ||
      lower.includes("depressed")
    ) {
      return "sad";
    }

    if (
      lower.includes("anxiety") ||
      lower.includes("anxious") ||
      lower.includes("overthinking") ||
      lower.includes("panic") ||
      lower.includes("worried")
    ) {
      return "anxiety";
    }

    if (
      lower.includes("motivate") ||
      lower.includes("goal") ||
      lower.includes("productive") ||
      lower.includes("improve")
    ) {
      return "motivation";
    }

    return "default";
  }

  function sendMessage() {
    if (input.trim() === "") return;

    const currentInput = input;

    setMessages(prev => [...prev, { sender: "user", text: currentInput }]);
    setInput("");
    setTyping(true);

    const category = detectCategory(currentInput);

    setMemory(prev => ({
      ...prev,
      lastMood: category,
      lastTopic: currentInput
    }));

    setTimeout(() => {
      let reply = getUniqueResponse(category);

      if (memory.lastMood === category) {
        reply += " You've been feeling this way for a bit now.";
      }

      if (Math.random() > 0.5) {
        const randomFollowUp =
          responseData.followUps[
            Math.floor(Math.random() * responseData.followUps.length)
          ];
        reply += " " + randomFollowUp;
      }

      setMessages(prev => [...prev, { sender: "ai", text: reply }]);
      setTyping(false);

    }, 1200);
  }

  return (
    <div className="h-screen overflow-hidden bg-[#05070d] text-white relative font-sans">

      {/* WARNING SCREEN (blocks everything) */}
      {showWarning && (
        <div className="fixed inset-0 bg-[#05070d] z-99999 flex items-center justify-center px-6">
          <div className="max-w-2xl bg-zinc-900 border border-red-500/20 rounded-2xl p-6 text-center">

            <h1 className="text-2xl font-semibold text-red-400 mb-3">
              Important Notice
            </h1>

            <p className="text-zinc-300 text-sm leading-6">
              This AI is designed for emotional support and general conversation only.
              It does not provide medical, psychological, or clinical diagnosis or treatment.
              If you are experiencing serious distress, please seek help from a qualified professional or trusted support services in your area.
              This system may generate general coping suggestions such as breathing exercises, grounding techniques, or reflective prompts, but these are not substitutes for care.
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

      {/* LOADING SCREEN (only after warning closed) */}
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

      {/* background */}
      <div className="absolute inset-0 bg-[#05070d]"></div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,140,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(0,140,255,0.08),transparent_40%),radial-gradient(circle_at_center,rgba(0,90,255,0.05),transparent_60%)]"></div>
      {/* topbar */}
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

      </div>

      {/* messages */}
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

      {/* input */}
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
            className="flex-1 bg-transparent outline-none px-5 text-white placeholder:text-zinc-500"
          />

          <button
            onClick={sendMessage}
            className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-blue-700 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center shadow-[0_0_25px_rgba(0,140,255,0.55)]"
          >
            <span className="text-xl -mt-0.5">↑</span>
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

        .animate-float { animation: float 2s ease-in-out infinite; }
        .animate-loadingBar { animation: loadingBar 2.5s ease forwards; }
        .animate-fadeOut {
          animation: fadeOut 1s ease forwards;
          animation-delay: 2.5s;
        }
      `}</style>

    </div>
  );
}