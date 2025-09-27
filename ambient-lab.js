// Ambient Lab app: UI wrapper around UnifiedModel to compute light/blueband/thermal metrics.
(function(){
  function ensureAppRegistered(){
    if (!window.corridorApps || !window.UnifiedModel) return false;
    const um = new window.UnifiedModel();

    function createAmbientLabApp(){
      // Minimal self-contained UI with controls for 7 sources and thermal params
      // Uses inline script handlers via ambientLab namespace
      if (!window.ambientLab){ window.ambientLab = {}; }
      const S = window.ambientLab;
      S.state = S.state || {
        phiDeg: 0, psiDeg: 0, F0: 0.2,
        I: [120, 100, 90, 80, 90, 100, 110],
        Tdir: [1,1,1,1,1,1,1],
        Mmods: [[],[],[],[],[],[],[]],
        glintIdx: [1,2,3,4,5,6], // azimuthal active by default
        C: 20000, k_sol: 0.02, k_loss: 1.5, T: 22, T_amb: 20, q: 0, dt: 60,
      };

      S.recompute = function(){
        const st = S.state;
        const phi = (st.phiDeg||0) * Math.PI/180;
        const psi = (st.psiDeg||0) * Math.PI/180;
        const dir = um.directionSet(phi, psi);
        const I0 = st.I.slice();
        const I = um.applyGlint(I0, dir.cosTheta, st.glintIdx, st.F0||0);
        const E7 = um.escapeSum(I, dir.cosTheta, st.Tdir);
        const Emod = um.escapeWithModifiers(I, dir.cosTheta, st.Tdir, st.Mmods);
        const dTss = um.thermalSteady(st.k_sol, st.k_loss, I, dir.cosTheta, st.Tdir, st.q||0);
        const Tnext = um.thermalStep(st.T, st.dt, st.C, st.k_sol, st.k_loss, st.T_amb, st.q, I, dir.cosTheta, st.Tdir);

        // Simple spectral demo: use scaled broadband as spectral baseline (placeholder), but plumb real data if provided.
        const lam = um.lambda;
        const Lspec = I.map(Ii => lam.map(()=> Ii/lam.length));
        const Tspec = st.Tdir.map(Ti => lam.map(()=> Ti));
        const spec = um.spectralBlueband(dir.cosTheta, Lspec, Tspec, lam);

        const out = document.getElementById('al-out');
        if (out){
          out.innerHTML = `
            <div class="al-grid">
              <div class="al-card"><div class="k">E_escape (7-dir)</div><div class="v">${E7.toFixed(2)}</div></div>
              <div class="al-card"><div class="k">Ẽ_escape (+mods)</div><div class="v">${Emod.toFixed(2)}</div></div>
              <div class="al-card"><div class="k">Blueband EB</div><div class="v">${spec.EB.toFixed(2)}</div></div>
              <div class="al-card"><div class="k">BRI = EB/Evis</div><div class="v">${spec.BRI.toFixed(3)}</div></div>
              <div class="al-card"><div class="k">ΔT_ss</div><div class="v">${dTss.toFixed(2)} °C</div></div>
              <div class="al-card"><div class="k">T_{k+1}</div><div class="v">${Tnext.toFixed(2)} °C</div></div>
            </div>`;
        }
        return {E7, Emod, spec, dTss, Tnext};
      };

      S.onInput = function(ev){
        const el = ev.target;
        const id = el.id;
        const val = el.type==='number' || el.type==='range' ? parseFloat(el.value) : el.value;
        if (id === 'phi') S.state.phiDeg = val;
        else if (id === 'psi') S.state.psiDeg = val;
        else if (id === 'F0') S.state.F0 = val;
        else if (id.startsWith('I-')) { const i=+id.split('-')[1]; S.state.I[i]=val; }
        else if (id.startsWith('T-')) { const i=+id.split('-')[1]; S.state.Tdir[i]=val; }
        else if (id === 'C') S.state.C = val;
        else if (id === 'k_sol') S.state.k_sol = val;
        else if (id === 'k_loss') S.state.k_loss = val;
        else if (id === 'T') S.state.T = val;
        else if (id === 'T_amb') S.state.T_amb = val;
        else if (id === 'q') S.state.q = val;
        else if (id === 'dt') S.state.dt = val;
        S.recompute();
      };

      // Timeline runner state and UI rendering
      S.state.timelinePhases = S.state.timelinePhases || [
        { name:'Morning', duration: 1800, s:1, w:1, phiDeg: 0, psiDeg: 0, I_scale:1, T_scale:1, T_amb: 20, q: 0 },
        { name:'Noon',    duration: 1800, s:1, w:1.2, phiDeg: 30, psiDeg: 5, I_scale:1.2, T_scale:1, T_amb: 24, q: 0 }
      ];
      S.renderTimelineRows = function(){
        const c = document.getElementById('al-tl-rows'); if (!c) return;
        const rows = S.state.timelinePhases.map((p,idx)=>`
          <div class="tl-row">
            <input aria-label="Name" value="${p.name}" onchange="ambientLab.onPhaseInput(event,${idx},'name')">
            <input aria-label="Duration (s)" type="number" min="1" step="1" value="${p.duration}" onchange="ambientLab.onPhaseInput(event,${idx},'duration')">
            <input aria-label="s(t)" type="number" min="0" max="1" step="0.05" value="${p.s}" onchange="ambientLab.onPhaseInput(event,${idx},'s')">
            <input aria-label="w(t)" type="number" min="0" max="3" step="0.05" value="${p.w}" onchange="ambientLab.onPhaseInput(event,${idx},'w')">
            <input aria-label="φ (deg)" type="number" step="1" value="${p.phiDeg}" onchange="ambientLab.onPhaseInput(event,${idx},'phiDeg')">
            <input aria-label="ψ (deg)" type="number" step="1" value="${p.psiDeg}" onchange="ambientLab.onPhaseInput(event,${idx},'psiDeg')">
            <input aria-label="I scale" type="number" min="0" step="0.05" value="${p.I_scale}" onchange="ambientLab.onPhaseInput(event,${idx},'I_scale')">
            <input aria-label="T scale" type="number" min="0" step="0.05" value="${p.T_scale}" onchange="ambientLab.onPhaseInput(event,${idx},'T_scale')">
            <input aria-label="T_amb" type="number" step="0.1" value="${p.T_amb}" onchange="ambientLab.onPhaseInput(event,${idx},'T_amb')">
            <input aria-label="q_ctrl" type="number" step="0.1" value="${p.q}" onchange="ambientLab.onPhaseInput(event,${idx},'q')">
            <button class="tl-del" onclick="ambientLab.removePhase(${idx})">×</button>
          </div>`).join('');
        c.innerHTML = rows || '<div style="color:rgba(255,255,255,.7)">No phases. Add one to begin.</div>';
      };
      S.onPhaseInput = function(ev, idx, key){
        const v = ev.target.type === 'number' ? parseFloat(ev.target.value) : ev.target.value;
        S.state.timelinePhases[idx][key] = isNaN(v) ? ev.target.value : v;
      };
      S.addPhase = function(){ S.state.timelinePhases.push({ name:'Phase', duration:600, s:1, w:1, phiDeg:0, psiDeg:0, I_scale:1, T_scale:1, T_amb:S.state.T_amb, q:0 }); S.renderTimelineRows(); };
      S.addPreset = function(kind){
        const base = { s:1, w:1, I_scale:1, T_scale:1, q:0 };
        if (kind==='Morning'){
          S.state.timelinePhases.push({ name:'Morning', duration:3600, s:1, w:1.0, phiDeg:-60, psiDeg:2, I_scale:0.8, T_scale:1, T_amb:18, q:0 });
        } else if (kind==='Noon'){
          S.state.timelinePhases.push({ name:'Noon', duration:3600, s:1, w:1.2, phiDeg:20, psiDeg:5, I_scale:1.2, T_scale:1, T_amb:24, q:0 });
        } else if (kind==='Evening'){
          S.state.timelinePhases.push({ name:'Evening', duration:3600, s:1, w:0.9, phiDeg:60, psiDeg:-2, I_scale:0.9, T_scale:1, T_amb:20, q:0 });
        }
        S.renderTimelineRows();
      };
      S.removePhase = function(i){ S.state.timelinePhases.splice(i,1); S.renderTimelineRows(); };

      S.runTimeline = function(){
        const dtInput = document.getElementById('tl-dt');
        const dt = parseFloat(dtInput?.value||S.state.dt||60);
        const baseI = S.state.I.slice();
        const baseT = S.state.Tdir.slice();
        let T = S.state.T;
        const tArr = []; const tempArr = []; const cumE = [];
        let t = 0; let Eacc = 0;
        for (const p of S.state.timelinePhases){
          const steps = Math.max(1, Math.round(p.duration / dt));
          for (let k=0;k<steps;k++){
            const phi = (p.phiDeg||0) * Math.PI/180;
            const psi = (p.psiDeg||0) * Math.PI/180;
            const dir = um.directionSet(phi, psi);
            const I = baseI.map(x=> x * (p.I_scale||1));
            const Tdir = baseT.map(x=> x * (p.T_scale||1));
            const sum = um.escapeSum(I, dir.cosTheta, Tdir);
            const s = (p.s!=null)?p.s:1; const w = (p.w!=null)?p.w:1;
            const inc = dt * s * w * sum;
            Eacc += inc;
            T = um.thermalStep(T, dt, S.state.C, S.state.k_sol, S.state.k_loss, p.T_amb!=null?p.T_amb:S.state.T_amb, p.q!=null?p.q:S.state.q, I, dir.cosTheta, Tdir);
            t += dt;
            tArr.push(t); tempArr.push(T); cumE.push(Eacc);
          }
        }
        S.timeline = { t: tArr, T: tempArr, cumE, E_total: Eacc };
        // Update summary labels
        const lbl = document.getElementById('al-tl-summary');
        if (lbl) lbl.textContent = `Total exposure EΔ = ${Eacc.toFixed(2)} (arbitrary units)`;
        S.drawTimeline();
        S.prepareLive();
      };
      S.drawTimeline = function(){
        if (!S.timeline) return;
        const DPR = Math.min(2, window.devicePixelRatio||1);
        function drawLine(canvas, data, color, markerIdx){
          const ctx = canvas.getContext('2d');
          const w = canvas.clientWidth||600, h = canvas.clientHeight||160; canvas.width = Math.floor(w*DPR); canvas.height = Math.floor(h*DPR); canvas.style.width = w+'px'; canvas.style.height = h+'px'; ctx.scale(DPR,DPR); ctx.clearRect(0,0,w,h);
          // Grid
          ctx.fillStyle='rgba(255,255,255,.08)'; for(let x=8;x<w;x+=16){ for(let y=8;y<h;y+=16){ ctx.fillRect(x,y,1,1);} }
          if (!data || data.length===0) return;
          const min = Math.min(...data), max = Math.max(...data);
          const span = (max-min)||1; ctx.lineWidth=2; const grd=ctx.createLinearGradient(0,0,w,0); grd.addColorStop(0,'#00ffd5'); grd.addColorStop(1,'#00c8ff'); ctx.strokeStyle=grd; ctx.beginPath();
          data.forEach((v,i)=>{ const x=(i/(data.length-1))*w; const y=h - ((v-min)/span)*h; if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); }); ctx.stroke();
          // Axes minimal ticks
          ctx.fillStyle='rgba(198,245,255,.85)'; ctx.font='12px Inter, system-ui, sans-serif'; ctx.fillText(min.toFixed(2), 4, h-4); ctx.fillText(max.toFixed(2), 4, 12);
          // Marker
          if (typeof markerIdx === 'number' && data.length>1){ const x=(markerIdx/(data.length-1))*w; ctx.strokeStyle='rgba(255,215,0,.9)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
        }
        const cT = document.getElementById('al-temp-canvas'); if (cT) drawLine(cT, S.timeline.T, '#00ffd5', S.live?.idx);
        const cE = document.getElementById('al-expo-canvas'); if (cE) drawLine(cE, S.timeline.cumE, '#FFD700', S.live?.idx);
      };

      // Live playback (optional)
      S.prepareLive = function(){
        S.live = { idx: 0, playing: false, handle: null };
        const slider = document.getElementById('tl-live');
        if (slider && S.timeline){ slider.max = Math.max(0, S.timeline.T.length-1); slider.value = '0'; }
        const btn = document.getElementById('tl-live-play'); if (btn) btn.textContent = 'Play';
        const cur = document.getElementById('tl-live-cur'); if (cur) cur.textContent = 't=0s';
      };
      S.onLiveSeek = function(ev){ if (!S.timeline) return; S.live = S.live||{idx:0}; S.live.idx = Math.max(0, Math.min(S.timeline.T.length-1, parseInt(ev.target.value||'0',10))); S.drawTimeline(); S.updateLiveLabel(); };
      S.toggleLiveEnable = function(enabled){ const box = document.getElementById('tl-live-controls'); if (box) box.style.display = enabled? 'flex':'none'; if (!enabled) S.stopLive(); };
      S.updateLiveLabel = function(){ if (!S.timeline || !S.live) return; const i=S.live.idx; const tLab=document.getElementById('tl-live-cur'); if (tLab){ const tVal = S.timeline.t[i]||0; tLab.textContent = `t=${Math.round(tVal)}s · T=${S.timeline.T[i].toFixed(2)}°C · E=${S.timeline.cumE[i].toFixed(2)}`; } };
      S.playPause = function(){ if (!S.timeline) return; S.live = S.live||{idx:0,playing:false}; if (S.live.playing){ S.stopLive(); } else { S.startLive(); } };
      S.startLive = function(){ if (!S.timeline) return; S.live.playing = true; const btn = document.getElementById('tl-live-play'); if (btn) btn.textContent = 'Pause'; const slider=document.getElementById('tl-live'); const step = 1; const tick = ()=>{ if (!S.live.playing) return; if (S.live.idx >= S.timeline.T.length-1){ S.stopLive(); return; } S.live.idx += step; if (slider) slider.value=String(S.live.idx); S.drawTimeline(); S.updateLiveLabel(); S.live.handle = requestAnimationFrame(tick); }; S.live.handle = requestAnimationFrame(tick); };
      S.stopLive = function(){ if (!S.live) return; S.live.playing = false; if (S.live.handle) cancelAnimationFrame(S.live.handle); const btn = document.getElementById('tl-live-play'); if (btn) btn.textContent = 'Play'; };

      // Initial output render scheduled after DOM injection
      setTimeout(()=> { S.recompute(); S.renderTimelineRows(); }, 0);
      window.addEventListener('resize', ()=> S.drawTimeline());

      return `
        <style>
          .al-wrap{display:flex;flex-direction:column;gap:12px;height:100%}
          .al-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
          .al-card{border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:12px;background:rgba(255,255,255,.06)}
          .al-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
          .al-card .k{font-size:12px;color:rgba(255,255,255,.7)} .al-card .v{font-size:20px;font-weight:800}
          .al-controls{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
          .al-controls .al-card{padding:8px}
          .al-controls input{width:100%}
          .tl-head, .tl-row{display:grid;grid-template-columns:1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1fr 32px;gap:6px;align-items:center}
          .tl-head{font-size:12px;color:rgba(255,255,255,.75);margin-bottom:6px}
          .tl-row input{width:100%}
          .tl-del{background:transparent;border:1px solid rgba(255,255,255,.25);border-radius:8px;color:#fff;cursor:pointer}
          .tl-add,.tl-run{background:linear-gradient(90deg, rgba(0,200,255,.20), rgba(0,255,213,.14));border:1px solid rgba(0,200,255,.35);border-radius:10px;color:#e6fdff;padding:6px 10px;cursor:pointer}
          .tl-plots{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px}
          .plot{border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:8px;background:rgba(255,255,255,.04)}
          .plot-title{font-size:12px;color:rgba(255,255,255,.8);margin-bottom:4px}
          @media(max-width:900px){.al-grid{grid-template-columns:repeat(2,1fr)} .al-row{grid-template-columns:1fr}}
        </style>
        <div class="al-wrap">
          <div class="al-row">
            <div class="al-card">
              <div style="font-weight:700;margin-bottom:6px">Geometry & Glint</div>
              <label>Yaw φ (deg) <input id="phi" type="range" min="-180" max="180" step="1" value="${S.state.phiDeg}" oninput="ambientLab.onInput(event)"></label>
              <label>Tilt ψ (deg) <input id="psi" type="range" min="-80" max="80" step="1" value="${S.state.psiDeg}" oninput="ambientLab.onInput(event)"></label>
              <label>Glint F0 <input id="F0" type="range" min="0" max="1" step="0.01" value="${S.state.F0}" oninput="ambientLab.onInput(event)"></label>
              <div style="font-size:12px;color:rgba(255,255,255,.8);margin-top:6px">G(θ)=1+F0(\u221A(1/cos²θ)−1) ≈ 1+F0(secθ−1)</div>
            </div>
            <div class="al-card">
              <div style="font-weight:700;margin-bottom:6px">Thermal (Dynamic)</div>
              <div class="al-controls" style="grid-template-columns:repeat(6,1fr)">
                <label>C<input id="C" type="number" step="100" value="${S.state.C}" onchange="ambientLab.onInput(event)"></label>
                <label>k_sol<input id="k_sol" type="number" step="0.001" value="${S.state.k_sol}" onchange="ambientLab.onInput(event)"></label>
                <label>k_loss<input id="k_loss" type="number" step="0.01" value="${S.state.k_loss}" onchange="ambientLab.onInput(event)"></label>
                <label>T<input id="T" type="number" step="0.1" value="${S.state.T}" onchange="ambientLab.onInput(event)"></label>
                <label>T_amb<input id="T_amb" type="number" step="0.1" value="${S.state.T_amb}" onchange="ambientLab.onInput(event)"></label>
                <label>q_ctrl<input id="q" type="number" step="0.1" value="${S.state.q}" onchange="ambientLab.onInput(event)"></label>
                <label>Δt(s)<input id="dt" type="number" step="1" value="${S.state.dt}" onchange="ambientLab.onInput(event)"></label>
              </div>
            </div>
          </div>

          <div class="al-card">
            <div style="font-weight:700;margin-bottom:6px">Seven-source Inputs (I_i, T_i)</div>
            <div class="al-controls">
              ${Array.from({length:7}).map((_,i)=>`<div class="al-card"><div>i=${i}</div>
                <label>I<input id="I-${i}" type="number" step="1" value="${S.state.I[i]}" onchange="ambientLab.onInput(event)"></label>
                <label>T<input id="T-${i}" type="number" min="0" max="1" step="0.01" value="${S.state.Tdir[i]}" onchange="ambientLab.onInput(event)"></label>
              </div>`).join('')}
            </div>
          </div>

          <div id="al-out" class="al-card">Computing…</div>

          <div class="al-card">
            <div style="font-weight:700;margin-bottom:6px">Timeline Runner (Exposure + Thermal Trace)</div>
            <div class="tl-head">
              <div>Phase</div><div>Duration(s)</div><div>s(t)</div><div>w(t)</div><div>φ</div><div>ψ</div><div>I×</div><div>T×</div><div>T_amb</div><div>q_ctrl</div><div></div>
            </div>
            <div id="al-tl-rows" class="tl-body"></div>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
              <button class="tl-add" onclick="ambientLab.addPhase()">+ Add Phase</button>
              <div style="display:flex;gap:6px;align-items:center">
                <span style="font-size:12px;color:rgba(255,255,255,.75)">Presets:</span>
                <button class="tl-add" onclick="ambientLab.addPreset('Morning')">Morning</button>
                <button class="tl-add" onclick="ambientLab.addPreset('Noon')">Noon</button>
                <button class="tl-add" onclick="ambientLab.addPreset('Evening')">Evening</button>
              </div>
              <label>Δt(s) <input id="tl-dt" type="number" step="1" value="${S.state.dt}"></label>
              <button class="tl-run" onclick="ambientLab.runTimeline()">Run Timeline</button>
              <div id="al-tl-summary" style="margin-left:auto;color:rgba(255,255,255,.85)">Total exposure EΔ = 0.00</div>
            </div>
            <div class="tl-plots">
              <div class="plot"><div class="plot-title">Temperature (°C)</div><canvas id="al-temp-canvas" width="600" height="160" style="width:100%;height:160px"></canvas></div>
              <div class="plot"><div class="plot-title">Cumulative Exposure</div><canvas id="al-expo-canvas" width="600" height="160" style="width:100%;height:160px"></canvas></div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
              <label style="display:inline-flex;align-items:center;gap:6px"><input type="checkbox" onchange="ambientLab.toggleLiveEnable(this.checked)"> Live playback</label>
              <div id="tl-live-controls" style="display:none;gap:8px;align-items:center;flex:1">
                <input id="tl-live" type="range" min="0" max="0" step="1" value="0" oninput="ambientLab.onLiveSeek(event)" style="flex:1">
                <button id="tl-live-play" class="tl-add" onclick="ambientLab.playPause()">Play</button>
                <div id="tl-live-cur" style="font-size:12px;color:rgba(255,255,255,.8)">t=0s</div>
              </div>
            </div>
          </div>
        </div>`;
    }

    // Register app with CorridorApps
    if (!window.corridorApps.apps.has('ambient-lab')){
      window.corridorApps.apps.set('ambient-lab', {
        name: 'Ambient Lab',
        icon: '🌤️',
        category: 'labs',
        createWindow: createAmbientLabApp
      });
    }
    return true;
  }

  // Try immediately, and on DOMContentLoaded as fallback
  if (!ensureAppRegistered()){
    document.addEventListener('DOMContentLoaded', ensureAppRegistered);
  }
})();
