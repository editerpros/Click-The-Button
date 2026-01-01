/* =========================
   HELPERS
========================= */
const $ = id => document.getElementById(id);
const exists = id => !!document.getElementById(id);

function safeBind(id, fn){
  const el = $(id);
  if(el) el.onclick = fn;
}

/* =========================
   DEBUG OVERLAY
========================= */
const debugOverlay = $("debugOverlay");
function dbg(msg){
  if(debugOverlay) debugOverlay.textContent = msg;
}

/* =========================
   SAFE SCREEN ROUTER
========================= */
let current = "homeScreen";

function show(id){
  const target = $(id);
  if(!target){
    console.warn("[UI] Missing screen:", id);
    return;
  }
  document.querySelectorAll(".screen").forEach(s=>{
    s.classList.remove("active");
  });
  target.classList.add("active");
  current = id;
}

/* =========================
   GAME STATE & STATS
========================= */
let mode = "classic";
let p1 = 0, p2 = 0;
let time = 10;
let loop = null;

const stats = JSON.parse(localStorage.getItem("stats")) || {
  high: 0,
  games: 0,
  duels: 0,
  clicks: 0
};

/* =========================
   ACHIEVEMENTS
========================= */
const achievements = [
  { id:"first", text:"First Click", check:()=>stats.clicks>=1 },
  { id:"ten", text:"10 Games Played", check:()=>stats.games>=10 },
  { id:"duel", text:"First Duel", check:()=>stats.duels>=1 },
  { id:"hundred", text:"100 Clicks", check:()=>stats.clicks>=100 }
];

function renderAchievements(){
  if(!exists("achievementList")) return;
  const list = $("achievementList");
  list.innerHTML = "";
  achievements.forEach(a=>{
    const li = document.createElement("li");
    li.textContent = (a.check() ? "✅ " : "⬜ ") + a.text;
    list.appendChild(li);
  });
}

/* =========================
   🌍 LANGUAGE SYSTEM (FULL)
========================= */
const languageSelect = $("languageSelect");

function applyLanguage(lang){
  if(!window.LANG || !LANG[lang]){
    console.warn("Language not found:", lang);
    return;
  }

  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.dataset.i18n;
    if(LANG[lang][key]){
      el.textContent = LANG[lang][key];
    }
  });

  localStorage.setItem("lang", lang);
}

if(languageSelect){
  // Populate dropdown dynamically
  languageSelect.innerHTML = "";
  Object.keys(LANG).forEach(code=>{
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = code.toUpperCase();
    languageSelect.appendChild(opt);
  });

  const savedLang = localStorage.getItem("lang") || "en";
  languageSelect.value = savedLang;

  languageSelect.onchange = e => applyLanguage(e.target.value);

  // Apply language on load
  applyLanguage(savedLang);
}


/* =========================
   CONTROLS CONFIG
========================= */
const controls = JSON.parse(localStorage.getItem("controls")) || {
  keyboard: { p1:"Space", p2:"Enter" },
  pads: { p1:null, p2:null }
};

localStorage.setItem("controls", JSON.stringify(controls));

/* =========================
   KEY REMAPPING (SAFE)
========================= */
let waitingKey = null;

const bindP1Key = $("bindP1Key");
const bindP2Key = $("bindP2Key");
const p1KeyLabel = $("p1KeyLabel");
const p2KeyLabel = $("p2KeyLabel");

if(p1KeyLabel) p1KeyLabel.textContent = controls.keyboard.p1;
if(p2KeyLabel) p2KeyLabel.textContent = controls.keyboard.p2;

if(bindP1Key) bindP1Key.onclick = ()=> waitingKey = "p1";
if(bindP2Key) bindP2Key.onclick = ()=> waitingKey = "p2";

document.addEventListener("keydown", e=>{
  if(waitingKey){
    controls.keyboard[waitingKey] = e.code;
    localStorage.setItem("controls", JSON.stringify(controls));
    if(p1KeyLabel) p1KeyLabel.textContent = controls.keyboard.p1;
    if(p2KeyLabel) p2KeyLabel.textContent = controls.keyboard.p2;
    waitingKey = null;
    return;
  }

  if(e.code === controls.keyboard.p1) clickP1();
  if(mode==="duel" && e.code === controls.keyboard.p2) clickP2();
});

/* =========================
   PLAYER JOIN (STABLE)
========================= */
let joinStep = 1;
let joinLock = false;

function startJoin(){
  joinStep = 1;
  if(exists("joinP1")) $("joinP1").classList.add("active");
  if(exists("joinP2")) $("joinP2").classList.remove("active");
  show("joinScreen");
}

