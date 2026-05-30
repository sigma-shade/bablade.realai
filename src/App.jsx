import { useState, useEffect, useRef } from "react";
import { Analytics } from "@vercel/analytics/next"

export default function App() {

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const [showWarning, setShowWarning] = useState(true);
  
const messagesEndRef = useRef(null);
const usedResponses = useRef(new Set());

useEffect(() => {
  if (!showWarning) {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 6000);

    return () => clearTimeout(timer);
  }
}, [showWarning]);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages, typing]);

const responseData = {
  reactionPositive: [
  "Ohh nice.",
  "That's awesome.",
  "Ayy that's great.",
  "Love hearing that.",
  "That's genuinely good to hear.",
  "Nice one.",
  "That sounds pretty exciting."
],

reactionNegative: [
  "Ahh that's rough.",
  "Oof.",
  "That sounds difficult.",
  "Sorry you're dealing with that.",
  "That's not easy.",
  "That sounds frustrating.",
  "I can see why that would bother you."
],

empathyPositive: [
  "Sounds like things went well for you.",
  "Those kinds of days can really boost your mood.",
  "It's always nice when things fall into place.",
  "Moments like that can make a big difference.",
  "Sounds like today treated you well."
],

empathyNegative: [
  "That would've been hard for most people.",
  "Anyone would feel affected by that.",
  "That sounds emotionally draining.",
  "That can really stick with you.",
  "I can understand why that's been on your mind."
],

  greetings: [
    "Hey, it's good to hear from you.",
    "Welcome back.",
    "Hey there.",
    "Glad you stopped by.",
    "Nice seeing you again.",
    "Hey, how's everything going?",
    "What's been up lately?",
    "How's your day treating you?"
  ],

  positive: [
    "Ohh nice, that sounds like a really good day.",
    "That's awesome to hear honestly.",
    "Love hearing that.",
    "Ayy that's great.",
    "Sounds like things went pretty well.",
    "That's the kind of update I like hearing.",
    "Nice. Those kinds of days can really lift your mood.",
    "That's genuinely good to hear.",
    "Sounds like today had some good moments.",
    "I'm happy to hear things went well."
  ],

  positiveFollowUps: [
    "What ended up being the highlight?",
    "What made today better than usual?",
    "Anything specific put you in a good mood?",
    "Was it one big thing or lots of small wins?",
    "What happened?",
    "What part of the day stood out most?",
    "What are you happiest about today?"
  ],

  negative: [
    "Ahh, that's rough.",
    "That sounds like a difficult day.",
    "Sorry things haven't been going great.",
    "That honestly sounds exhausting.",
    "Oof, that's never fun.",
    "Sounds like you've had a lot on your plate.",
    "That would bring most people down.",
    "That sounds frustrating."
  ],

  negativeFollowUps: [
    "What happened?",
    "What made the day so difficult?",
    "Was it one thing or several things piling up?",
    "Do you want to talk about it?",
    "What part bothered you the most?",
    "How long has this been weighing on you?"
  ],

  stress: [
    "That sounds mentally exhausting.",
    "You've probably been carrying a lot lately.",
    "That kind of pressure can build up quietly.",
    "Sounds like your brain hasn't had much time to rest.",
    "That's a lot to deal with.",
    "Stress has a way of making everything feel heavier.",
    "You've got a lot on your shoulders right now."
  ],

  anxiety: [
    "Your mind sounds like it's moving a hundred miles an hour.",
    "Overthinking can be incredibly draining.",
    "That sounds stressful.",
    "It's hard when your thoughts won't slow down.",
    "Anxiety can make even small things feel huge.",
    "Sounds like your brain is stuck in overdrive."
  ],

  sad: [
    "That sounds really painful.",
    "I'm sorry you're dealing with that.",
    "That would've hurt a lot.",
    "That sounds emotionally heavy.",
    "I can understand why that would affect you.",
    "That doesn't sound easy at all."
  ],

  motivation: [
  "Small progress still counts.",
  "You don't have to get everything right immediately.",
  "Even tiny steps move you forward.",
  "Momentum matters more than perfection.",
  "You're probably capable of more than you think.",
  "Progress is still progress."
],

achievement: [
  "Wow, that's impressive.",
  "That's a huge accomplishment.",
  "You should be proud of that.",
  "Sounds like your hard work paid off.",
  "That's genuinely exciting.",
  "Nice work.",
  "That's a moment worth celebrating."
],

achievementFollowUps: [
  "How long were you working toward it?",
  "What was the hardest part?",
  "How did you feel when it happened?",
  "What's next for you now?",
  "Did you expect it?"
],

school: [
  "School can definitely be stressful sometimes.",
  "Sounds like you've got a lot going on academically.",
  "Exams can put a lot of pressure on people.",
  "That sounds like a busy schedule.",
  "Balancing everything isn't always easy."
],

schoolFollowUps: [
  "How are your exams going?",
  "Which subject has been the toughest?",
  "Are you feeling prepared?",
  "What's been stressing you out the most?",
  "How have you been managing it?"
],

default: [
  "I'm listening.",
  "Tell me a little more about that.",
  "That sounds important to you.",
  "Interesting. Go on.",
  "I'd like to hear more.",
  "What happened next?",
  "That sounds like it's been on your mind."
]
};

