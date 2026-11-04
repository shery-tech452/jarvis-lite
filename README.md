# JARVIS Lite — Android starter

A free, static browser-based assistant prototype designed for an Android phone.

## What works
- Futuristic mobile dashboard
- Typed commands
- Time and date responses
- Google search shortcuts
- YouTube and Maps shortcuts
- Spoken responses using browser speech synthesis
- Voice input where the browser supports the Web Speech API
- Basic offline caching after the app has been hosted and opened once

## Important limitations
This is **JARVIS Lite**, not a full ChatGPT-like autonomous assistant yet. It has no connected large language model, no cloud memory, and no unrestricted Android device control. A static website cannot silently control other apps, read notifications, access private files, or change phone settings. Voice recognition support varies by browser and may require internet access.

## Run it on Android for free
The easiest route is to publish these files as a static website using a free static-hosting service (for example, GitHub Pages). You will need a GitHub account and a browser.

1. Extract `jarvis-android.zip`.
2. Create a new public repository on GitHub named `jarvis-lite`.
3. Upload `index.html`, `app.js`, `manifest.webmanifest`, and `sw.js` to the repository root.
4. In the repository, open **Settings → Pages**.
5. Under build/deployment, select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
6. Wait for GitHub Pages to publish the site. Open the published HTTPS address in Chrome on Android.
7. In Chrome, tap **⋮ → Add to Home screen** (or **Install app**, if shown).

The README and ZIP can remain on your phone; only the four app files need to be in the website repository.

## Test commands
- `What time is it?`
- `What is today's date?`
- `Search for latest football news`
- `Open YouTube`
- `Open Google Maps`
- `What can you do?`

## Next upgrade
To add genuine conversational AI, connect a model API through a small backend. Do not put secret API keys in `app.js` or any public website repository. Some providers offer limited free tiers, but terms and quotas can change.
