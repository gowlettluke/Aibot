# ORACLE — Satirical Emergency Intelligence Interface

ORACLE is a static parody of an overconfident emergency-management AI assistant. It presents short, authoritative operational briefings that deliberately avoid answering the user's question.

## Safety notice

This project is satire. It is not an operational decision-support system and must never be used for emergency information, public warnings, safety advice, or real-world decisions.

## Behaviour

Every conversation follows one fixed sequence:

1. One initial operational question
2. A four-stage fake analysis sequence, with every stage reaching 100%
3. A short topic-aware but unhelpful response
4. Exactly one follow-up question
5. A second fake analysis sequence and short evasive response
6. A full-screen **QUESTION RESOLVED** success display
7. Complete interface lock until **ASK NEW QUESTION** is selected

The resolved-question counter persists in local browser storage.

## Features

- Finite state machine controlling the complete conversation lifecycle
- Broad topic detection for flood, cyclone, road closures, power outages, evacuation, fire, dam, weather, logistics, and general questions
- Short deterministic response templates with no server, API, AI model, or API key
- Animated inline-SVG head with idle movement, blinking, eye tracking, listening, speaking, and a self-satisfied nod
- Typed input, browser speech recognition where supported, and browser text-to-speech
- Fake confidence constrained to 99.4–100%, operational status, knowledge-base status, and resolution metrics
- Responsive desktop and mobile layouts
- No external dependencies or build step

## Run locally

You can open `index.html` directly. For the best microphone support, serve the folder through localhost or HTTPS:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Host on GitHub Pages

Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository root. In **Settings → Pages**, deploy the `main` branch from `/ (root)`.

Speech recognition support varies by browser and platform. Typed input remains available when speech recognition is unsupported.
