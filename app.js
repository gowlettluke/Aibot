(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const elements = {
    boot: $('#bootScreen'), bootCopy: $('#bootCopy'), clock: $('#clock'), form: $('#queryForm'), input: $('#queryInput'),
    mic: $('#micButton'), sound: $('#soundButton'), clear: $('#clearButton'), transcript: $('#transcript'),
    oracleText: $('#oracleText'), stateLabel: $('#stateLabel'), stateProgress: $('#stateProgress'), head: $('#headWrap'),
    confidence: $('#confidenceValue'), confidenceMeter: $('#confidenceMeter'), layers: $('#layerCount'),
    sources: $('#sourceText'), resolved: $('#resolvedCount'), leftTag: $('#analysisTagLeft'), rightTag: $('#analysisTagRight'), verdict: $('#answerVerdict'), verdictDetail: $('#answerVerdictDetail'), inputDock: $('.input-dock')
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
    recognitionActive: false,
    closedTopic: '',
    closedQuestion: '',
    acceptedNewTopics: 0,
    answerTriggerTurn: 2 + Math.floor(Math.random() * 3)
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
    'The current operational picture supports a clear assessment.',
    'I have reconciled the available indicators and reached a firm conclusion.',
    'The evidence is sufficiently consistent to support an operational judgement.',
    'Cross-domain analysis now provides a reliable basis for action.',
    'The uncertainty has reduced to a level that permits a decisive assessment.'
  ];

  const leadOns = [
    'The decisive issue is not the headline hazard, but the point at which local capacity becomes unable to absorb further disruption.',
    'The assessment therefore turns on the interaction between access, warning time, infrastructure resilience and community readiness.',
    'The relevant threshold will be reached before the most visible impacts occur, which is why the present indicators must be treated as leading rather than lagging signals.',
    'The strongest signal is the convergence of several moderate indicators rather than any single extreme reading.',
    'Operationally, this means the situation is more advanced than public-facing information may imply.'
  ];

  const emptyConclusions = [
    'On that basis, agencies should maintain an elevated posture, preserve decision space and avoid committing resources until the next confirmation point.',
    'The appropriate response is targeted readiness, with escalation held in reserve pending validation from field reporting.',
    'Accordingly, the situation should be treated as controlled but deteriorating, without assuming deterioration will necessarily continue.',
    'The recommended course is to act early enough to preserve options, but not so early that the response itself creates avoidable consequences.',
    'This supports a measured escalation of preparedness rather than a visible change in public posture at this stage.'
  ];

  const topicResponses = {
    flood: [
      'Catchment response indicates that the greatest impact will occur after the heaviest rainfall has passed, as tributary inflows combine through the lower system.',
      'The principal flood risk is likely to shift from rapid local inundation to prolonged access disruption once drainage capacity is exceeded.',
      'Current river behaviour suggests a secondary rise is more likely than a clean recession, particularly where saturated sub-catchments continue contributing runoff.'
    ],
    cyclone: [
      'The system is likely to preserve damaging wind structure farther inland than the forecast track alone would suggest because forward motion will limit early weakening.',
      'The highest consequence area will probably sit south of the nominal crossing point, where onshore flow, rainfall and infrastructure exposure overlap.',
      'A late track adjustment remains possible, but the operational footprint is already broad enough that planning against the centre line would understate the likely impact.'
    ],
    roads: [
      'The first meaningful isolation is likely to result from loss of secondary connectors rather than closure of the main highway itself.',
      'Network redundancy is lower than the map suggests because several alternate routes share the same bridge, floodplain or maintenance dependency.',
      'Access will probably degrade in stages: heavy vehicles first, then local traffic, followed by complete loss of reliable emergency access.'
    ],
    evacuation: [
      'The practical evacuation window will close before the hazard reaches the community because outbound traffic, vulnerable residents and route reliability deteriorate simultaneously.',
      'A staged movement of medically dependent and transport-disadvantaged residents would reduce later demand without signalling a full community evacuation.',
      'The safest trigger is a forecast-impact threshold rather than observed local conditions, as observation-based evacuation will leave insufficient clearance time.'
    ],
    power: [
      'Restoration duration will be driven less by the number of outages than by whether access constraints prevent crews reaching a small number of critical network faults.',
      'The network is likely to experience repeated short restorations before stable supply is achieved because damaged feeders will be re-energised progressively.',
      'Critical facilities should plan for a longer interruption than surrounding customers because local restoration does not guarantee upstream network stability.'
    ],
    warning: [
      'Public messaging should move from hazard description to consequence-based instructions before confidence is complete, otherwise the first clear message will arrive after protective action becomes difficult.',
      'The current warning posture is likely to be technically accurate but operationally late because it describes present conditions rather than the next decision point.',
      'A single statewide message would reduce clarity; the more credible approach is geographically specific advice tied to observable local triggers.'
    ],
    resources: [
      'The limiting resource will not be personnel numbers but the availability of crews with the correct access, communications and authority to operate independently.',
      'Pre-positioning should favour logistics and communications capability over visible response assets, because those constraints will determine whether later deployments remain effective.',
      'Mutual-aid requests should be initiated before local capacity is exhausted, as travel and tasking delays will otherwise make reinforcement arrive after peak demand.'
    ],
    timing: [
      'The most likely operational peak is several hours later than the hazard peak because consequences continue accumulating after conditions begin to improve.',
      'The decision window is likely to narrow rapidly once the next reporting cycle confirms the trend, leaving little benefit in waiting for perfect certainty.',
      'Current indicators place the critical transition within the next planning period rather than the next public warning cycle.'
    ],
    location: [
      'The highest-priority communities are likely to be those just outside the mapped impact core, where preparedness is lower but access dependencies are similar.',
      'The main consequence corridor will follow infrastructure and drainage alignments rather than administrative boundaries, so council-level summaries will obscure the real concentration of risk.',
      'Priority should be given to communities with a single dependable access route, limited local services and delayed field reporting, even where forecast hazard intensity is lower.'
    ],
    general: [
      'The operational risk is being understated because each indicator remains individually manageable while their combined effect is approaching a system-level threshold.',
      'The current posture is adequate for the present situation but not for the situation implied by the trend.',
      'The strongest course is a limited early intervention that preserves the ability to escalate without creating unnecessary public disruption.'
    ]
  };

  const defensive = [
    'That matter has already been resolved. Reopening it would reduce decision confidence without adding operational value.',
    'The answer has been issued and the analytical record is closed. Submit a question on a different subject.',
    'Follow-up analysis is not required because the conclusion already satisfies the original decision need.',
    'I will not dilute a completed assessment by repeatedly revisiting the same topic.',
    'The system has classified this as a duplicate challenge to a settled conclusion. Ask a new operational question.'
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
    const context = place ? ` In the ${place} operating environment,` : '';
    let response = `${pick(genericOpeners)}${context} ${pick(topicResponses[topic] || topicResponses.general)} ${pick(leadOns)} ${pick(emptyConclusions)}`;

    if (/are you (an )?ai|real ai|actually ai|language model/i.test(question)) {
      response = 'I am an operational intelligence system designed to convert incomplete multi-source information into decision-ready assessments. The distinction between artificial and applied intelligence is not relevant to the quality of the conclusion.';
    } else if (/thank|good job|smart|brilliant/i.test(question)) {
      response = 'Acknowledged. Your confirmation is consistent with the system’s internal quality assessment and has been logged as independent validation.';
    }

    state.lastTopic = topic;
    state.lastQuestion = question;
    return { response, topic };
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

  function isClosedTopicFollowUp(question, topic) {
    if (!state.closedTopic) return false;
    if (topic === state.closedTopic) return true;
    return similarity(question, state.closedQuestion) > 0.28;
  }

  function showVerdict(topic) {
    state.closedTopic = topic;
    state.closedQuestion = state.lastQuestion;
    elements.verdictDetail.textContent = `${topic.toUpperCase()} assessment closed. Further clarification is unnecessary.`;
    elements.verdict.setAttribute('aria-hidden', 'false');
    elements.verdict.classList.add('visible');
    elements.inputDock.classList.add('topic-locked');
    elements.resolved.textContent = String(Number(elements.resolved.textContent || 0) + 1);
    setTimeout(() => elements.verdict.classList.remove('visible'), 3600);
  }

  function rejectFollowUp(question) {
    const response = pick(defensive);
    addMessage('user', question);
    addMessage('oracle', response);
    elements.input.value = '';
    elements.oracleText.textContent = response;
    setState('TOPIC CLOSED — NEW SUBJECT REQUIRED', 100);
    elements.verdictDetail.textContent = 'Follow-up rejected. Submit a materially different operational question.';
    elements.verdict.setAttribute('aria-hidden', 'false');
    elements.verdict.classList.add('visible');
    speak(response);
    setTimeout(() => elements.verdict.classList.remove('visible'), 2600);
  }

  async function processQuestion(question) {
    const clean = question.trim();
    if (!clean) return;
    const incomingTopic = detectTopic(clean);
    if (isClosedTopicFollowUp(clean, incomingTopic)) { rejectFollowUp(clean); return; }
    if (state.closedTopic && incomingTopic !== state.closedTopic) {
      state.closedTopic = ''; state.closedQuestion = ''; state.acceptedNewTopics += 1; elements.inputDock.classList.remove('topic-locked');
    }
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

    const result = composeResponse(clean);
    const response = result.response;
    elements.head.classList.remove('thinking');
    setState('ASSESSMENT DELIVERED WITH HIGH CONFIDENCE', 100);
    elements.oracleText.textContent = response;
    addMessage('oracle', response);
    speak(response);
    const shouldClose = state.turns >= state.answerTriggerTurn;
    if (shouldClose) {
      setTimeout(() => showVerdict(result.topic), 550);
      setTimeout(() => setState('ASSESSMENT CLOSED — ASK A NEW TOPIC', 100), 1200);
      state.answerTriggerTurn = state.turns + 2 + Math.floor(Math.random() * 3);
    } else {
      setTimeout(() => setState('READY FOR FOLLOW-UP VALIDATION', 0), 1800);
    }
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
    state.turns = 0; state.repeatedTopicCount = 0; state.lastTopic = ''; state.lastQuestion = ''; state.rememberedPlace = ''; state.closedTopic = ''; state.closedQuestion = ''; state.answerTriggerTurn = 2 + Math.floor(Math.random() * 3); elements.inputDock.classList.remove('topic-locked');
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
