/* script.js — duel achievements removed; classic only */

/* helper */
const $ = id => document.getElementById(id);

/* ---------------------------
   APP STATE & STORAGE
----------------------------*/
const state = {
  profile: { name: "Player", avatar: "👤" },
  stats: { totalClicks: 0, gamesPlayed: 0, highScore: 0, wins: 0, losses: 0, draws: 0 },
  settings: { darkMode: false, sound: true, duration: 10, theme: "blue" },
  achievements: {} // initialized later
};

function save() { localStorage.setItem("ctb_state", JSON.stringify(state)); }
function load() {
  try {
    const s = JSON.parse(localStorage.getItem("ctb_state"));
    if (s) {
      Object.assign(state.profile, s.profile || {});
      Object.assign(state.stats, s.stats || {});
      Object.assign(state.settings, s.settings || {});
      state.achievements = s.achievements || {};
    }
  } catch (e) {}
}
load();

/* ---------------------------
   ACHIEVEMENTS METADATA
   (duel-related entries removed)
----------------------------*/
const achievementsData = {
  // GENERAL
  firstClick:    { id: "firstClick",    cat: "general", icon: "🖱️", title: "First Click", desc: "Make your first click.", goal: 1 },
  play5:         { id: "play5",         cat: "general", icon: "🎮", title: "Rookie Player", desc: "Play 5 games.", goal: 5 },
  play25:        { id: "play25",        cat: "general", icon: "💠", title: "Veteran", desc: "Play 25 games.", goal: 25 },

  // CLICKS
  score50:       { id: "score50",       cat: "clicks", icon: "🏆", title: "Clicker 50", desc: "Score 50 in one game.", goal: 50, perGame: true },
  score100:      { id: "score100",      cat: "clicks", icon: "🔥", title: "Clicker 100", desc: "Score 100 in one game.", goal: 100, perGame: true },
  score250:      { id: "score250",      cat: "clicks", icon: "🚀", title: "Machine", desc: "Score 250 in one game.", goal: 250, perGame: true },
  total1000:     { id: "total1000",     cat: "clicks", icon: "📈", title: "1K Total Clicks", desc: "Accumulate 1,000 total clicks.", goal: 1000 },
  total5000:     { id: "total5000",     cat: "clicks", icon: "📊", title: "5K Total Clicks", desc: "Accumulate 5,000 total clicks.", goal: 5000 },

  // TIME / SECRET
  fast50:        { id: "fast50",        cat: "time", icon: "⚡", title: "Speed Demon", desc: "Get 50 clicks within a 10s round.", goal: 50, timeLimit: 10, perGame: true },
  secretTap:     { id: "secretTap",     cat: "secret", icon: "🔍", title: "Hidden Button", desc: "Find the hidden tap area.", goal: 1, secret: true },
  perfectClick:  { id: "perfectClick",  cat: "secret", icon: "🎯", title: "Perfect Timing", desc: "Tap exactly when the countdown hits 0.", goal: 1, secret: true },

  // CUSTOM (kept non-duel custom achievements)
  marathon:      { id: "marathon",      cat: "custom", icon: "🏃", title: "Marathon", desc: "Play 50 games total.", goal: 50 }
};

function initAchievementsState() {
  if (!state.achievements || typeof state.achievements !== "object") state.achievements = {};
  Object.keys(achievementsData).forEach(k => {
    if (!state.achievements[k]) {
      state.achievements[k] = { unlocked: false, progress: 0, goal: achievementsData[k].goal || 1 };
    } else {
      state.achievements[k].progress = state.achievements[k].progress || 0;
      state.achievements[k].unlocked = !!state.achievements[k].unlocked;
      state.achievements[k].goal = achievementsData[k].goal || state.achievements[k].goal || 1;
    }
  });
  save();
}
initAchievementsState();

