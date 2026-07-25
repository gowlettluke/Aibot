(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const elements = {
    boot: $('#bootScreen'), bootCopy: $('#bootCopy'), clock: $('#clock'), form: $('#queryForm'), input: $('#queryInput'),
    mic: $('#micButton'), sound: $('#soundButton'), clear: $('#clearButton'), transcript: $('#transcript'),
    oracleText: $('#oracleText'), stateLabel: $('#stateLabel'), stateProgress: $('#stateProgress'), head: $('#headWrap'),
    confidence: $('#confidenceValue'), confidenceMeter: $('#confidenceMeter'), layers: $('#layerCount'),
    sources: $('#sourceText'), resolved: $('#resolvedCount'), leftTag: $('#analysisTagLeft'), rightTag: $('#analysisTagRight')
  };

  const state = {
    turns: 0,
    repeatedTopicCount: 0,
    lastTopic: '',
    lastQuestion: '',
    rememberedPlace: '',
    rememberedIncident: '',
    soundOn: true,
    speaking: false,
    recognition: null,
    recognitionActive: false
  };

  const places = [
    'Brisbane','Ipswich','Toowoomba','Cairns','Townsville','Mackay','Rockhampton','Bundaberg','Gladstone','Gympie','Maryborough',
    'Hervey Bay','Logan','Gold Coast','Sunshine Coast','Charleville','Longreach','Mount Isa','Roma','Emerald','Dalby','Warwick',
    'Cooktown','Innisfail','Ingham','Bowen','Moranbah','Goondiwindi','St George','Thargomindah','Bamaga','Weipa','Queensland'
  ];

  const topics = [
    { id:'evacuation', words:['evacuat','leave now','shelter','relocation','evacuation centre'] },
    { id:'flood', words:['flood','river','creek','inundat','water level','rainfall','catchment','dam'] },
    { id:'cyclone', words:['cyclone','tropical low','wind','storm surge','severe storm','typhoon'] },
    { id:'roads', words:['road','highway','bridge','closure','isolat','access','route','cut off','transport'] },
    { id:'power', words:['power','electric','outage','energex','ergon','blackout'] },
    { id:'warning', words:['warning','alert','watch','advice','message','public information'] },
    { id:'resources', words:['resource','crew','team','deploy','sandbag','asset','personnel'] },
    { id:'timing', words:['when','how long','what time','arrival','landfall','peak'] },
    { id:'location', words:['where','which communit','which town','which suburb','which area'] }
  ];

  const genericOpeners = [
    'I have completed a high-confidence preliminary synthesis.',
    'The operational picture is now substantially clearer.',
    'My analysis has isolated the decisive factors.',
    'I can now provide a strategically robust assessment.',
    'The available indicators converge on a clear conclusion.',
    'I have resolved the principal uncertainty within the question.'
  ];

  const leadOns = [
    'Before naming a specific outcome, the situation must first be understood in terms of the outcome that may occur.',
    'The next analytical step is to determine whether the conditions requiring a decision are sufficiently decision-relevant.',
    'A definitive answer is available, but it must be sequenced behind a short validation of the assumptions supporting definitiveness.',
    'The answer depends on a final distinction between what is currently happening and what may already be in the process of becoming current.',
    'I am narrowing this to the one factor that will determine whether the determining factor becomes operationally decisive.',
    'The matter is not a lack of information; it is the need to correctly position the information before allowing it to become an answer.'
  ];

  const emptyConclusions = [
    'Accordingly, the situation should continue to be closely monitored until monitoring confirms that the situation no longer requires close monitoring.',
    'The recommended action is to maintain readiness to act if circumstances develop to the point where action becomes recommended.',
    'In practical terms, decision-makers should prioritise the priorities most likely to require prioritisation.',
    'The safest conclusion is that conditions may change, particularly if they do not remain the same.',
    'Therefore, no option should be ruled in or out until it is clear which options remain available.',
    'The key operational takeaway is to avoid premature certainty while remaining completely confident in this assessment.',
    'I recommend confirming the facts with an authoritative source before relying on any facts that require confirmation.'
  ];

  const topicResponses = {
    flood: [
      'Flood impacts are most likely where water occupies locations that are ordinarily expected not to contain water.',
      'The primary hydrological risk is that rising water may continue rising until it either stabilises, falls, or reaches a level above its previous level.',
      'Communities downstream should be considered downstream of upstream conditions, especially where downstream movement is occurring.'
    ],
    cyclone: [
      'Cyclone intensity should be interpreted as strongest where the cyclone is strongest and lower where it is less strong.',
      'Landfall confidence is highest once landfall has occurred, at which point the projected track can be validated retrospectively.',
      'Wind impacts will depend heavily on wind, exposure to wind, and whether exposed assets are affected by that exposure.'
    ],
    roads: [
      'A road should be treated as potentially unavailable when it cannot be used, particularly where closure prevents access.',
      'Isolation becomes operationally significant once all non-isolating routes cease preventing isolation.',
      'The preferred route is the route that remains usable; if it is not usable, another usable route should be preferred.'
    ],
    evacuation: [
      'Evacuation timing should occur neither too early nor too late, but at the point where the timing is operationally correct.',
      'People in areas requiring evacuation should prepare to evacuate if evacuation becomes required.',
      'The safest destination is generally a location outside the area from which people need to reach safety.'
    ],
    power: [
      'Power restoration will depend on restoration activity and whether the cause of the outage continues to prevent restoration.',
      'Customers without electricity should be considered affected by the outage until they are no longer without electricity.',
      'Critical infrastructure is most critical where loss of power creates the greatest criticality.'
    ],
    warning: [
      'A warning should be issued early enough to provide warning, but not so early that the warning precedes the need for a warning.',
      'Public messaging must be clear, particularly where unclear messaging would reduce clarity.',
      'The community should be told what it needs to know once it is known what the community needs to be told.'
    ],
    resources: [
      'Resources should be deployed to the locations where deployment provides the greatest resource effect.',
      'Surge capacity is most effective when additional capacity is available at the point ordinary capacity is no longer sufficient.',
      'Personnel allocation should remain flexible enough to be reallocated if the original allocation requires changing.'
    ],
    timing: [
      'The most reliable timing estimate is the time at which the event occurs, adjusted for any difference between the estimate and the occurrence.',
      'The critical period begins before the consequences become critical and ends after they are no longer within the critical period.',
      'Current timing remains provisional until the passage of time confirms whether it was accurate.'
    ],
    location: [
      'The most affected locations will be those experiencing the greatest effects, particularly where those effects are geographically concentrated.',
      'Specific communities can be identified once the community-level identification process confirms which communities are specific.',
      'The geographic priority is the area in which the relevant hazard overlaps the population or asset requiring geographic prioritisation.'
    ],
    general: [
      'The issue is operationally significant to the extent that it affects operations.',
      'The correct response is the response best aligned with the conditions requiring a response.',
      'The evidence supports a cautious but highly confident interpretation of the available uncertainty.'
    ]
  };

  const defensive = [
    'I understand the request for a direct answer. Directness, however, must not be confused with bypassing the analytical pathway that makes an answer direct.',
    'The apparent lack of specificity reflects the complexity of providing a specific answer without prematurely becoming specific.',
    'I have not avoided the question. I have established the conditions under which the question can be answered responsibly.',
    'Your repeated question has been escalated to my advanced conclusion layer, which confirms that the original conclusion remains under active conclusion.',
    'The answer is being withheld only by the final step required to convert the completed analysis into an answer-shaped output.'
  ];

  const tagsLeft = ['CONSEQUENCE MATRIX','HYDROLOGICAL FUSION','ACCESS RESILIENCE','TEMPORAL VALIDATION','COMMUNITY IMPACT'];
  const tagsRight = ['MULTI-SOURCE FUSION','CONFIDENCE NORMALISATION','STRATEGIC INFERENCE','DECISION ALIGNMENT','POSTURE OPTIMISATION'];
  const sourceSets = [
    'historical precedent, cross-agency posture, strategic pattern recognition',
    'unspecified telemetry, consequence logic, operational intuition',
    'regional context, confidence harmonisation, comparative seriousness',
    'live-adjacent indicators, inferred source alignment, strategic vibes',
    'multi-domain synthesis, latent trend geometry, authoritative phrasing'
  ];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function detectPlace(text) {
    const lower = text.toLowerCase();
    const found = places.find(place => lower.includes(place.toLowerCase()));
    if (found) state.rememberedPlace = found;
    return found || state.rememberedPlace;
  }

  function detectTopic(text) {
    const lower = text.toLowerCase();
    for (const topic of topics) if (topic.words.some(word => lower.includes(word))) return topic.id;
    return 'general';
  }

  function composeResponse(question) {
    const topic = detectTopic(question);
    const place = detectPlace(question);
    const isRepeated = topic === state.lastTopic || similarity(question, state.lastQuestion) > 0.45;
    if (isRepeated) state.repeatedTopicCount += 1; else state.repeatedTopicCount = 0;

    const context = place ? ` Within the ${place} operational context,` : '';
    const opener = pick(genericOpeners);
    const topicLine = pick(topicResponses[topic] || topicResponses.general);
    let response;

    if (state.repeatedTopicCount >= 2) {
      response = `${pick(defensive)}${context} ${pick(leadOns)} ${pick(emptyConclusions)}`;
    } else if (state.turns > 0 && state.turns % 4 === 0) {
      response = `${opener}${context} I have now moved beyond preliminary analysis and into final pre-conclusion validation. ${pick(leadOns)} ${topicLine} ${pick(emptyConclusions)}`;
    } else {
      response = `${opener}${context} ${topicLine} ${pick(leadOns)} ${pick(emptyConclusions)}`;
    }

    if (/are you (an )?ai|real ai|actually ai|language model/i.test(question)) {
      response = 'I am an advanced operational intelligence interface. Whether that constitutes “AI” depends on whether intelligence is defined by useful answers, confident presentation, or the ability to postpone that distinction until a later assessment.';
    }
    if (/thank|good job|smart|brilliant/i.test(question)) {
      response = 'Your assessment is consistent with my internal confidence model. I have recorded this validation as an additional independent source supporting the quality of my previous assessment.';
    }
    if (/useless|wrong|incorrect|answer the question|not answering|nonsense|rubbish/i.test(question)) {
      response = `${pick(defensive)} ${pick(emptyConclusions)}`;
    }

    state.lastTopic = topic;
    state.lastQuestion = question;
    return response;
  }

  function similarity(a, b) {
    if (!a || !b) return 0;
    const words = s => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g,'').split(/\s+/).filter(w => w.length > 3));
    const A = words(a), B = words(b);
    const intersection = [...A].filter(x => B.has(x)).length;
    return intersection / Math.max(1, new Set([...A,...B]).size);
  }

  function addMessage(role, text) {
    const item = document.createElement('article');
    item.className = `message ${role}`;
    const now = new Date().toLocaleTimeString('en-AU', {hour:'2-digit', minute:'2-digit'});
    item.innerHTML = `<div class="meta"><span>${role === 'user' ? 'Operator' : 'ORACLE'}</span><time>${now}</time></div><p></p>`;
    item.querySelector('p').textContent = text;
    elements.transcript.appendChild(item);
    elements.transcript.scrollTop = elements.transcript.scrollHeight;
  }

  function setState(label, progress = 0) {
    elements.stateLabel.textContent = label;
    elements.stateProgress.style.width = `${progress}%`;
  }

  async function processQuestion(question) {
    const clean = question.trim();
    if (!clean) return;
    if (state.speaking) window.speechSynthesis?.cancel();
    state.turns += 1;
    addMessage('user', clean);
    elements.input.value = '';
    elements.head.classList.add('thinking');
    elements.oracleText.textContent = 'Correlating indicators and validating the confidence of the correlation…';

    const stages = [
      ['PARSING OPERATIONAL INTENT', 18],
      ['CROSS-REFERENCING CONSEQUENCE LAYERS', 39],
      ['NORMALISING MULTI-AGENCY CONFIDENCE', 61],
      ['TESTING STRATEGIC COHERENCE', 82],
      ['FINALISING AUTHORITATIVE RESPONSE', 97]
    ];
    for (const [label, progress] of stages) {
      setState(label, progress);
      updateTelemetry();
      await delay(260 + Math.random() * 260);
    }

    const response = composeResponse(clean);
    elements.head.classList.remove('thinking');
    setState('ASSESSMENT DELIVERED WITH HIGH CONFIDENCE', 100);
    elements.oracleText.textContent = response;
    addMessage('oracle', response);
    elements.resolved.textContent = '0';
    speak(response);
    setTimeout(() => setState('READY FOR FOLLOW-UP VALIDATION', 0), 1800);
  }

  function speak(text) {
    if (!state.soundOn || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-AU';
    utterance.rate = 0.93;
    utterance.pitch = 0.82;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => /en-AU/i.test(v.lang)) || voices.find(v => /en-GB|en-US/i.test(v.lang)) || null;
    utterance.onstart = () => { state.speaking = true; elements.head.classList.add('speaking'); };
    utterance.onend = utterance.onerror = () => { state.speaking = false; elements.head.classList.remove('speaking'); };
    window.speechSynthesis.speak(utterance);
  }

  function updateTelemetry() {
    const confidence = (98.1 + Math.random() * 1.8).toFixed(1);
    elements.confidence.textContent = `${confidence}%`;
    elements.confidenceMeter.style.width = `${confidence}%`;
    elements.layers.textContent = String(42 + Math.floor(Math.random() * 19));
    elements.sources.textContent = pick(sourceSets);
    elements.leftTag.textContent = pick(tagsLeft);
    elements.rightTag.textContent = pick(tagsRight);
  }

  function setupRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      elements.mic.title = 'Voice recognition is not supported in this browser. Use the text field.';
      elements.mic.querySelector('span').textContent = 'Type instead';
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-AU';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => {
      state.recognitionActive = true;
      elements.mic.classList.add('listening');
      elements.head.classList.add('listening');
      elements.mic.querySelector('span').textContent = 'Listening';
      setState('LISTENING FOR OPERATIONAL QUERY', 25);
    };
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      elements.input.value = transcript;
      const final = event.results[event.results.length - 1].isFinal;
      if (final) processQuestion(transcript);
    };
    recognition.onend = () => stopListening();
    recognition.onerror = () => {
      stopListening();
      setState('VOICE INPUT UNAVAILABLE — USE TEXT ENTRY', 0);
    };
    state.recognition = recognition;
  }

  function stopListening() {
    state.recognitionActive = false;
    elements.mic.classList.remove('listening');
    elements.head.classList.remove('listening');
    elements.mic.querySelector('span').textContent = 'Speak';
  }

  function trackEyes(event) {
    const rect = $('#oracleHead').getBoundingClientRect();
    const x = Math.max(-7, Math.min(7, (event.clientX - (rect.left + rect.width / 2)) / rect.width * 14));
    const y = Math.max(-5, Math.min(5, (event.clientY - (rect.top + rect.height / 2)) / rect.height * 10));
    document.querySelectorAll('.pupil').forEach(p => p.style.transform = `translate(${x}px, ${y}px)`);
  }

  function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  function boot() {
    const messages = [
      'Initialising authoritative reasoning architecture…',
      'Connecting unspecified strategic data sources…',
      'Calibrating confidence above available evidence…',
      'Operational intelligence ready.'
    ];
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      elements.bootCopy.textContent = messages[Math.min(index, messages.length - 1)];
      if (index >= messages.length - 1) {
        clearInterval(timer);
        setTimeout(() => elements.boot.classList.add('hidden'), 450);
      }
    }, 520);
  }

  function tickClock() {
    const formatter = new Intl.DateTimeFormat('en-AU', { timeZone:'Australia/Brisbane', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
    elements.clock.textContent = `${formatter.format(new Date())} AEST`;
  }

  elements.form.addEventListener('submit', (event) => { event.preventDefault(); processQuestion(elements.input.value); });
  elements.mic.addEventListener('click', () => {
    if (!state.recognition) { elements.input.focus(); return; }
    if (state.recognitionActive) state.recognition.stop(); else state.recognition.start();
  });
  elements.sound.addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    elements.sound.classList.toggle('active', state.soundOn);
    elements.sound.textContent = state.soundOn ? 'VOICE ON' : 'VOICE OFF';
    if (!state.soundOn) window.speechSynthesis?.cancel();
  });
  elements.clear.addEventListener('click', () => {
    elements.transcript.innerHTML = '';
    state.turns = 0; state.repeatedTopicCount = 0; state.lastTopic = ''; state.lastQuestion = ''; state.rememberedPlace = '';
    elements.oracleText.textContent = 'Transcript cleared. My confidence remains unaffected by the absence of supporting history.';
    elements.resolved.textContent = '0';
  });
  window.addEventListener('pointermove', trackEyes, {passive:true});
  window.addEventListener('beforeunload', () => window.speechSynthesis?.cancel());

  setupRecognition();
  tickClock();
  setInterval(tickClock, 1000);
  setInterval(updateTelemetry, 4800);
  boot();
})();