function getUniqueResponse(category) {
  const responses = responseData[category];

  const unused = responses.filter(
    r => !usedResponses.current.has(r)
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
    lower.includes("hey") ||
    lower.includes("yo")
  ) {
    return "greetings";
  }

  if (
  lower.includes("good") ||
  lower.includes("great") ||
  lower.includes("awesome") ||
  lower.includes("amazing") ||
  lower.includes("fantastic") ||
  lower.includes("happy") ||
  lower.includes("excited") ||
  lower.includes("wonderful") ||
  lower.includes("nice") ||
  lower.includes("cool") ||
  lower.includes("fun") ||
  lower.includes("glad") ||
  lower.includes("excellent") ||
  lower.includes("brilliant") ||
  lower.includes("perfect") ||
  lower.includes("love it") ||
  lower.includes("enjoyed") ||
  lower.includes("successful") ||
  lower.includes("went well") ||
  lower.includes("nice day") ||
  lower.includes("best day")
) {
  return "positive";
}
  if (
    lower.includes("bad") ||
    lower.includes("terrible") ||
    lower.includes("awful") ||
    lower.includes("worst") ||
    lower.includes("upset") ||
    lower.includes("angry") ||
    lower.includes("hate") ||
    lower.includes("annoyed")
  ) {
    return "negative";
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
    lower.includes("heartbroken")
  ) {
    return "sad";
  }

  if (
    lower.includes("anxiety") ||
    lower.includes("anxious") ||
    lower.includes("panic") ||
    lower.includes("overthinking") ||
    lower.includes("worried")
  ) {
    return "anxiety";
  }

  if (
    lower.includes("goal") ||
    lower.includes("motivate") ||
    lower.includes("productive") ||
    lower.includes("improve")
  ) {
    return "motivation";
  }

  if (
    lower.includes("won") ||
    lower.includes("first place") ||
    lower.includes("award") ||
    lower.includes("achievement") ||
    lower.includes("promotion") ||
    lower.includes("accomplished") ||
    lower.includes("success")
  ) {
    return "achievement";
  }

  if (
    lower.includes("school") ||
    lower.includes("college") ||
    lower.includes("test") ||
    lower.includes("teacher") ||
    lower.includes("homework") ||
    lower.includes("class")
  ) {
    return "school";
  }

  return "default";
}

  function sendMessage() {
  if (input.trim() === "") return;

  const currentInput = input;

  setMessages(prev => [
    ...prev,
    {
      sender: "user",
      text: currentInput
    }
  ]);

  setInput("");
  setTyping(true);

  const category = detectCategory(currentInput);

  setTimeout(() => {

    let reply = "";

    if (category === "positive") {
  reply =
    getUniqueResponse("reactionPositive") +
    " " +
    getUniqueResponse("empathyPositive") +
    " " +
    getUniqueResponse("positiveFollowUps");
}

    else if (category === "negative") {
  reply =
    getUniqueResponse("reactionNegative") +
    " " +
    getUniqueResponse("empathyNegative") +
    " " +
    getUniqueResponse("negativeFollowUps");
}

    else if (
      category === "stress" ||
      category === "sad" ||
      category === "anxiety" ||
      category === "motivation"
    ) {
      reply =
        getUniqueResponse(category);

      if (Math.random() > 0.4) {
        reply +=
          " " +
          getUniqueResponse("default");
      }
    }

    else if (category === "greetings") {
      reply =
        getUniqueResponse("greetings");
    }
    else if (
  category === "stress" ||
  category === "sad" ||
  category === "anxiety" ||
  category === "motivation"
) {
  reply =
    getUniqueResponse(category);

  if (Math.random() > 0.4) {
    reply +=
      " " +
      getUniqueResponse("default");
  }
}

else if (category === "achievement") {
  reply =
    getUniqueResponse("achievement") +
    " " +
    getUniqueResponse("achievementFollowUps");
}

else if (category === "school") {
  reply =
    getUniqueResponse("school") +
    " " +
    getUniqueResponse("schoolFollowUps");
}

else if (category === "greetings") {
  reply =
    getUniqueResponse("greetings");
}

    else {
      reply =
        getUniqueResponse("default");
    }

    setMessages(prev => [
      ...prev,
      {
        sender: "ai",
        text: reply
      }
    ]);

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