/* ---------------------------
   NAVIGATION UTIL
----------------------------*/
const screens = ["homeScreen","gameUI","gameOver","settingsScreen","profileScreen","statsScreen","achievementsScreen","aboutScreen"];
function hideAll(){ screens.forEach(id => { const el=$(id); if(el) el.classList.add("hidden"); }); }
function showScreen(id){
  hideAll();
  const el=$(id); if(!el) return;
  el.classList.remove("hidden"); el.classList.add("ios-screen");
  setTimeout(()=>el.classList.remove("ios-screen"),600);
}

/* ---------------------------
   HAPTICS
----------------------------*/
function haptic(type="light"){ if(!("vibrate" in navigator)) return; if(type==="light") navigator.vibrate(8); if(type==="medium") navigator.vibrate(18); if(type==="heavy") navigator.vibrate(30); }

/* ---------------------------
   THEME / PROFILE UI
----------------------------*/
function applyTheme(){
  document.body.classList.remove("theme-blue","theme-red","theme-green","theme-purple");
  document.body.classList.add("theme-"+state.settings.theme);
  document.body.classList.toggle("dark", state.settings.darkMode);
  const durationSelect=$("durationSelect"), themeSelect=$("themeSelect"), themeSwitch=$("themeSwitch"), soundToggle=$("soundToggle");
  if(durationSelect) durationSelect.value = state.settings.duration;
  if(themeSelect) themeSelect.value = state.settings.theme;
  if(themeSwitch) themeSwitch.checked = state.settings.darkMode;
  if(soundToggle) soundToggle.checked = state.settings.sound;
}
function loadProfileUI(){ const nameDisplay=$("playerNameDisplay"); if(nameDisplay) nameDisplay.textContent = `${state.profile.avatar} ${state.profile.name}`; const nameInput=$("playerNameInput"), avatarInput=$("playerAvatarInput"); if(nameInput) nameInput.value = state.profile.name; if(avatarInput) avatarInput.value = state.profile.avatar; }
applyTheme(); loadProfileUI();

