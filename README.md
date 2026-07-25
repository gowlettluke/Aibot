# ORACLE — Satirical Emergency Intelligence Interface

ORACLE is a deliberately unreliable parody of an emergency-management AI adviser. It looks and sounds authoritative, accepts typed or spoken questions, remembers basic conversational context, and confidently leads the user through elaborate reasoning that produces little or no useful information.

## Important safety notice

This project is satire. It is not an operational decision-support system and must never be used for emergency information, public warnings, safety advice, or real-world decisions.

## Features

- Animated floating holographic head built entirely with inline SVG and CSS
- Pointer-following eyes, blinking, idle movement, listening state, and speaking mouth animation
- Typed chat input
- Browser speech recognition where supported
- Browser text-to-speech using the Web Speech API
- Deterministic keyword and template response engine — no AI, server, API key, or paid service
- Topic detection for floods, cyclones, roads, evacuations, outages, warnings, timing, locations, and resources
- Basic memory for repeated topics and named Queensland locations
- Escalating evasiveness when the user repeats or challenges a question
- Fake telemetry, confidence metrics, reasoning stages, and data-source labels
- Persistent parody and safety warning
- Responsive desktop and mobile layouts

## Run locally

Because this is a static site, you can open `index.html` directly. Voice recognition is more reliable when served through `localhost` or HTTPS.

Using Python:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Using Node:

```bash
npx http-server .
```

## Host on GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, `app.js`, and this README to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then save.
6. GitHub will provide the public HTTPS address after deployment.

No build step is required.

## Browser support

The visual interface and typed chat work in current mainstream browsers. Speech synthesis is broadly supported. Speech recognition support varies by browser and platform; when unavailable, the app automatically retains typed input as the fallback.

## Customisation

The response templates and keyword rules are in `app.js`. Visual styling is in `styles.css`. The floating head is the inline SVG inside `index.html`, so there are no external image assets or cross-origin dependencies.
