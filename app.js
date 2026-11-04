
const $ = id => document.getElementById(id);
const chat = $("chat");
const statusEl = $("status");
const KEY = "jarvis_v2_gemini_key";

let history = [], listening = false, busy = false, recognition;

function bubble(t, who = "jarvis") {
  const d = document.createElement("div");
  d.className = "bubble " + who;
  if (who === "jarvis") {
    const b = document.createElement("b");
    b.textContent = "JARVIS";
    d.append(b, document.createElement("br"));
  }
  d.append(document.createTextNode(t));
  chat.append(d);
  chat.scrollTop = chat.scrollHeight;
}

function speak(t) {
  if (!$("autoSpeak").checked || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t.slice(0, 1800));
  u.lang = "en-US";
  u.rate = .98;
  u.pitch = .92;
  speechSynthesis.speak(u);
}

function local(q) {
  const s = q.toLowerCase();
  if (/\b(hello|hi|hey|good morning|good evening)\b/.test(s))
    return "Hello! Good to hear from you. What can I help you with?";
  if (s.includes("your name") || s.includes("who are you"))
    return "I'm JARVIS, your personal voice assistant.";
  if (s.includes("time"))
    return "The time is " + new Date().toLocaleTimeString() + ".";
  if (s.includes("date"))
    return "Today is " + new Date().toLocaleDateString() + ".";
  if (s.includes("youtube")) {
    window.open("https://m.youtube.com", "_blank");
    return "Opening YouTube.";
  }
  if (s.includes("maps")) {
    window.open("https://maps.google.com", "_blank");
    return "Opening Google Maps.";
  }
  if (s.startsWith("search ") || s.startsWith("google ")) {
    window.open("https://www.google.com/search?q=" +
      encodeURIComponent(q.replace(/^(search|google)\s*/i, "")), "_blank");
    return "Searching the web.";
  }
  if (s.includes("thank")) return "You're welcome!";
  return "I can handle basic commands. Ask me anything else!";
}

async function gemini(q) {
  const key = localStorage.getItem(KEY);
  if (!key) return null;

  const contents = [
    ...history.slice(-8),
    { role: "user", parts: [{ text: q }] }
  ];

  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
    encodeURIComponent(key),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{
            text: "You are JARVIS, a warm, natural, friendly and helpful personal assistant. Be conversational, clear and concise. Never claim to control Android settings or perform actions you cannot."
          }]
        },
        generationConfig: { temperature: .7, maxOutputTokens: 500 }
      })
    }
  );

  const data = await r.json();
  if (!r.ok) throw Error(data.error?.message || "Gemini request failed");

  const a = data.candidates?.[0]?.content?.parts
    ?.map(p => p.text || "").join("").trim();

  if (!a) throw Error("AI returned an empty reply");

  history.push(
    { role: "user", parts: [{ text: q }] },
    { role: "model", parts: [{ text: a }] }
  );
  history = history.slice(-16);
  return a;
}

async function send(t) {
  const q = t.trim();
  if (!q || busy) return;

  bubble(q, "user");
  $("message").value = "";
  busy = true;
  statusEl.textContent = "THINKING...";

  let a;
  try {
    const cmd = /\b(time|date|youtube|maps|search |google )\b/i.test(q);
    a = cmd || !localStorage.getItem(KEY) ? local(q) : await gemini(q);
    if (!a) a = local(q);
  } catch (e) {
    a = "I couldn't reach the AI service: " + e.message +
      ". Basic commands still work.";
  }

  bubble(a);
  speak(a);
  statusEl.textContent = "SYSTEM ONLINE";
  busy = false;
}

$("sendBtn").onclick = () => $("message").value && send($("message").value);
$("message").onkeydown = e => {
  if (e.key === "Enter") send($("message").value);
};

document.querySelectorAll("[data-command]").forEach(b =>
  b.onclick = () => send(b.dataset.command)
);

$("settingsBtn").onclick = () => {
  $("apiKey").value = localStorage.getItem(KEY) || "";
  $("settingsDialog").showModal();
};

$("saveSettings").onclick = () => {
  const k = $("apiKey").value.trim();
  if (k) localStorage.setItem(KEY, k);
  else localStorage.removeItem(KEY);
};

$("micBtn").onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    bubble("Voice recognition is unavailable. Check Chrome microphone permission.");
    return;
  }
  if (listening) {
    recognition.stop();
    return;
  }
  recognition = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.onstart = () => {
    listening = true;
    $("micBtn").classList.add("listening");
    $("micBtn").querySelector("b").textContent = "Listening... tap to stop";
    statusEl.textContent = "LISTENING";
  };
  recognition.onresult = e => send(e.results[0][0].transcript);
  recognition.onerror = e => bubble("Microphone issue: " + e.error);
  recognition.onend = () => {
    listening = false;
    $("micBtn").classList.remove("listening");
    $("micBtn").querySelector("b").textContent = "Tap to speak";
    statusEl.textContent = "SYSTEM ONLINE";
  };
  recognition.start();
};
