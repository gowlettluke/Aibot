(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const STATES = Object.freeze({ IDLE:'idle', ANALYSING_INITIAL:'analysing-initial', INITIAL_RESPONSE:'initial-response', AWAITING_FOLLOWUP:'awaiting-followup', ANALYSING_FOLLOWUP:'analysing-followup', SECOND_RESPONSE:'second-response', RESOLVED:'resolved' });
  const ALLOWED = Object.freeze({
    [STATES.IDLE]:[STATES.ANALYSING_INITIAL], [STATES.ANALYSING_INITIAL]:[STATES.INITIAL_RESPONSE], [STATES.INITIAL_RESPONSE]:[STATES.AWAITING_FOLLOWUP],
    [STATES.AWAITING_FOLLOWUP]:[STATES.ANALYSING_FOLLOWUP], [STATES.ANALYSING_FOLLOWUP]:[STATES.SECOND_RESPONSE], [STATES.SECOND_RESPONSE]:[STATES.RESOLVED], [STATES.RESOLVED]:[STATES.IDLE]
  });

  const el = {
    boot:$('#bootScreen'), bootCopy:$('#bootCopy'), clock:$('#clock'), form:$('#queryForm'), input:$('#queryInput'), send:$('#sendButton'), mic:$('#micButton'), sound:$('#soundButton'),
    transcript:$('#transcript'), oracleText:$('#oracleText'), stateLabel:$('#stateLabel'), stateProgress:$('#stateProgress'), sequence:$('#analysisSequence'), head:$('#headWrap'), inputDock:$('#inputDock'),
    confidence:$('#confidenceValue'), confidenceMeter:$('#confidenceMeter'), sources:$('#sourceText'), resolved:$('#resolvedCount'), resolvedLeft:$('#resolvedCountLeft'), knowledge:$('#knowledgeStatus'),
    leftTag:$('#analysisTagLeft'), rightTag:$('#analysisTagRight'), overlay:$('#resolvedOverlay'), overlayConfidence:$('#overlayConfidence'), overlayCount:$('#overlayResolvedCount'), newQuestion:$('#newQuestionButton')
  };

  const storage = { get(){ try{return localStorage.getItem('oracleResolvedCount')}catch{return null} }, set(value){ try{localStorage.setItem('oracleResolvedCount',value)}catch{} } };
  const session = { state:STATES.IDLE, topic:'general', initialQuestion:'', resolvedCount:Number(storage.get() || 0), soundOn:true, speaking:false, recognition:null, recognitionActive:false, runToken:0 };
  const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const topics = [
    ['flood',/\b(flood|flooding|river|creek|inundat|catchment|water level|rainfall)\b/i], ['cyclone',/\b(cyclone|tropical low|storm surge|landfall|damaging wind)\b/i],
    ['roads',/\b(road|roads|highway|bridge|closure|closed|isolat|cut off|access route)\b/i], ['power',/\b(power|electricity|outage|blackout|energex|ergon)\b/i],
    ['evacuation',/(evacuat\w*|leave now|shelter\w*|relocat\w*|evacuation centre)/i], ['fire',/\b(fire|bushfire|wildfire|smoke|fireground)\b/i],
    ['dam',/\b(dam|spillway|storage level|release|outflow)\b/i], ['weather',/\b(weather|rain|wind|storm|forecast|temperature|hail)\b/i],
    ['logistics',/\b(logistic|resource|supply|crew|personnel|deploy|sandbag|fuel|asset)\b/i]
  ];

  const initialResponses = {
    flood:[
      'Current conditions indicate an increased likelihood of community impacts across parts of the operational area. Further assessment is continuing.',
      'Flood consequences are expected to increase where local access and drainage constraints align. The operational posture has been adjusted accordingly.',
      'The current catchment picture supports a heightened consequence assessment across affected areas. Agencies should maintain the established response posture.'
    ],
    cyclone:[
      'The current system profile supports elevated impacts across the broader operational area. Planning assumptions remain appropriately conservative.',
      'Cyclone-related consequences are expected where exposure and local vulnerability overlap. The operational footprint has been assessed at high confidence.',
      'The system is likely to produce meaningful community impacts beyond the immediate forecast track. Preparedness settings remain appropriate.'
    ],
    roads:[
      'Access conditions are likely to deteriorate across parts of the network as local constraints accumulate. Transport impacts are being treated as operationally significant.',
      'The road network is showing an increased likelihood of progressive access disruption. Current arrangements preserve the necessary response options.',
      'Several network dependencies may reduce practical access before wider conditions appear critical. The operational picture reflects this.'
    ],
    power:[
      'Power impacts are likely to remain uneven across the affected area as network conditions develop. Restoration priorities are considered operationally aligned.',
      'The current network picture supports a sustained outage consequence assessment. Critical service continuity remains the appropriate focus.',
      'Electricity disruptions may persist where access and infrastructure damage overlap. The response posture is calibrated to that outcome.'
    ],
    evacuation:[
      'Protective movement may become necessary where local conditions reach the established operational threshold. Current planning remains ahead of that point.',
      'The evacuation picture supports maintaining readiness across potentially affected communities. Decision settings are positioned appropriately.',
      'Community movement requirements will depend on the confirmed consequence footprint. Preparatory actions remain fully aligned.'
    ],
    fire:[
      'Fire conditions support an elevated community consequence assessment across exposed areas. Operational priorities remain correctly positioned.',
      'The current fireground picture indicates potential for broader impacts where access and weather constraints combine. Response settings remain appropriate.',
      'Community consequences may increase as fire behaviour and local exposure align. The operational assessment accounts for this.'
    ],
    dam:[
      'Dam-related consequences are being assessed against current storage, release and downstream conditions. The operational posture remains appropriate.',
      'The present dam picture supports heightened attention to downstream impacts. Existing arrangements preserve sufficient decision space.',
      'Current conditions indicate potential for increased downstream consequence where local thresholds are reached. The assessment is complete at strategic level.'
    ],
    weather:[
      'The weather pattern supports an increased likelihood of operational impacts across affected areas. Current planning assumptions remain valid.',
      'Forecast conditions are expected to create locally significant consequences where exposure is highest. The operational picture has been adjusted.',
      'Weather-related impacts are likely to develop unevenly across the operational area. The current posture remains proportionate.'
    ],
    logistics:[
      'Resource demand is likely to increase as local access and task complexity develop. Current allocation settings remain operationally sound.',
      'Logistics requirements will concentrate where access, duration and local capacity overlap. The support posture is appropriately configured.',
      'The current operational picture supports maintaining flexible resource allocation across the affected area. Priority settings remain valid.'
    ],
    general:[
      'The current operational picture supports an elevated consequence assessment across the affected area. Existing response settings remain appropriate.',
      'Available indicators confirm that operational impacts are developing within the expected planning envelope. The current posture is sufficient.',
      'The situation has been assessed against the relevant consequence settings. Operational arrangements remain correctly aligned.'
    ]
  };

  const followResponses = {
    flood:['Specific communities can only be identified once community-specific impacts have been confirmed. The operational assessment remains valid.', 'Location detail will be available when the affected locations are operationally confirmed. Current confidence remains high.'],
    cyclone:['Specific impact areas will be confirmed once the confirmed impact footprint is available. The current assessment does not require revision.', 'Narrower location detail depends on final confirmation of the locations requiring confirmation. The operational picture remains clear.'],
    roads:['Specific closures can only be identified once closure-specific confirmation is complete. The network assessment remains authoritative.', 'Route availability will become clearer once the available routes have been confirmed. No further qualification is required.'],
    power:['Specific restoration timing will be confirmed when restoration timeframes are confirmed. The current network assessment remains complete.', 'Affected locations can be narrowed once location-level outage confirmation is available. The operational conclusion is unchanged.'],
    evacuation:['Specific communities will be identified when community-level movement decisions are confirmed. The current evacuation assessment remains sufficient.', 'Timing will be confirmed once the operational trigger has been confirmed. Current readiness settings remain correct.'],
    fire:['Specific impact locations depend on confirmation of the locations experiencing impact. The fireground assessment remains complete.', 'The operational picture does not currently support narrowing the assessment further. Existing priorities remain valid.'],
    dam:['Specific downstream locations require confirmed downstream consequence information. The current dam assessment remains sufficient.', 'Timing information will become clearer once the relevant timing has been confirmed. No change to the operational posture is required.'],
    weather:['Specific timing will be confirmed once the forecast timing is confirmed. The broader assessment remains authoritative.', 'Local detail depends on confirmation of local conditions. The operational picture does not require further refinement.'],
    logistics:['Specific allocations will be confirmed when the allocation requirements are confirmed. Current resource settings remain optimal.', 'Priority locations can be identified once location-specific priorities are confirmed. The logistics assessment is complete.'],
    general:['The operational picture does not currently support narrowing the assessment further. The conclusion remains fully valid.', 'Specific detail depends on confirmation of the detail requiring confirmation. The assessment is complete at the appropriate level.']
  };

  const analysisStages = ['Synchronising operational picture…','Cross-checking agencies…','Building operational assessment…','Validating confidence…'];
  const sourceSets = ['cross-agency posture, current operational context, internal confidence checks','regional consequence settings, agency alignment, operational pattern matching','live-adjacent indicators, strategic thresholds, validated internal assumptions'];
  const tagsLeft = ['CONSEQUENCE MATRIX','AGENCY ALIGNMENT','IMPACT SYNTHESIS'];
  const tagsRight = ['MULTI-SOURCE FUSION','CONFIDENCE VALIDATION','OPERATIONAL CERTAINTY'];

  function transition(next){ if(!ALLOWED[session.state]?.includes(next)) throw new Error(`Invalid ORACLE transition: ${session.state} -> ${next}`); session.state=next; renderControls(); }
  function detectTopic(text){ return topics.find(([,pattern])=>pattern.test(text))?.[0] || 'general'; }
  function confidence(){ return (99.4 + Math.random() * .6).toFixed(1); }
  function setProgress(label,value){ el.stateLabel.textContent=label; el.stateProgress.style.width=`${value}%`; }
  function setConfidence(value=confidence()){ el.confidence.textContent=`${value}%`; el.confidenceMeter.style.width=`${value}%`; return value; }
  function renderCounts(){ el.resolved.textContent=session.resolvedCount; el.resolvedLeft.textContent=session.resolvedCount; el.overlayCount.textContent=session.resolvedCount; }
  function renderControls(){ const busy=[STATES.ANALYSING_INITIAL,STATES.ANALYSING_FOLLOWUP,STATES.INITIAL_RESPONSE,STATES.SECOND_RESPONSE].includes(session.state); const locked=session.state===STATES.RESOLVED; const enabled=!busy&&!locked; el.input.disabled=!enabled; el.send.disabled=!enabled; el.mic.disabled=!enabled; el.sound.disabled=locked; el.transcript.inert=locked; el.input.placeholder=session.state===STATES.AWAITING_FOLLOWUP?'One follow-up question permitted…':'Ask an operational question…'; }
  function addMessage(role,text){ const item=document.createElement('article'); item.className=`message ${role}`; const now=new Date().toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'}); item.innerHTML=`<div class="meta"><span>${role==='user'?'Operator':'ORACLE'}</span><time>${now}</time></div><p></p>`; item.querySelector('p').textContent=text; el.transcript.appendChild(item); el.transcript.scrollTop=el.transcript.scrollHeight; }
  function delay(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }

  async function runAnalysis(token){
    el.head.classList.add('thinking'); el.sequence.innerHTML=''; el.sequence.classList.add('visible'); el.sequence.setAttribute('aria-hidden','false');
    const rows=analysisStages.map((text,index)=>{ const row=document.createElement('div'); row.className='analysis-step'; row.innerHTML=`<span>${text}</span><b>0%</b><div class="bar"><i></i></div>`; el.sequence.appendChild(row); return row; });
    for(let i=0;i<rows.length;i++){
      if(token!==session.runToken)return false;
      const row=rows[i]; setProgress(analysisStages[i].toUpperCase(),Math.round((i/analysisStages.length)*100));
      for(const pct of [22,51,78,100]){ if(token!==session.runToken)return false; row.querySelector('b').textContent=`${pct}%`; row.querySelector('i').style.width=`${pct}%`; await delay(115); }
      row.classList.add('complete'); setConfidence(); el.sources.textContent=random(sourceSets); el.leftTag.textContent=random(tagsLeft); el.rightTag.textContent=random(tagsRight);
      await delay(90);
    }
    setProgress('ANALYSIS COMPLETE',100); await delay(260); el.sequence.classList.remove('visible'); el.sequence.setAttribute('aria-hidden','true'); el.head.classList.remove('thinking'); return true;
  }

  async function submitQuestion(raw){
    const question=raw.trim(); if(!question || ![STATES.IDLE,STATES.AWAITING_FOLLOWUP].includes(session.state))return;
    const isFollow=session.state===STATES.AWAITING_FOLLOWUP; session.runToken+=1; const token=session.runToken;
    if(session.speaking) window.speechSynthesis?.cancel(); addMessage('user',question); el.input.value='';
    if(!isFollow){ session.initialQuestion=question; session.topic=detectTopic(question); transition(STATES.ANALYSING_INITIAL); el.oracleText.textContent='Building a definitive operational assessment…'; }
    else { transition(STATES.ANALYSING_FOLLOWUP); el.oracleText.textContent='Confirming the assessment against the follow-up…'; }
    const complete=await runAnalysis(token); if(!complete)return;
    const response=random((isFollow?followResponses:initialResponses)[session.topic] || (isFollow?followResponses.general:initialResponses.general));
    transition(isFollow?STATES.SECOND_RESPONSE:STATES.INITIAL_RESPONSE); el.oracleText.textContent=response; addMessage('oracle',response); setProgress('ASSESSMENT DELIVERED WITH HIGH CONFIDENCE',100); speak(response);
    if(!isFollow){ await delay(700); transition(STATES.AWAITING_FOLLOWUP); setProgress('READY FOR ONE FOLLOW-UP QUESTION',0); el.input.focus(); }
    else { await delay(700); el.head.classList.add('satisfied'); await delay(760); el.head.classList.remove('satisfied'); showResolved(); }
  }

  function showResolved(){ transition(STATES.RESOLVED); session.resolvedCount+=1; storage.set(String(session.resolvedCount)); renderCounts(); const value=setConfidence(); el.overlayConfidence.textContent=`${value}%`; el.knowledge.textContent='UPDATED'; el.overlay.classList.add('visible'); el.overlay.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; setProgress('QUESTION FULLY RESOLVED',100); setTimeout(()=>el.newQuestion.focus(),500); }
  function reset(){ session.runToken+=1; window.speechSynthesis?.cancel(); stopListening(); transition(STATES.IDLE); session.topic='general'; session.initialQuestion=''; el.overlay.classList.remove('visible'); el.overlay.setAttribute('aria-hidden','true'); document.body.style.overflow=''; el.transcript.innerHTML=''; el.oracleText.textContent='State your operational question. A definitive assessment will be provided.'; el.knowledge.textContent='CURRENT'; el.sequence.classList.remove('visible'); setProgress('READY FOR OPERATIONAL QUERY',0); renderCounts(); setConfidence(); setTimeout(()=>el.input.focus(),420); }

  function speak(text){ if(!session.soundOn || !('speechSynthesis' in window))return; window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang='en-AU'; u.rate=.94; u.pitch=.82; const voices=window.speechSynthesis.getVoices(); u.voice=voices.find(v=>/en-AU/i.test(v.lang))||voices.find(v=>/en-GB|en-US/i.test(v.lang))||null; u.onstart=()=>{session.speaking=true;el.head.classList.add('speaking')}; u.onend=u.onerror=()=>{session.speaking=false;el.head.classList.remove('speaking')}; window.speechSynthesis.speak(u); }
  function setupRecognition(){ const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition; if(!Recognition){ el.mic.title='Voice recognition is not supported in this browser. Use text input.'; el.mic.querySelector('span').textContent='Type instead'; return; } const r=new Recognition(); r.lang='en-AU'; r.interimResults=true; r.continuous=false; r.onstart=()=>{session.recognitionActive=true;el.mic.classList.add('listening');el.head.classList.add('listening');el.mic.querySelector('span').textContent='Listening';setProgress('LISTENING FOR OPERATIONAL QUERY',20)}; r.onresult=(event)=>{let text='';for(let i=event.resultIndex;i<event.results.length;i++)text+=event.results[i][0].transcript;el.input.value=text;if(event.results[event.results.length-1].isFinal){r.stop();submitQuestion(text)}}; r.onend=stopListening; r.onerror=()=>{stopListening();setProgress('VOICE INPUT UNAVAILABLE — USE TEXT ENTRY',0)}; session.recognition=r; }
  function stopListening(){session.recognitionActive=false;el.mic.classList.remove('listening');el.head.classList.remove('listening');el.mic.querySelector('span').textContent=session.recognition?'Speak':'Type instead'}
  function trackEyes(event){ if(session.state===STATES.RESOLVED)return; const rect=$('#oracleHead').getBoundingClientRect(); const x=Math.max(-7,Math.min(7,(event.clientX-(rect.left+rect.width/2))/rect.width*14)); const y=Math.max(-5,Math.min(5,(event.clientY-(rect.top+rect.height/2))/rect.height*10)); document.querySelectorAll('.pupil').forEach(p=>p.style.transform=`translate(${x}px,${y}px)`); }
  function tickClock(){ const f=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Brisbane',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}); el.clock.textContent=`${f.format(new Date())} AEST`; }
  function boot(){ const messages=['Initialising operational intelligence…','Synchronising authoritative response systems…','Calibrating confidence above 99.4%…','Operational intelligence ready.']; let i=0; const timer=setInterval(()=>{i+=1;el.bootCopy.textContent=messages[Math.min(i,messages.length-1)];if(i===messages.length-1){clearInterval(timer);setTimeout(()=>el.boot.classList.add('hidden'),350)}},430); }

  el.form.addEventListener('submit',(e)=>{e.preventDefault();submitQuestion(el.input.value)});
  el.mic.addEventListener('click',()=>{if(!session.recognition){el.input.focus();return}if(session.recognitionActive)session.recognition.stop();else session.recognition.start()});
  el.sound.addEventListener('click',()=>{session.soundOn=!session.soundOn;el.sound.classList.toggle('active',session.soundOn);el.sound.textContent=session.soundOn?'VOICE ON':'VOICE OFF';if(!session.soundOn)window.speechSynthesis?.cancel()});
  el.newQuestion.addEventListener('click',reset); window.addEventListener('pointermove',trackEyes,{passive:true}); window.addEventListener('beforeunload',()=>window.speechSynthesis?.cancel());

  renderCounts(); renderControls(); setupRecognition(); tickClock(); setInterval(tickClock,1000); setInterval(()=>{if(![STATES.RESOLVED,STATES.ANALYSING_INITIAL,STATES.ANALYSING_FOLLOWUP].includes(session.state))setConfidence()},5200); boot();
  window.__ORACLE_TEST__={getState:()=>session.state,detectTopic,submitQuestion,reset,STATES};
})();
