document.addEventListener("DOMContentLoaded", () => {
  // ---- Konfigurace výpočtu ----
  const COMMISSION_RATE = 0.30;        // 30 % z netto tržby
  const BASE_FULL_SHIFT = 1000;        // fix pro plnou směnu
  const BASE_HALF_SHIFT = 500;         // fix pro 1/2 směnu
  const THRESHOLD_FULL = 3330;         // hranice, od které se jede % (plná)
  const THRESHOLD_HALF = THRESHOLD_FULL / 2; // hranice pro 1/2 směnu
  const MIN_TRZBA_PER_KM = 15;

  // ---- Debug režim ----
  const params = new URLSearchParams(location.search);
  window.RB_DEBUG = (params.get('debug') === '1') || (localStorage.getItem('rb_debug') === '1');
  if (window.RB_DEBUG){
    const bar = document.createElement('div');
    bar.textContent = 'DEBUG MODE — detailní logy v konzoli (F12)';
    bar.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;padding:10px 12px;border-radius:12px;background:#111;color:#fff;text-align:center;z-index:9999;box-shadow:0 10px 20px rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.15)';
    document.addEventListener('DOMContentLoaded', ()=>document.body.appendChild(bar));
    window.addEventListener('error', (e)=>{ console.error('[GlobalError]', e.message, e.error); });
    console.info('[RB-TAXI] Debug mode ON', { ua: navigator.userAgent, theme: document.body.className });
  }
         // minimální požadavek (Kč/km)
  const THEME_MODE_KEY = 'rb_taxi_theme_mode';
  const THEME_KEY = 'rb_taxi_theme';

  const form = document.getElementById("calcForm");
  const output = document.getElementById("output");
  const resetBtn = document.getElementById("resetBtn");
  const pdfBtn = document.getElementById("pdfExport");
  const themeToggle = document.getElementById("themeToggle");
  const historyBox = document.getElementById("history");

  themeToggle.addEventListener("click", () => {
    const modeSelect = document.getElementById("themeMode");
    const order = ["auto","light","dark"];
    const current = modeSelect ? modeSelect.value : "auto";
    const next = order[(order.indexOf(current)+1)%order.length];
    if (modeSelect) {
      modeSelect.value = next;
      try{ localStorage.setItem(THEME_MODE_KEY, next);}catch(e){}
      try{ localStorage.setItem(THEME_KEY, next === 'light' ? 'light' : 'dark'); }catch(e){}
      modeSelect.dispatchEvent(new Event('change'));
    } else {
      // fallback: toggle light-mode only
      document.body.classList.toggle('light-mode');
      updateThemeChrome();
    }
  });

  const modeSelect = document.getElementById("themeMode");
  const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
  try{
    const savedMode = localStorage.getItem(THEME_MODE_KEY) || 'auto';
    if (modeSelect) modeSelect.value = savedMode;
    applyTheme(savedMode);
  }catch(e){ applyTheme('auto'); }
  if (modeSelect){
    modeSelect.addEventListener('change', () => {
      const mode = modeSelect.value;
      try{ localStorage.setItem(THEME_MODE_KEY, mode); }catch(e){}
      applyTheme(mode, true);
    });
  }
  mediaDark.addEventListener('change', () => {
    const savedMode = localStorage.getItem(THEME_MODE_KEY) || 'auto';
    if (savedMode === 'auto') applyTheme('auto', true);
  });
  function applyTheme(mode, animate=false){
    document.body.classList.remove('light-mode');
    if (mode === 'light') document.body.classList.add('light-mode');
    if (mode === 'auto'){
      if (window.matchMedia('(prefers-color-scheme: light)').matches) document.body.classList.add('light-mode');
    }
    if (animate){
      document.body.classList.add('theme-fade');
      setTimeout(()=>document.body.classList.remove('theme-fade'), 250);
    }
    updateThemeChrome();
  
  function updateThemeChrome(){
    const meta = document.querySelector('meta[name="theme-color"]');
    const isLight = document.body.classList.contains('light-mode');
    if (meta) meta.setAttribute('content', isLight ? '#ffffff' : '#0b0b0b');
  }
}
form.addEventListener("submit", e => {
    e.preventDefault();

    const driver = getValue("driverName");
    const shift = getValue("shiftType");
    const shiftLabelMap = { den: "Denní", noc: "Noční", odpo: "Odpolední", pul: "1/2 směna" };
    const shiftLabel = shiftLabelMap[shift] || shift;
    const km = getNumber("km");
    const trzba = getNumber("trzba");
    const pristavne = getNumber("pristavne");
    const palivo = getNumber("palivo");
    const myti = getNumber("myti");
    const kartou = getNumber("kartou");
    const fakturou = getNumber("fakturou");
    const jine = getNumber("jine");

    
    const netto = trzba - pristavne;
    const minTrzba = km * MIN_TRZBA_PER_KM;
    const nedoplatek = trzba < minTrzba;
    const doplatek = nedoplatek ? (minTrzba - trzba) : 0;

    // Výplata řidiče
    let vyplata = 0;
    const isHalf = (shift === "pul");
    const threshold = isHalf ? THRESHOLD_HALF : THRESHOLD_FULL;
    vyplata = (netto > threshold) ? (netto * COMMISSION_RATE) : (isHalf ? BASE_HALF_SHIFT : BASE_FULL_SHIFT);
    vyplata = Math.round(vyplata * 100) / 100;

    // K odevzdání (hotovost) – dle ukázky neodečítá přístavné ani výplatu
    const kOdevzdani = trzba - palivo - myti - kartou - fakturou - jine;

    const datum = new Date().toLocaleString("cs-CZ");

    const html = `
      <div class="title">📄 Výčetka řidiče</div>
      <div class="row"><div class="key">📅 Datum:</div><div class="val">${datum}</div></div>
      <div class="row"><div class="key">👤 Řidič:</div><div class="val">${driver}</div></div>
      <div class="row"><div class="key">🕒 Směna:</div><div class="val">${shiftLabel}</div></div>
      <div class="hr"></div>
      <div class="row"><div class="key">💰 Tržba:</div><div class="val">${trzba} Kč</div></div>
      <div class="row"><div class="key">⛽ Palivo:</div><div class="val">${palivo} Kč</div></div>
      <div class="row"><div class="key">🚗 Mytí:</div><div class="val">${myti} Kč</div></div>
      <div class="row"><div class="key">💳 Kartou:</div><div class="val">${kartou} Kč</div></div>
      <div class="row"><div class="key">🧾 Faktura:</div><div class="val">${fakturou} Kč</div></div>
      <div class="row"><div class="key">📍 Přístavné:</div><div class="val">${pristavne} Kč</div></div>
      <div class="row"><div class="key">💸 Jiné platby:</div><div class="val">${jine} Kč</div></div>
      <div class="hr"></div>
      <div class="row"><div class="key">📦 K odevzdání:</div><div class="val money-blue">${kOdevzdani.toFixed(2)} Kč</div></div>
      <div class="row"><div class="key">💼 Výplata řidiče:</div><div class="val money-green">${vyplata.toFixed(2)} Kč</div></div>
      ${nedoplatek ? `<div class="row"><div class="key">❗ Doplatek do minima:</div><div class="val money-red">${doplatek.toFixed(2)} Kč</div></div>` : ``}
      <div class="note">
        <label for="note"><strong>📝 Poznámka ke směně:</strong></label>
        <textarea id="note" rows="3" placeholder="Volitelná poznámka..."></textarea>
      </div>
    `;

    if (window.RB_DEBUG){ 
      console.group('[RB-TAXI] Výpočet');
      console.table({driver, shift, km, trzba, pristavne, palivo, myti, kartou, fakturou, jine, netto, minTrzba, doplatek, vyplata, kOdevzdani});
      console.groupEnd();
    }
    output.innerHTML = html;
    output.classList.remove("hidden");
    document.getElementById('actions').classList.remove('hidden');
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    output.classList.add("hidden");
    output.innerHTML = "";
    document.getElementById('actions').classList.add('hidden');
  });

  pdfBtn.addEventListener("click", () => { if(window.RB_DEBUG) console.time('[RB-TAXI] PDF export');
    html2canvas(output).then(canvas => {
      const img = canvas.toDataURL("image/png");
      const pdf = new window.jspdf.jsPDF();
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, width, height);
      pdf.save("vypocet.pdf"); if(window.RB_DEBUG) console.timeEnd('[RB-TAXI] PDF export');
    });
  
  // Sdílení výstupu
  const shareBtn = document.getElementById("shareBtn");
  const newShiftBtn = document.getElementById("newShiftBtn");

  shareBtn.addEventListener("click", async () => { if(window.RB_DEBUG) console.time('[RB-TAXI] Share');
    try{
      const text = output.innerText;
      if (navigator.share){
        await navigator.share({title:"Výčetka řidiče", text});
      }else{
        await navigator.clipboard.writeText(text);
        alert("Zkopírováno do schránky.");
      }
    }catch(e){ console.warn(e); if(window.RB_DEBUG) console.error('[RB-TAXI] Share error', e); }
  });

  newShiftBtn.addEventListener("click", () => { if(window.RB_DEBUG) console.log('[RB-TAXI] Nová směna');
    form.reset();
    output.innerHTML = "";
    output.classList.add("hidden");
    document.getElementById('actions').classList.add('hidden');
  });
});

  function getValue(id) {
    return document.getElementById(id).value.trim();
  }

  function getNumber(id) {
    return parseFloat(document.getElementById(id).value) || 0;
  }

  // Registrace service workeru pro PWA (pokud je podporováno)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(console.warn);
    });
  }
});
  
