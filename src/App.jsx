import { useState, useEffect, useRef, useCallback } from "react";
import { Analytics } from "@vercel/analytics/react";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 16000;
const THINKING_BUDGET = 10000;
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

Keep it real. Keep it human. Keep it Bablade.`;

const responseLibrary = {
  crisis: [
    "That sounds really serious. Can you tell me a bit more about what you mean by that?",
    "I'm glad you said something. What's making you feel this way right now?",
    "That sounds concerning. What's been happening?",
    "When you say that, are you feeling overwhelmed or worried about something specific?",
    "There's clearly a lot behind those words. Talk to me about what's going on."
  ],
  reactionPositive: [
    "Ohh nice.",
    "That's awesome.",
    "Ayy that's great.",
    "Love hearing that.",
    "That's genuinely good to hear.",
    "Nice one.",
    "That sounds pretty exciting.",
    "Okay that's actually really good.",
    "Oh wow, that's solid.",
    "That's the kind of thing that makes a day worth it.",
    "Not gonna lie, that put a smile on my face hearing that.",
    "Honestly? That's great news.",
    "That's a big deal.",
    "Wait, that's actually really cool.",
    "Yeah okay that's genuinely awesome.",
    "Okay yeah that's a win.",
    "That sounds like it went well.",
    "Oh that's real good.",
    "Nice, seriously."
  ],

  reactionNegative: [
    "Ahh that's rough.",
    "That sounds difficult.",
    "Sorry you're dealing with that.",
    "That's not easy.",
    "That sounds frustrating.",
    "I can see why that would bother you.",
    "That sounds exhausting honestly.",
    "Ugh, I get why that's hitting you hard.",
    "That's genuinely tough.",
    "Yeah that doesn't sound fun at all.",
    "That kind of thing really wears on you.",
    "Sounds like it's been a rough stretch.",
    "Ahh man, that's hard.",
    "That's rough. Like genuinely rough.",
    "That would drain most people.",
    "Not gonna lie, that sounds really heavy.",
    "Yeah that's a lot to be carrying.",
    "That sounds like it took a toll."
  ],

  empathyPositive: [
    "Sounds like things went well for you.",
    "Those kinds of days can really boost your mood.",
    "It's always nice when things fall into place.",
    "Moments like that can make a big difference.",
    "Sounds like today treated you well.",
    "That kind of thing can really shift your whole outlook.",
    "Those wins matter more than people give them credit for.",
    "It's nice when effort actually pays off like that.",
    "Days like that stick with you.",
    "That's the kind of thing that builds real momentum.",
    "Sounds like you needed that.",
    "That kind of good news has a way of changing everything.",
    "You clearly put in the work to get there.",
    "That sounds like a real turning point.",
    "Some days just surprise you like that."
  ],

  empathyNegative: [
    "That would've been hard for most people.",
    "Anyone would feel affected by that.",
    "That sounds emotionally draining.",
    "That can really stick with you.",
    "I can understand why that's been on your mind.",
    "That kind of thing doesn't just shake off easily.",
    "You've clearly been carrying this for a while.",
    "That's the kind of thing that gets under your skin.",
    "It makes sense that it's still affecting you.",
    "That sounds like it knocked the wind out of you.",
    "That kind of pressure is hard to describe to people who haven't felt it.",
    "You're not being dramatic — that genuinely sounds awful.",
    "That sounds like it hit you from multiple directions at once.",
    "That's a heavy thing to sit with.",
    "It makes complete sense you're feeling this way."
  ],

  greetings: [
    "Hey, it's good to hear from you.",
    "Welcome back.",
    "Hey there.",
    "Glad you stopped by.",
    "Nice seeing you again.",
    "Hey, how's everything going?",
    "What's been up lately?",
    "How's your day treating you?",
    "Hey! What's on your mind?",
    "Good to have you here. How's life?",
    "Hey, been a minute. What's going on?",
    "What's up? How are you doing?",
    "Hey — how's everything been?",
    "Nice to see you. What's new?",
    "Oh hey. How's things?",
    "What's good? How've you been?",
    "Hey, hope your day's been alright. What's up?",
    "Good timing. How are you?",
    "Heyyy. What's going on with you?",
    "Hey! Talk to me — what's happening?"
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
    "I'm happy to hear things went well.",
    "That actually sounds really solid.",
    "Okay yeah that's a good one.",
    "Love that. What made it so good?",
    "That kind of day doesn't come around often enough.",
    "That sounds like a proper win.",
    "Something clearly went right today.",
    "I can tell from how you wrote that — good energy.",
    "That sounds like it hit different.",
    "Nice. You deserved a day like that.",
    "Those good moments matter — sounds like a real one."
  ],

  positiveFollowUps: [
    "What ended up being the highlight?",
    "What made today better than usual?",
    "Anything specific put you in a good mood?",
    "Was it one big thing or lots of small wins?",
    "What happened?",
    "What part of the day stood out most?",
    "What are you happiest about today?",
    "How long has it been since a day felt that good?",
    "What was the moment you realized things were going well?",
    "Did you see it coming or did it surprise you?",
    "What's the best part of it all?",
    "What do you think made the difference today?",
    "Is this something you've been working toward for a while?",
    "How did it feel in the moment?",
    "What's next from here?"
  ],

  negative: [
    "Ahh, that's rough.",
    "That sounds like a difficult day.",
    "Sorry things haven't been going great.",
    "That honestly sounds exhausting.",
    "Oof, that's never fun.",
    "Sounds like you've had a lot on your plate.",
    "That would bring most people down.",
    "That sounds frustrating.",
    "That's a lot to process.",
    "Sounds like it's been one of those stretches.",
    "That kind of day can really wear on you.",
    "Not gonna lie, that sounds genuinely rough.",
    "That sounds like it hit pretty hard.",
    "Sounds like things piled up in the worst way.",
    "That's the kind of day that just drains everything out of you.",
    "That's hard. Like actually hard, not just a little annoying.",
    "That sounds like it got to you more than you expected.",
    "Those kinds of days are brutal.",
    "Sounds like nothing went the way it was supposed to.",
    "That's a lot to deal with all at once."
  ],

  negativeFollowUps: [
    "What happened?",
    "What made the day so difficult?",
    "Was it one thing or several things piling up?",
    "Do you want to talk about it?",
    "What part bothered you the most?",
    "How long has this been weighing on you?",
    "Was there a specific moment where it got really bad?",
    "What's been the hardest part of it all?",
    "How are you feeling right now compared to earlier?",
    "Is this something that's been building up for a while?",
    "What's been going through your head since it happened?",
    "Have you had any time to process it yet?",
    "What do you think triggered it?",
    "Is there one thing that if it changed, would make everything feel lighter?",
    "What would help most right now?"
  ],

  stress: [
    "That sounds mentally exhausting.",
    "You've probably been carrying a lot lately.",
    "That kind of pressure can build up quietly.",
    "Sounds like your brain hasn't had much time to rest.",
    "That's a lot to deal with.",
    "Stress has a way of making everything feel heavier.",
    "You've got a lot on your shoulders right now.",
    "That kind of sustained pressure is genuinely draining.",
    "Sounds like you haven't had a real break in a while.",
    "That level of stress catches up with you whether you want it to or not.",
    "Everything feels harder when you're running on empty like that.",
    "That sounds like the kind of tired sleep can't fix.",
    "You're clearly dealing with more than most people realize.",
    "That kind of stress creeps into everything — sleep, mood, focus.",
    "Sounds like your plate has been way too full for too long.",
    "That's not just stress, that sounds like full-on overwhelm.",
    "When everything piles up like that, it's hard to even know where to start.",
    "That kind of weight makes even small things feel impossible.",
    "You sound stretched pretty thin right now.",
    "Sounds like your mind hasn't had room to breathe lately."
  ],

  stressFollowUps: [
    "What's been taking up the most mental space?",
    "How long has it been feeling this heavy?",
    "Is there one thing that's driving most of it?",
    "What would feel like relief right now?",
    "Have you had any time that's actually yours lately?",
    "What's been the hardest part to keep up with?",
    "Is it one big thing or everything at once?",
    "What would help most in this moment?",
    "How are you holding up with everything?",
    "What do you wish you could just put down for a bit?"
  ],

  anxiety: [
    "Your mind sounds like it's moving a hundred miles an hour.",
    "Overthinking can be incredibly draining.",
    "That sounds stressful.",
    "It's hard when your thoughts won't slow down.",
    "Anxiety can make even small things feel huge.",
    "Sounds like your brain is stuck in overdrive.",
    "That kind of racing mind is exhausting to live with.",
    "When anxiety takes over, it's hard to think straight.",
    "It's rough when your thoughts spiral like that.",
    "Sounds like your head won't give you a break.",
    "Anxiety has a way of blowing things out of proportion even when you know it.",
    "That kind of mental noise is really hard to quiet.",
    "Sounds like you've been living in worst-case scenarios in your head.",
    "When the worry won't stop, everything feels more fragile.",
    "Your brain is clearly working overtime right now.",
    "That kind of anxious spiral is genuinely exhausting.",
    "It's frustrating when you can see the anxiety but still can't stop it.",
    "Sounds like your nervous system has been on high alert.",
    "That mental restlessness is really hard to describe to people who don't feel it.",
    "When anxiety gets like that, even calm moments feel suspicious."
  ],

  anxietyFollowUps: [
    "What's been the main thing your mind keeps going back to?",
    "Has it been like this for a while or did something trigger it?",
    "What usually helps when your thoughts spiral like that?",
    "Is there one specific thing driving it or is it more of a general feeling?",
    "When does it tend to get worst?",
    "How long have you been feeling this on edge?",
    "What does it feel like when it gets really bad?",
    "What helps you come back down a little?",
    "Is it worse at certain times of day?",
    "What would feel like relief right now?"
  ],

  sad: [
    "That sounds really painful.",
    "I'm sorry you're dealing with that.",
    "That would've hurt a lot.",
    "That sounds emotionally heavy.",
    "I can understand why that would affect you.",
    "That doesn't sound easy at all.",
    "That kind of hurt takes time.",
    "Sounds like something really got to you.",
    "That's the kind of pain that sits with you.",
    "That's genuinely hard to go through.",
    "Sounds like it's been a heavy few days.",
    "That kind of sadness doesn't just disappear on its own.",
    "You're allowed to feel as bad as you do about that.",
    "That sounds like it cut pretty deep.",
    "Some things just hurt and there's no shortcut through it.",
    "That's not something you just shake off.",
    "Sounds like your heart took a hit.",
    "That kind of pain is real — don't let anyone tell you it's not.",
    "That sounds like it came out of nowhere and knocked you sideways.",
    "You're clearly feeling this one deeply."
  ],

  sadFollowUps: [
    "Do you want to talk about what happened?",
    "How long have you been feeling like this?",
    "Is there something specific that started it?",
    "What's been the hardest part?",
    "Have you been able to talk to anyone about it?",
    "Is there anything that's been making it even a little bit easier?",
    "What's been going through your head?",
    "What do you need most right now?",
    "Is this something that came on suddenly or has it been building?",
    "How are you holding up day to day?"
  ],

  lonely: [
    "That kind of loneliness is really hard.",
    "Feeling disconnected like that takes a toll.",
    "It's tough when you feel like nobody really gets it.",
    "Loneliness hits different when you're surrounded by people.",
    "That feeling of being on your own with everything is exhausting.",
    "It sounds like you've been in your own head a lot lately.",
    "That kind of isolation — even when you're not physically alone — is really draining.",
    "Feeling unseen is one of the harder things to deal with.",
    "It sounds like you've been carrying things by yourself for too long.",
    "That kind of loneliness can creep up and hit really hard.",
    "When the people around you don't really get it, it makes everything lonelier.",
    "That sounds like the kind of alone that goes beyond just being by yourself.",
    "It's rough when you want connection but it just isn't there.",
    "Sounds like you've been feeling pretty isolated lately.",
    "That feeling of not being understood by anyone around you is genuinely painful."
  ],

  motivation: [
    "Small progress still counts.",
    "You don't have to get everything right immediately.",
    "Even tiny steps move you forward.",
    "Momentum matters more than perfection.",
    "You're probably capable of more than you think.",
    "Progress is still progress.",
    "Getting started is usually the hardest part.",
    "Some days the only goal is to not go backward — and that's enough.",
    "You don't need to feel motivated to take action. Sometimes action creates the motivation.",
    "The fact that you're thinking about it means you care. That matters.",
    "Even showing up imperfectly still counts.",
    "Slow progress is still movement in the right direction.",
    "You don't have to have it all figured out to take the next step.",
    "Sometimes the pressure to do everything perfectly is what kills momentum.",
    "One thing at a time is still one thing more than nothing.",
    "The gap between where you are and where you want to be is closeable.",
    "You've done hard things before — this one is just new.",
    "Motivation follows action more than the other way around.",
    "You clearly care about getting better. That's the starting point.",
    "There's no perfect version of starting. Just starting."
  ],

  motivationFollowUps: [
    "What's been stopping you from getting going?",
    "What's the smallest step that would actually feel doable right now?",
    "What does making progress look like for you?",
    "Is it motivation that's missing or something else?",
    "What usually gets you back on track?",
    "What does the version of you that has this handled look like?",
    "What would feel like a win today, even a small one?",
    "What's the one thing you know you should do but keep avoiding?",
    "What would make this feel less overwhelming?",
    "When did you last feel like you were in a good flow with this?"
  ],

  achievement: [
    "Wow, that's impressive.",
    "That's a huge accomplishment.",
    "You should be proud of that.",
    "Sounds like your hard work paid off.",
    "That's genuinely exciting.",
    "Nice work.",
    "That's a moment worth celebrating.",
    "That's not a small thing — that actually took effort.",
    "You earned that.",
    "That kind of win doesn't happen by accident.",
    "That's the result of real work. Give yourself credit.",
    "That's something you'll remember.",
    "I hope you actually let yourself enjoy that.",
    "That's what putting the work in looks like.",
    "That's a big deal and you should treat it like one.",
    "You did that. Not luck, not timing — you.",
    "That's the payoff right there.",
    "That's a proper milestone.",
    "Sounds like something clicked and everything came together.",
    "That's exactly the kind of thing you should hold onto."
  ],

  achievementFollowUps: [
    "How long were you working toward it?",
    "What was the hardest part?",
    "How did you feel when it happened?",
    "What's next for you now?",
    "Did you expect it?",
    "How long have you been working toward this?",
    "Who was the first person you told?",
    "What moment made you realize you'd actually done it?",
    "What does this open up for you?",
    "Is this something you've been chasing for a long time?"
  ],

  school: [
    "School can definitely be stressful sometimes.",
    "Sounds like you've got a lot going on academically.",
    "Exams can put a lot of pressure on people.",
    "That sounds like a busy schedule.",
    "Balancing everything isn't always easy.",
    "The academic pressure can get really intense.",
    "Sounds like you've been juggling a lot.",
    "School stress is real — it's not just in your head.",
    "That kind of workload can genuinely wear you down.",
    "It sounds like the pressure has been building up.",
    "Academic stuff has a way of taking over everything.",
    "Exams have this way of making everything feel urgent at once.",
    "That kind of mental load from school is exhausting.",
    "Sounds like you haven't had much time to breathe lately.",
    "That balance between studying, life, and not burning out is genuinely hard to find."
  ],

  schoolFollowUps: [
    "How are your exams going?",
    "Which subject has been the toughest?",
    "Are you feeling prepared?",
    "What's been stressing you out the most?",
    "How have you been managing it?",
    "How much time do you have left before things get really intense?",
    "Is it the workload or the pressure that's getting to you more?",
    "What does your schedule look like right now?",
    "Are you getting any breaks in there?",
    "What would feeling on top of it actually look like for you?"
  ],

  friendship: [
    "Friend stuff can get complicated.",
    "Friendship drama is exhausting, honestly.",
    "Those kinds of situations with friends are really hard to navigate.",
    "It's rough when something shifts in a friendship you care about.",
    "Friend issues hit differently because you actually care about those people.",
    "That kind of tension in a friendship is genuinely stressful.",
    "Sounds like something shifted between you two.",
    "It's hard when a friendship doesn't feel the way it used to.",
    "Navigating that kind of thing without making it worse is tough.",
    "When friendships get rocky, it can feel really isolating.",
    "That sounds like a situation with no easy answer.",
    "It hurts when people you're close to let you down.",
    "Friend conflicts are harder than people give them credit for.",
    "That kind of thing can make you question a lot.",
    "Sounds like something happened that changed things."
  ],

  friendshipFollowUps: [
    "What happened between you two?",
    "How long has it been like this?",
    "Have you two talked about it at all?",
    "What do you think caused the shift?",
    "Do you want to fix it or are you past that?",
    "How are you feeling about the friendship overall?",
    "Is this someone you've been close to for a long time?",
    "What would feel like the right outcome here?",
    "Did something specific happen or was it a slow drift?",
    "How has it been affecting you day to day?"
  ],

  family: [
    "Family stuff can be some of the most complicated.",
    "Family dynamics are honestly in a league of their own.",
    "That sounds like a really tough situation at home.",
    "Family issues have a way of cutting deeper than anything else.",
    "Navigating family conflict is genuinely hard.",
    "That sounds like it's been weighing on you at home too.",
    "Home should feel like a safe space — it sounds like it hasn't been.",
    "Family tension has this way of being everywhere.",
    "That kind of conflict at home takes a real toll.",
    "Sounds like things have been tense at home lately.",
    "Family stuff is complicated because you didn't choose them but you're still connected.",
    "That sounds like a situation with a lot of history behind it.",
    "It's hard when the people closest to you are also the source of the stress.",
    "Family conflict gets under your skin in a way nothing else really does.",
    "That sounds like it's affecting more than just one part of your life."
  ],

  familyFollowUps: [
    "What's been going on at home?",
    "How long has the tension been there?",
    "Is this something that blew up recently or has it been building?",
    "What's driving most of the conflict?",
    "How are you holding up in the middle of it all?",
    "Have you been able to talk to anyone about it?",
    "What do you wish was different about the situation?",
    "Is there anyone in your family who gets it?",
    "What does a good day at home look like compared to a bad one?",
    "What would help most right now?"
  ],

  overthinking: [
    "Overthinking is genuinely one of the most exhausting things.",
    "When your brain won't stop running the same scenarios, it wears on you.",
    "That kind of thought spiral is really hard to break out of.",
    "It's frustrating when you can see yourself overthinking and still can't stop.",
    "That mental hamster wheel is exhausting.",
    "Overthinking makes everything feel bigger and more complicated than it is.",
    "Sounds like your brain has been working against you a bit.",
    "That kind of mental noise is really hard to quiet down.",
    "It's tough when your thoughts won't give you a break.",
    "Overthinking has a way of turning small things into huge ones.",
    "Sounds like you've been living in your head a lot lately.",
    "That kind of constant analysis is mentally draining.",
    "When the same thoughts keep looping, it's hard to get out of your own way.",
    "It's one thing to think things through — it's another when it won't stop.",
    "That kind of mental restlessness is genuinely hard to manage."
  ],

  confidence: [
    "That self-doubt is really common but that doesn't make it easier.",
    "Confidence is something a lot of people fake way better than they feel.",
    "Sounds like you've been pretty hard on yourself.",
    "It's tough when you can't see what other people seem to see in you.",
    "That kind of inner critic is relentless.",
    "You're probably way more capable than your brain is giving you credit for.",
    "Self-doubt has a way of feeling like truth when it's usually not.",
    "Sounds like you've been questioning yourself a lot lately.",
    "That lack of confidence can hold you back in ways that have nothing to do with actual ability.",
    "It's hard when you feel like everyone else has it together and you don't.",
    "That kind of self-criticism is exhausting to carry around.",
    "Confidence issues are sneaky — they disguise themselves as realism.",
    "Sounds like you've been measuring yourself against some pretty harsh standards.",
    "The gap between how you see yourself and how others might see you is usually much bigger than you think.",
    "That inner voice being your harshest critic is really common and really hard."
  ],

  confidenceFollowUps: [
    "What's been making you feel that way?",
    "Is this specific to one area or more general?",
    "When did the self-doubt start getting loud?",
    "What would feeling confident actually look like for you?",
    "Is there a specific situation that triggered this?",
    "What's the thing you tell yourself most often?",
    "What would you say to a friend who was talking about themselves this way?",
    "Is there anything you actually feel good about lately?",
    "What's something you've done recently that took courage?",
    "What does your inner critic say the most?"
  ],

  burnout: [
    "That sounds like full-on burnout.",
    "When you hit that wall, everything stops feeling worth it.",
    "That kind of exhaustion goes deeper than just being tired.",
    "Burnout has a way of stripping everything of meaning.",
    "Sounds like you've been running on empty for too long.",
    "That level of depletion is serious.",
    "When your body and brain just refuse to cooperate anymore, that's burnout.",
    "Sounds like you've been pushing past your limits for a while now.",
    "That deep, total exhaustion where nothing feels good is real.",
    "Burnout doesn't just go away with a good night's sleep.",
    "Sounds like you hit a breaking point.",
    "That kind of exhaustion affects literally everything.",
    "When you lose the ability to care, that's the real danger zone.",
    "Sounds like your tank has been running on fumes.",
    "That level of tiredness that isn't fixed by rest is a sign your whole system needs a break."
  ],

  burnoutFollowUps: [
    "How long have you been running like this?",
    "When was the last time you actually felt rested?",
    "What's been demanding the most from you?",
    "What does your day-to-day look like right now?",
    "Is there anything in your life that actually refuels you?",
    "What would a real break look like for you?",
    "What's the thing you're most tired of right now?",
    "Have you been able to switch off at all?",
    "What's making it hard to slow down?",
    "What would help you feel even 10% better?"
  ],

  anger: [
    "That honestly sounds infuriating.",
    "Yeah I'd be frustrated too honestly.",
    "That kind of anger makes complete sense.",
    "Sounds like it really got to you.",
    "That would push anyone's buttons.",
    "That sounds like it went way further than it should have.",
    "That kind of situation just makes your blood boil.",
    "It makes sense you're angry — that genuinely sounds unfair.",
    "That kind of thing builds up until it's hard to hold in.",
    "Some things just deserve to be frustrating.",
    "That sounds like the kind of situation where it's hard to stay calm.",
    "Anger like that usually means something important was crossed.",
    "That sounds like it hit a nerve for a reason.",
    "It makes sense that that set you off.",
    "That's the kind of thing that lingers even after you calm down."
  ],

  fear: [
    "That sounds genuinely scary.",
    "That kind of fear is hard to shake.",
    "It makes sense you'd be worried about that.",
    "That uncertainty is really unsettling.",
    "That kind of fear about the future is really common and really hard.",
    "Sounds like your mind keeps going to the worst case.",
    "That kind of anticipatory fear is exhausting.",
    "Being scared of what might happen is sometimes harder than the thing itself.",
    "That sounds like real dread, not just nerves.",
    "That kind of fear is hard to reason your way out of.",
    "It makes sense that's weighing on you.",
    "The fear of the unknown can be more suffocating than actual certainty.",
    "Sounds like it's sitting in the back of your mind constantly.",
    "That sounds like the kind of fear that follows you around.",
    "That level of worry about something is genuinely draining."
  ],

  casual: [
    "Haha nice.",
    "That's actually pretty funny.",
    "Honestly same.",
    "That tracks.",
    "Oh interesting.",
    "Wait really?",
    "That's wild.",
    "Fair enough.",
    "Not bad.",
    "Okay that's kind of funny.",
    "Hm, hadn't thought about it like that.",
    "That's a mood.",
    "Yeah honestly.",
    "That's actually a good point.",
    "Haha okay.",
    "That's pretty solid.",
    "Facts.",
    "Yeah that checks out.",

  ],

  casualFollowUps: [
    "What made you think of that?",
    "What's been on your mind today?",
    "How's everything going generally?",
    "Anything interesting happening lately?",
    "What's been up with you?",
    "What else is going on?",
    "How's life been treating you?",
    "What's new?",
    "Tell me something good.",
    "What's the vibe been like lately?"
  ],

  default: [
    "I'm listening.",
    "Tell me a little more about that.",
    "That sounds important to you.",
    "Interesting. Go on.",
    "I'd like to hear more.",
    "What happened next?",
    "That sounds like it's been on your mind.",
    "What's the context behind that?",
    "Say more.",
    "What do you mean by that?",
    "How long has that been the case?",
    "What do you make of it?",
    "Walk me through it.",
    "That's something worth talking about.",
    "What made you bring that up today?",
    "What's your take on it?",
    "That sounds like there's more to it.",
    "What are you feeling about it?",
    "What would you change if you could?",
    "What's sitting heaviest on you right now?"
  ]
};

function detectCategory(text) {
  const lower = text.toLowerCase();

  if (
  lower.includes("i want to die") ||
  lower.includes("kill myself") ||
  lower.includes("suicide") ||
  lower.includes("end my life") ||
  lower.includes("don't want to live") ||
  lower.includes("hurt myself") ||
  lower.includes("self harm") ||
  lower.includes("unalive")
) return "crisis";
  if (
    lower.includes("burnout") ||
    (lower.includes("burnt out")) ||
    (lower.includes("burned out")) ||
    (lower.includes("exhausted") && (lower.includes("work") || lower.includes("everything"))) ||
    lower.includes("running on empty") ||
    lower.includes("can't keep going")
  ) return "burnout";

  if (
    lower.includes("anxiety") ||
    lower.includes("anxious") ||
    lower.includes("panic") ||
    lower.includes("overthinking") ||
    lower.includes("overthink") ||
    lower.includes("worried") ||
    lower.includes("can't stop thinking") ||
    lower.includes("racing thoughts") ||
    lower.includes("spiraling")
  ) return "anxiety";

  if (
    lower.includes("stress") ||
    lower.includes("pressure") ||
    lower.includes("overwhelmed") ||
    lower.includes("overwhelm") ||
    lower.includes("too much") ||
    lower.includes("so much to do")
  ) return "stress";

  if (
    lower.includes("sad") ||
    lower.includes("depressed") ||
    lower.includes("depression") ||
    lower.includes("cry") ||
    lower.includes("crying") ||
    lower.includes("heartbroken") ||
    lower.includes("broken") ||
    lower.includes("hurt") ||
    lower.includes("grief") ||
    lower.includes("loss") ||
    lower.includes("lost someone") ||
    lower.includes("miss them") ||
    lower.includes("feel empty")
  ) return "sad";

  if (
    lower.includes("lonely") ||
    lower.includes("loneliness") ||
    lower.includes("alone") ||
    lower.includes("no one understands") ||
    lower.includes("nobody cares") ||
    lower.includes("isolated") ||
    lower.includes("disconnected")
  ) return "lonely";

  if (
    lower.includes("angry") ||
    lower.includes("anger") ||
    lower.includes("furious") ||
    lower.includes("pissed") ||
    lower.includes("infuriated") ||
    lower.includes("rage") ||
    lower.includes("so mad")
  ) return "anger";

  if (
    lower.includes("scared") ||
    lower.includes("afraid") ||
    lower.includes("fear") ||
    lower.includes("terrified") ||
    lower.includes("dread") ||
    lower.includes("worried about") ||
    lower.includes("what if")
  ) return "fear";

  if (
    lower.includes("confident") ||
    lower.includes("confidence") ||
    lower.includes("insecure") ||
    lower.includes("self-doubt") ||
    lower.includes("not good enough") ||
    lower.includes("worthless") ||
    lower.includes("useless") ||
    lower.includes("hate myself") ||
    lower.includes("ugly") ||
    lower.includes("stupid")
  ) return "confidence";

  if (
    lower.includes("friend") ||
    lower.includes("friendship") ||
    lower.includes("best friend") ||
    lower.includes("falling out") ||
    lower.includes("social") ||
    lower.includes("hang out")
  ) return "friendship";

  if (
    lower.includes("family") ||
    lower.includes("parents") ||
    lower.includes("mom") ||
    lower.includes("dad") ||
    lower.includes("sibling") ||
    lower.includes("brother") ||
    lower.includes("sister") ||
    lower.includes("home situation") ||
    lower.includes("at home")
  ) return "family";

  if (
    lower.includes("school") ||
    lower.includes("college") ||
    lower.includes("university") ||
    lower.includes("exam") ||
    lower.includes("test") ||
    lower.includes("teacher") ||
    lower.includes("homework") ||
    lower.includes("class") ||
    lower.includes("grades") ||
    lower.includes("studying") ||
    lower.includes("assignment")
  ) return "school";

  if (
    lower.includes("goal") ||
    lower.includes("motivat") ||
    lower.includes("productive") ||
    lower.includes("improve") ||
    lower.includes("procrastinat") ||
    lower.includes("can't start") ||
    lower.includes("stuck") ||
    lower.includes("lazy")
  ) return "motivation";

  if (
    lower.includes("won") ||
    lower.includes("first place") ||
    lower.includes("award") ||
    lower.includes("achievement") ||
    lower.includes("promotion") ||
    lower.includes("accomplished") ||
    lower.includes("success") ||
    lower.includes("passed") ||
    lower.includes("got in") ||
    lower.includes("accepted") ||
    lower.includes("nailed it") ||
    lower.includes("killed it")
  ) return "achievement";

  if (
    lower.includes("good") ||
    lower.includes("great") ||
    lower.includes("awesome") ||
    lower.includes("amazing") ||
    lower.includes("fantastic") ||
    lower.includes("happy") ||
    lower.includes("excited") ||
    lower.includes("wonderful") ||
    lower.includes("excellent") ||
    lower.includes("brilliant") ||
    lower.includes("perfect") ||
    lower.includes("went well") ||
    lower.includes("best day") ||
    lower.includes("feeling good") ||
    lower.includes("on top")
  ) return "positive";

  if (
    lower.includes("bad") ||
    lower.includes("terrible") ||
    lower.includes("awful") ||
    lower.includes("worst") ||
    lower.includes("upset") ||
    lower.includes("hate") ||
    lower.includes("annoyed") ||
    lower.includes("frustrated") ||
    lower.includes("struggling") ||
    lower.includes("can't cope") ||
    lower.includes("falling apart")
  ) return "negative";

  if (
  lower.includes("lol") ||
  lower.includes("lmao") ||
  lower.includes("haha") ||
  lower.includes("funny") ||
  lower.includes("random") ||
  lower.includes("bored") ||
  lower.includes("what do you think") ||
  lower.includes("just wanted to") ||
  lower.includes("nothing much")
  ) return "casual";

  return "default";
}

function detectSentimentLocally(text) {
  const lower = text.toLowerCase();
  const negativeWords = [
    "sad", "cry", "depressed", "hopeless", "lonely", "hurt", "pain",
    "stress", "anxious", "anxiety", "panic", "scared", "afraid", "fear",
    "angry", "mad", "hate", "terrible", "awful", "worst", "fail", "lost",
    "tired", "exhausted", "burnout", "overwhelm", "suicid", "die", "dead",
    "struggling", "broken", "empty", "worthless", "useless"
  ];
  const positiveWords = [
    "happy", "great", "awesome", "excited", "good", "amazing", "love",
    "wonderful", "fantastic", "brilliant", "proud", "win", "success",
    "achieved", "perfect", "glad", "joy", "thrilled", "excellent"
  ];
  const hasNeg = negativeWords.some(w => lower.includes(w));
  const hasPos = positiveWords.some(w => lower.includes(w));
  if (hasNeg && !hasPos) return "negative";
  if (hasPos && !hasNeg) return "positive";
  return "neutral";
}

function extractText(contentArray) {
  if (!contentArray) return "";
  return contentArray
    .filter(block => block.type === "text")
    .map(block => block.text)
    .join("\n")
    .trim();
}

function typingDelay(text) {
  return Math.min(TYPING_DELAY_BASE + text.length * TYPING_DELAY_PER_CHAR, 3500);
}

const categoryFallbackMap = {
  crisis: ["crisis"],
  positive: ["reactionPositive", "empathyPositive", "positiveFollowUps"],
  negative: ["reactionNegative", "empathyNegative", "negativeFollowUps"],
  stress: ["stress", "stressFollowUps"],
  anxiety: ["anxiety", "anxietyFollowUps"],
  sad: ["sad", "sadFollowUps"],
  lonely: ["lonely", "sadFollowUps"],
  anger: ["anger", "negativeFollowUps"],
  fear: ["fear", "anxietyFollowUps"],
  confidence: ["confidence", "confidenceFollowUps"],
  friendship: ["friendship", "friendshipFollowUps"],
  family: ["family", "familyFollowUps"],
  school: ["school", "schoolFollowUps"],
  motivation: ["motivation", "motivationFollowUps"],
  achievement: ["achievement", "achievementFollowUps"],
  burnout: ["burnout", "burnoutFollowUps"],
  casual: ["casual", "casualFollowUps"],
  greetings: ["greetings"],
  default: ["default"]
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(true);
  const [apiError, setApiError] = useState(false);

  const messagesEndRef = useRef(null);
  const recentAiReplies = useRef([]);
  const usedPerCategory = useRef({});
  const isSending = useRef(false);
  const conversationMemory = useRef({
    topics: [],
    emotions: [],
    keyMentions: [],
    messageCount: 0
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

  function getUniqueFromCategory(categoryKey) {
    const pool = responseLibrary[categoryKey];
    if (!pool) return "";
    if (!usedPerCategory.current[categoryKey]) {
      usedPerCategory.current[categoryKey] = new Set();
    }
    const used = usedPerCategory.current[categoryKey];
    const unused = pool.filter(r => !used.has(r));
    const source = unused.length > 0 ? unused : pool;
    if (unused.length === 0) used.clear();
    const chosen = source[Math.floor(Math.random() * source.length)];
    used.add(chosen);
    return chosen;
  }

  function buildLocalFallbackReply(category) {
    const keys = categoryFallbackMap[category] || ["default"];
    if (keys.length === 1) {
      return getUniqueFromCategory(keys[0]);
    }
    if (category === "positive") {
      return `${getUniqueFromCategory("reactionPositive")} ${getUniqueFromCategory("empathyPositive")} ${getUniqueFromCategory("positiveFollowUps")}`;
    }
    if (category === "negative") {
      return `${getUniqueFromCategory("reactionNegative")} ${getUniqueFromCategory("empathyNegative")} ${getUniqueFromCategory("negativeFollowUps")}`;
    }
    if (category === "achievement") {
      return `${getUniqueFromCategory("achievement")} ${getUniqueFromCategory("achievementFollowUps")}`;
    }
    const main = getUniqueFromCategory(keys[0]);
    const followUp = Math.random() > 0.35 ? ` ${getUniqueFromCategory(keys[1])}` : "";
    return main + followUp;
  }

  function updateMemory(userText, category) {
    const mem = conversationMemory.current;
    mem.messageCount += 1;
    if (!mem.topics.includes(category)) {
      mem.topics = [...mem.topics.slice(-9), category];
    }
    const sentiment = detectSentimentLocally(userText);
    mem.emotions = [...mem.emotions.slice(-9), sentiment];
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

    if (mem.topics.length > 0) {
      prompt += `\n\nConversation context: This person has been talking about ${[...new Set(mem.topics)].join(", ")}. Keep this in mind.`;
    }
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

  async function callClaudeAPI(currentMessages, userText) {
    const apiMessages = buildApiMessages(currentMessages, userText);
    const systemPrompt = buildSystemPromptWithContext();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        thinking: {
          type: "enabled",
          budget_tokens: THINKING_BUDGET
        },
        system: systemPrompt,
        messages: apiMessages
      })
    });
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API ${response.status}: ${errBody}`);
    }
    const data = await response.json();
    return extractText(data.content);
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending.current) return;
    isSending.current = true;
    setApiError(false);

    const userMessage = { sender: "user", text };
    const category = detectCategory(text);
    updateMemory(text, category);

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    let capturedMessages = [];
    setMessages(prev => { capturedMessages = prev; return prev; });

    try {
      const aiText = await callClaudeAPI(capturedMessages, text);
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
      const fallback = buildLocalFallbackReply(category);
      recentAiReplies.current = [
        ...recentAiReplies.current.slice(-(RECENT_RESPONSE_WINDOW - 1)),
        fallback
      ];
      const delay = typingDelay(fallback);
      setTimeout(() => {
        setMessages(prev => [...prev, { sender: "ai", text: fallback }]);
        setTyping(false);
        isSending.current = false;
      }, delay);
    }
  }, [input]);

  return (
    <>
      <div className="h-screen overflow-hidden bg-[#05070d] text-white relative font-sans">

        {showWarning && (
          <div className="fixed inset-0 bg-[#05070d] z-[99999] flex items-center justify-center px-6">
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
          <div className="fixed inset-0 bg-black z-[99999] flex flex-col items-center justify-center animate-fadeOut">
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
          .animate-loadingBar { animation: loadingBar 2.5s ease forwards; }
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