/* ---------------------------
   ACHIEVEMENT UI
----------------------------*/
function buildAchievementsUI(filter="all", search=""){
  const container = $("achList");
  if(!container) return;
  container.innerHTML = "";
  Object.keys(achievementsData).forEach(k=>{
    const meta = achievementsData[k];
    if(filter !== "all" && meta.cat !== filter) return;
    if(search && !(meta.title.toLowerCase().includes(search) || meta.desc.toLowerCase().includes(search))) return;
    const st = state.achievements[k] || { unlocked:false, progress:0, goal: meta.goal };
    const percent = Math.min(100, Math.round((st.progress/st.goal)*100));
    const card = document.createElement("div");
    card.className = "ach-card " + (st.unlocked ? "ach-unlocked" : "ach-locked");
    card.innerHTML = `
      <div class="ach-top">
        <div class="ach-icon">${meta.icon}</div>
        <div style="flex:1">
          <div class="ach-title">${meta.title}</div>
          <div class="ach-desc">${meta.desc}</div>
        </div>
      </div>
      <div class="ach-progress"><div class="ach-bar" data-key="${k}" style="width:${percent}%"></div></div>
      <div class="ach-meta">
        <div class="percent">${percent}%</div>
        <div class="action-row">
          ${st.unlocked ? '<div class="ach-share" data-key="'+k+'">Share</div>' : '<div class="ach-share disabled" title="Locked">Locked</div>'}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}
buildAchievementsUI();

/* ---------------------------
   ACHIEVEMENT HELPERS
----------------------------*/
function setProgress(key, value){
  if(!achievementsData[key]) return;
  const st = state.achievements[key]; if(!st) return; if(st.unlocked) return;
  st.progress = Math.min(st.goal, st.progress + value);
  const bar = document.querySelector(`.ach-bar[data-key="${key}"]`);
  if(bar){ const percent = Math.min(100, Math.round((st.progress/st.goal)*100)); bar.style.width = percent + "%"; const percentNode = bar.closest(".ach-card")?.querySelector(".percent"); if(percentNode) percentNode.textContent = percent + "%"; }
  if(st.progress >= st.goal){ st.unlocked = true; save(); const card = document.querySelector(`.ach-bar[data-key="${key}"]`)?.closest(".ach-card"); if(card){ card.classList.remove("ach-locked"); card.classList.add("ach-unlocked"); try{ if(typeof confetti==="function") confetti(); }catch(e){} showBanner("Achievement Unlocked", achievementsData[key].title); haptic("heavy"); } }
  save();
}

function trackClickEvent(amount=1){ state.stats.totalClicks += amount; setProgress("total1000", amount); setProgress("total5000", amount); if(!state.achievements.firstClick?.unlocked && state.stats.totalClicks >= 1) setProgress("firstClick", 1); save(); }

function trackEndOfGame(perGameScore, options = {}){ if(perGameScore >= 50) setProgress("score50", achievementsData.score50.goal); if(perGameScore >= 100) setProgress("score100", achievementsData.score100.goal); if(perGameScore >= 250) setProgress("score250", achievementsData.score250.goal); if(options.fast50) setProgress("fast50", achievementsData.fast50.goal); setProgress("play5", 1); setProgress("play25", 1); setProgress("marathon", 1); save(); }

function trackSecret(id){ if(id === "secretTap") setProgress("secretTap", 1); if(id === "perfectClick") setProgress("perfectClick", 1); save(); }

/* ---------------------------
   GLOBAL RIPPLE + HAPTIC
----------------------------*/
document.addEventListener("click", (e)=>{
  const button = e.target.closest("button, .app-tile, .dock-btn, .seg-item, .ach-share");
  if(!button) return;
  const span = document.createElement("span"); span.className = "ripple";
  const rect = button.getBoundingClientRect(); const size = Math.max(rect.width, rect.height);
  span.style.width = span.style.height = size + "px";
  span.style.left = (e.clientX - rect.left - size/2) + "px";
  span.style.top = (e.clientY - rect.top - size/2) + "px";
  span.style.background = document.body.classList.contains("theme-red") ? "rgba(255,75,75,.35)" : "rgba(255,255,255,.45)";
  button.appendChild(span); setTimeout(()=>span.remove(),700);
  button.classList.add("tap-anim"); setTimeout(()=>button.classList.remove("tap-anim"),220);
  haptic("light");
});

/* ---------------------------
   GAME LOGIC + UI BINDINGS
----------------------------*/
let gameTimer = 0, gameInterval = null, countdownInterval = null;
let score = 0;

function startCountdown(){ let n = 3; const cd = $("countdown"); if(!cd) return; cd.textContent = n; cd.classList.remove("hidden"); countdownInterval = setInterval(()=>{ n--; if(n>=0) cd.textContent = n; if(n<0){ clearInterval(countdownInterval); cd.classList.add("hidden"); startGame(); } }, 800); }

function startGame(){
  gameTimer = state.settings.duration;
  const total = gameTimer;
  $("timerBar").style.width = "100%";
  score = 0; if($("score")) $("score").textContent = score;
  const startTimestamp = Date.now();
  gameInterval = setInterval(()=>{
    gameTimer--;
    $("timerBar").style.width = (gameTimer / total) * 100 + "%";
    if(gameTimer <= 0){ clearInterval(gameInterval); const perGameScore = score; const elapsed = (Date.now() - startTimestamp) / 1000; const fast50 = (perGameScore >= 50 && elapsed <= 10); trackEndOfGame(perGameScore, { fast50 }); endGame(); }
  }, 1000);
}

function endGame(){
  clearInterval(gameInterval); clearInterval(countdownInterval);
  state.stats.gamesPlayed++;
  $("finalClassic")?.classList.remove("hidden");
  $("finalScore") && ($("finalScore").textContent = score);
  if(score > state.stats.highScore) state.stats.highScore = score;
  save();
  showScreen("gameOver");
}

/* BIND EVENTS */
document.addEventListener("DOMContentLoaded", ()=>{
  // home tile handlers
  document.querySelectorAll("[data-open]").forEach(el=>el.addEventListener("click", ev=>{ const target = ev.currentTarget.dataset.open; if(target) showScreen(target); }));

  // play tile starts countdown
  document.querySelectorAll(".app-tile[data-open='gameUI']").forEach(el=>el.addEventListener("click", ()=>{ showScreen("gameUI"); startCountdown(); }));

  // click button
  $("clickButton")?.addEventListener("click", ()=>{ score++; state.stats.totalClicks++; $("score").textContent = score; trackClickEvent(1); save(); });

  // end early / home / restart
  $("endEarlyBtn")?.addEventListener("click", ()=>{ clearInterval(gameInterval); endGame(); });
  $("backToHomeBtn")?.addEventListener("click", ()=>showScreen("homeScreen"));
  $("homeFromOverBtn")?.addEventListener("click", ()=>showScreen("homeScreen"));
  $("restartBtn")?.addEventListener("click", ()=>{ showScreen("gameUI"); startCountdown(); });

  // settings
  $("themeSwitch")?.addEventListener("change", (e)=>{ state.settings.darkMode = e.target.checked; applyTheme(); save(); });
  ["soundToggle","soundToggle2"].forEach(id => $(id) && $(id).addEventListener("change", (e)=>{ state.settings.sound = e.target.checked; save(); }));
  $("durationSelect")?.addEventListener("change", (e)=>{ state.settings.duration = parseInt(e.target.value); save(); });
  $("themeSelect")?.addEventListener("change", (e)=>{ state.settings.theme = e.target.value; applyTheme(); save(); });

  // profile save
  $("saveProfileBtn")?.addEventListener("click", ()=>{
    const name = ($("playerNameInput")?.value || "").trim();
    const avatar = ($("playerAvatarInput")?.value || "").trim();
    if(name) state.profile.name = name;
    if(avatar) state.profile.avatar = avatar;
    loadProfileUI(); save(); showBanner("Profile Updated", `${state.profile.avatar} ${state.profile.name}`);
  });

  // close screens
  ["closeSettingsBtn","closeProfileBtn","closeStatsBtn","closeAchievementsBtn","closeAboutBtn"].forEach(id=>{$(id) && $(id).addEventListener("click", ()=>showScreen("homeScreen"));});

  // reset
  $("resetDataBtn")?.addEventListener("click", ()=>{ if(!confirm("Reset all game data?")) return; localStorage.removeItem("ctb_state"); location.reload(); });

  // achievements open (button in HTML uses data-open so this is fallback)
  // if you have a dedicated 'openAchievementsBtn' element, it will also be handled by [data-open] above
  const cat = $("achCategoryFilter"); const s = $("achSearch");
  if(cat) cat.addEventListener("change", (e)=> buildAchievementsUI(e.target.value, (s?.value || "").toLowerCase()));
  if(s) s.addEventListener("input", (e)=> buildAchievementsUI((cat?.value || "all"), e.target.value.toLowerCase()));

  // share action
  document.addEventListener("click", (e)=>{ const share=e.target.closest(".ach-share[data-key]"); if(!share) return; const key = share.dataset.key; if(!key) return; const meta = achievementsData[key]; const text = `I unlocked '${meta.title}' in Click The Button! ${meta.desc}`; navigator.clipboard?.writeText(text).then(()=>showBanner("Copied to clipboard", meta.title)).catch(()=>showBanner("Copied (fallback)", meta.title)); });

  // stats open
  // if you have an 'openStatsBtn' it will be handled by [data-open]; this keeps compatibility
  $("statTotalClicks") && ($("statTotalClicks").textContent = state.stats.totalClicks);
  applyTheme(); loadProfileUI(); buildAchievementsUI();
});

/* ACHIEVEMENT BANNER */
let bannerTimeout = null;
function showBanner(title, sub){
  const banner = $("iosBanner"); if(!banner) return;
  $("iosBannerTitle").textContent = title; $("iosBannerSub").textContent = sub || "";
  banner.classList.remove("hidden"); banner.classList.add("popup-animate"); haptic("medium");
  clearTimeout(bannerTimeout);
  bannerTimeout = setTimeout(()=>{ banner.classList.remove("popup-animate"); banner.classList.add("hidden"); }, 2600);
}