// Offline banner
  const offlineBanner = document.getElementById("offlineBanner");
  function updateOffline(){
    if (navigator.onLine){ offlineBanner.classList.add('hidden'); }
    else { offlineBanner.classList.remove('hidden'); }
  }
  window.addEventListener('online', updateOffline);
  window.addEventListener('offline', updateOffline);
  updateOffline();

  
  // Side Panel actions (replaces FAB)
  const panelToggle = document.getElementById('panelToggle');
  const panel = document.getElementById('sidePanel');
  const panelClose = document.getElementById('panelClose');
  const overlay = document.getElementById('overlay');
  const panelShare = document.getElementById('panelShare');
  const panelPdf = document.getElementById('panelPdf');
  const panelNew = document.getElementById('panelNew');

  function openPanel(){
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    overlay.classList.add('show'); overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden','false');
  }
  function closePanel(){
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
    setTimeout(()=>overlay.classList.add('hidden'), 250);
  }

  if(panelToggle){ panelToggle.addEventListener('click', openPanel); }
  if(panelClose){ panelClose.addEventListener('click', closePanel); }
  if(overlay){ overlay.addEventListener('click', closePanel); }
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closePanel(); });

  if(panelShare){
    panelShare.addEventListener('click', async ()=>{
      try{
        const text = output.innerText;
        if (navigator.share){ await navigator.share({title:"Výčetka řidiče", text}); }
        else{ await navigator.clipboard.writeText(text); alert("Zkopírováno do schránky."); }
        closePanel();
      }catch(e){ console.warn(e); if(window.RB_DEBUG) console.error('[RB-TAXI] Share error', e); }
    });
  }
  if(panelPdf){ panelPdf.addEventListener('click', ()=>{ document.getElementById('pdfExport').click(); closePanel(); }); }
  if(panelNew){ panelNew.addEventListener('click', ()=>{ document.getElementById('newShiftBtn').click(); closePanel(); }); }

