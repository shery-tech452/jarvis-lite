const $ = (id) => document.getElementById(id);
const log = $("log"), input = $("command"), statusEl = $("status");
function addMessage(text, who="jarvis") {
  const el = document.createElement("div");
  el.className = `msg ${who}`;
  el.textContent = text;
  log.appendChild(el); log.scrollTop = log.scrollHeight;
}
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1; utterance.pitch = 0.92;
  window.speechSynthesis.speak(utterance);
}
function reply(text, shouldSpeak=true) { addMessage(text); if (shouldSpeak) speak(text); }
function openSearch(query) { window.open("https://www.google.com/search?q="+encodeURIComponent(query), "_blank", "noopener"); }
function handleCommand(raw) {
  const cmd = raw.trim(); if (!cmd) return;
  addMessage(cmd, "you"); input.value = "";
  const q = cmd.toLowerCase();
  if (/(what time|current time|time is it)/.test(q)) {
    reply("The time is " + new Intl.DateTimeFormat([], {hour:"numeric",minute:"2-digit"}).format(new Date()) + ".");
  } else if (/(today'?s date|what date|date today)/.test(q)) {
    reply("Today is " + new Intl.DateTimeFormat([], {weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(new Date()) + ".");
  } else if (q.includes("what can you do") || q === "help") {
    reply("I can tell you the time and date, search Google, open supported websites, and speak responses. This free starter does not yet have a connected large language model or permission to control your whole phone.");
  } else if (q.includes("open youtube")) {
    reply("Opening YouTube."); window.open("https://m.youtube.com/", "_blank", "noopener");
  } else if (q.includes("open google maps") || q.includes("open maps")) {
    reply("Opening Google Maps."); window.open("https://maps.google.com/", "_blank", "noopener");
  } else if (q.startsWith("search for ") || q.startsWith("search ")) {
    const term = cmd.replace(/^search for\s+/i,"").replace(/^search\s+/i,"");
    reply("Searching Google for " + term + "."); openSearch(term);
  } else if (q.startsWith("who is ") || q.startsWith("what is ") || q.startsWith("tell me about ")) {
    reply("I can look that up for you. Opening a web search."); openSearch(cmd);
  } else {
    reply("I don't have an AI brain connected yet, so I can't answer that reliably. Try asking for the time, date, help, or say “search for” followed by a topic.");
  }
}
$("send").addEventListener("click", () => handleCommand(input.value));
input.addEventListener("keydown", e => { if (e.key === "Enter") handleCommand(input.value); });
document.querySelectorAll("[data-cmd]").forEach(b => b.addEventListener("click", () => handleCommand(b.dataset.cmd)));

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic = $("mic");
if (!SpeechRecognition) {
  mic.textContent = "VOICE INPUT NOT SUPPORTED IN THIS BROWSER";
  mic.disabled = true; mic.classList.add("secondary");
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US"; recognition.interimResults = false; recognition.maxAlternatives = 1;
  mic.addEventListener("click", () => {
    try { statusEl.textContent = "LISTENING…"; mic.textContent = "● LISTENING — TAP TO STOP"; recognition.start(); }
    catch { statusEl.textContent = "READY"; }
  });
  recognition.onresult = e => handleCommand(e.results[0][0].transcript);
  recognition.onerror = e => { statusEl.textContent = "VOICE ERROR"; reply("Voice input error: " + e.error + ". You can type commands instead.", false); };
  recognition.onend = () => { statusEl.textContent = "SYSTEM READY"; mic.textContent = "🎙  TAP TO SPEAK"; };
}
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
