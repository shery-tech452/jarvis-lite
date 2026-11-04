
const $ = id => document.getElementById(id);
const chat = $("chat");
const statusEl = $("status");
const KEY = "jarvis_v2_gemini_key";

let history = [];
let listening = false;
let busy = false;
let recognition;

function bubble(message, who = "jarvis") {
  const div = document.createElement("div");
  div.className = "bubble " + who;

  if (who === "jarvis") {
    const heading = document.createElement("b");
    heading.textContent = "JARVIS";
    div.append(heading, document.createElement("br"));
  }

  div.append(document.createTextNode(message));
  chat.append(div);
  chat.scrollTop = chat.scrollHeight;
}

function speak(message) {
  if (!$("autoSpeak").checked || !window.speechSynthesis) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(
    message.slice(0, 1800)
  );

  utterance.lang = "en-US";
  utterance.rate = 0.98;
  utterance.pitch = 0.92;

  speechSynthesis.speak(utterance);
}

function localCommand(q) {
  const s = q.toLowerCase();

  if (/\b(hello|hi|hey|good morning|good evening)\b/.test(s))
    return "Hello! Good to hear from you. What can I help you with?";

  if (s.includes("your name") || s.includes("who are you"))
    return "I'm JARVIS, your personal voice assistant.";

  if (s.includes("time"))
    return "The time is " + new Date().toLocaleTimeString();

  if (s.includes("date"))
    return "Today is " + new Date().toLocaleDateString();

  if (s.includes("youtube")) {
    window.open("https://m.youtube.com", "_blank");
    return "Opening YouTube.";
  }

  if (s.includes("maps")) {
    window.open("https://maps.google.com", "_blank");
    return "Opening Google Maps.";
  }

  if (s.startsWith("search ") || s.startsWith("google ")) {
    const query = q.replace(/^(search|google)\s*/i, "");
    window.open(
      "https://www.google.com/search?q=" +
      encodeURIComponent(query),
      "_blank"
    );
    return "Searching the web.";
  }

  if (s.includes("thank")) return "You're welcome!";

  return "I can handle basic commands. Ask me anything else!";
}

async function callGemini(model, key, contents) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{
            text: "You are JARVIS, a friendly, intelligent and helpful personal AI assistant. Speak naturally, explain things clearly and keep answers concise unless more detail is needed. Never claim to perform actions you cannot actually perform."
          }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.error?.message || "Gemini request failed"
    );
    error.status = response.status;
    throw error;
  }

  const answer = data.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("")
    .trim();

  if (!answer) {
    throw new Error("The AI returned an empty response.");
  }

  return answer;
}

async function gemini(q) {
  const key = localStorage.getItem(KEY);

  if (!key) {
    throw new Error("Please add your Gemini API key in Settings.");
  }

  const contents = [
    ...history.slice(-8),
    {
      role: "user",
      parts: [{ text: q }]
    }
  ];

  let answer;

  try {
    answer = await callGemini(
      "gemini-3.8-flash",
      key,
      contents
    );
  } catch (error) {
    if (error.status !== 429 && error.status !== 503) {
      throw error;
    }

    statusEl.textContent = "TRYING BACKUP AI...";

    answer = await callGemini(
      "gemini-3.5-flash-lite",
      key,
      contents
    );
  }

  history.push(
    { role: "user", parts: [{ text: q }] },
    { role: "model", parts: [{ text: answer }] }
  );

  history = history.slice(-16);

  return answer;
}

async function send(message) {
  const q = message.trim();

  if (!q || busy) return;

  bubble(q, "user");
  $("message").value = "";

  busy = true;
  statusEl.textContent = "THINKING...";

  let answer;

  try {
    const simpleCommand =
      /\b(time|date|youtube|maps|search |google )\b/i.test(q);

    if (simpleCommand) {
      answer = localCommand(q);
    } else {
      answer = await gemini(q);
    }
  } catch (error) {
    answer = "I couldn't reach the AI service: " +
      error.message +
      ". Please try again later.";
  }

  bubble(answer);
  speak(answer);

  statusEl.textContent = "SYSTEM ONLINE";
  busy = false;
}

$("sendBtn").onclick = () => {
  send($("message").value);
};

$("message").onkeydown = event => {
  if (event.key === "Enter") {
    send($("message").value);
  }
};

document.querySelectorAll("[data-command]").forEach(button => {
  button.onclick = () => send(button.dataset.command);
});

$("settingsBtn").onclick = () => {
  $("apiKey").value = localStorage.getItem(KEY) || "";
  $("settingsDialog").showModal();
};

$("saveSettings").onclick = () => {
  const key = $("apiKey").value.trim();

  if (key) {
    localStorage.setItem(KEY, key);
  } else {
    localStorage.removeItem(KEY);
  }
};

$("micBtn").onclick = () => {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    bubble("Voice recognition is unavailable. Check Chrome microphone permission.");
    return;
  }

  if (listening) {
    recognition.stop();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onstart = () => {
    listening = true;
    $("micBtn").classList.add("listening");
    $("micBtn").querySelector("b").textContent = "Listening... tap to stop";
    statusEl.textContent = "LISTENING";
  };

  recognition.onresult = event => {
    send(event.results[0][0].transcript);
  };

  recognition.onerror = event => {
    bubble("Microphone issue: " + event.error);
  };

  recognition.onend = () => {
    listening = false;
    $("micBtn").classList.remove("listening");
    $("micBtn").querySelector("b").textContent = "Tap to speak";
    statusEl.textContent = "SYSTEM ONLINE";
  };

  recognition.start();
};