/* =========================
   GAMEPAD INPUT (SAFE)
========================= */
function pollGamepads(){
  const gps = navigator.getGamepads();
  dbg(`Screen:${current} | Pads:${gps.filter(Boolean).length}`);

  // Join screen only
  if(current === "joinScreen"){
    gps.forEach(gp=>{
      if(!gp) return;
      if(gp.buttons.some(b=>b.pressed) && !joinLock){
        joinLock = true;
        setTimeout(()=>joinLock=false,500);

        if(joinStep === 1){
          controls.pads.p1 = gp.index;
          joinStep = 2;
          if(exists("joinP1")) $("joinP1").classList.remove("active");
          if(exists("joinP2")) $("joinP2").classList.add("active");
        }else{
          controls.pads.p2 = gp.index;
          localStorage.setItem("controls", JSON.stringify(controls));
          show("gameUI");
          startGame();
        }
      }
    });
    requestAnimationFrame(pollGamepads);
    return;
  }

  // Gameplay input
  if(controls.pads.p1 !== null && gps[controls.pads.p1]?.buttons[0]?.pressed){
    clickP1();
  }
  if(mode==="duel" && controls.pads.p2 !== null && gps[controls.pads.p2]?.buttons[0]?.pressed){
    clickP2();
  }

  requestAnimationFrame(pollGamepads);
}
requestAnimationFrame(pollGamepads);

/* =========================
   GAME LOGIC
========================= */
function startGame(){
  p1 = 0; p2 = 0; time = 10;
  if(exists("p1Score")) $("p1Score").textContent = 0;
  if(exists("p2Score")) $("p2Score").textContent = 0;
  if(exists("timerBar")) $("timerBar").style.width = "100%";

  clearInterval(loop);
  loop = setInterval(()=>{
    time--;
    if(exists("timerBar")){
      $("timerBar").style.width = (time/10*100) + "%";
    }
    if(time <= 0) endGame();
  },1000);
}

function clickP1(){
  if(time > 0){
    p1++;
    stats.clicks++;
    if(exists("p1Score")) $("p1Score").textContent = p1;
  }
}

function clickP2(){
  if(time > 0 && mode==="duel"){
    p2++;
    stats.clicks++;
    if(exists("p2Score")) $("p2Score").textContent = p2;
  }
}

function endGame(){
  clearInterval(loop);
  stats.games++;
  if(mode==="duel") stats.duels++;
  if(p1 > stats.high) stats.high = p1;
  localStorage.setItem("stats", JSON.stringify(stats));

  if(exists("finalScore")){
    $("finalScore").textContent =
      mode==="classic" ? `Score: ${p1}` : `P1 ${p1} | P2 ${p2}`;
  }
  show("gameOver");
}

/* =========================
   UI BINDINGS (SAFE)
========================= */
safeBind("clickButton", clickP1);

safeBind("playBtn", ()=>show("modeScreen"));
safeBind("statsBtn", ()=>{
  if(exists("statHigh")) $("statHigh").textContent = stats.high;
  if(exists("statGames")) $("statGames").textContent = stats.games;
  if(exists("statDuels")) $("statDuels").textContent = stats.duels;
  if(exists("statClicks")) $("statClicks").textContent = stats.clicks;
  show("statsScreen");
});

safeBind("achievementsBtn", ()=>{
  renderAchievements();
  show("achievementsScreen");
});

safeBind("settingsBtn", ()=>show("settingsScreen"));
safeBind("aboutBtn", ()=>show("aboutScreen"));

document.querySelectorAll("[data-back]").forEach(b=>{
  b.onclick = ()=>show("homeScreen");
});

document.querySelectorAll("[data-mode]").forEach(b=>{
  b.onclick = ()=>{
    mode = b.dataset.mode;
    if(mode === "duel"){
      startJoin();
    }else{
      show("gameUI");
      startGame();
    }
  };
});

safeBind("restartBtn", ()=>{
  show("gameUI");
  startGame();
});

safeBind("homeBtn", ()=>show("homeScreen"));
safeBind("joinSkip", ()=>{
  show("gameUI");
  startGame();
});

/* =========================
   INIT
========================= */
show("homeScreen");

/* =========================
   📱 MOBILE / TOUCH / POINTER FIX
========================= */
const clickBtn = document.getElementById("clickButton");

if(clickBtn){
  let lastTap = 0;

  const safeTap = e => {
    e.preventDefault();
    const now = Date.now();
    if(now - lastTap < 60) return; // debounce
    lastTap = now;
    clickP1();
  };

  clickBtn.addEventListener("pointerdown", safeTap);
  clickBtn.addEventListener("touchstart", safeTap, { passive:false });
  clickBtn.addEventListener("mousedown", safeTap);
}
