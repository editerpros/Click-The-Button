// --- DOM Shortcuts ---
const $ = id => document.getElementById(id);

// --- Variables ---
let score = 0, p1 = 0, p2 = 0, timer;
let mode = "classic", duration = 10;
let gamesPlayed = 0, totalClicks = 0, highScore = 0, wins = 0, losses = 0, draws = 0;
let unlockedAchievements = new Set();

let settings = { darkMode: false, sound: true, duration: 10 };
let profile = { name: "Player", avatar: "👤" };

// --- Load Game Data ---
window.onload = () => {
  const data = JSON.parse(localStorage.getItem("clickGameData")) || {};
  Object.assign(settings, data.settings || {});
  Object.assign(profile, JSON.parse(localStorage.getItem("clickGameProfile")) || {});

  gamesPlayed = data.gamesPlayed || 0;
  totalClicks = data.totalClicks || 0;
  highScore = data.highScore || 0;
  wins = data.wins || 0;
  losses = data.losses || 0;
  draws = data.draws || 0;
  unlockedAchievements = new Set(data.achievements || []);

  applySettings();
  loadProfile();
};

// --- Save Game Data ---
function saveData() {
  localStorage.setItem("clickGameData", JSON.stringify({
    settings, gamesPlayed, totalClicks, highScore, wins, losses, draws,
    achievements: Array.from(unlockedAchievements)
  }));
  localStorage.setItem("clickGameProfile", JSON.stringify(profile));
}

function applySettings() {
  document.body.classList.toggle("dark", settings.darkMode);
  $("themeSwitch").checked = settings.darkMode;
  $("soundToggle").checked = settings.sound;
  $("durationSelect").value = settings.duration;
}

// --- Profile ---
function loadProfile() {
  $("playerNameDisplay").textContent = profile.avatar + " " + profile.name;
  $("playerNameInput").value = profile.name;
  $("playerAvatarInput").value = profile.avatar;
}

$("openProfileBtn").onclick = () => {
  loadProfile();
  $("startScreen").classList.add("hidden");
  $("profileScreen").classList.remove("hidden");
};

$("saveProfileBtn").onclick = () => {
  profile.name = $("playerNameInput").value || "Player";
  profile.avatar = $("playerAvatarInput").value || "👤";
  saveData();
  $("profileScreen").classList.add("hidden");
  $("startScreen").classList.remove("hidden");
  loadProfile();
};

$("closeProfileBtn").onclick = () => {
  $("profileScreen").classList.add("hidden");
  $("startScreen").classList.remove("hidden");
};

// --- Sounds & Vibration ---
function vibrate(ms) { if (navigator.vibrate) navigator.vibrate(ms); }
function playSound(id) { if (settings.sound) $(id)?.play(); }

// --- Countdown Before Game ---
function startCountdown() {
  let count = 3;
  $("countdown").classList.remove("hidden");
  $("countdown").innerText = count;
  const interval = setInterval(() => {
    count--;
    playSound("tickSound");
    $("countdown").innerText = count;
    if (count <= 0) {
      clearInterval(interval);
      $("countdown").classList.add("hidden");
      startGame();
    }
  }, 1000);
}

// --- Start Game ---
function startGame() {
  let timeLeft = settings.duration;
  $("timerBar").style.width = "100%";
  timer = setInterval(() => {
    timeLeft--;
    $("timerBar").style.width = (timeLeft / settings.duration) * 100 + "%";
    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame();
    }
  }, 1000);
}

// --- End Game ---
function endGame() {
  playSound("buzzerSound");
  $("gameOver").classList.remove("hidden");

  if (mode === "duel") {
    const result = $("finalDuel");
    result.classList.remove("hidden");
    if (p1 === p2) {
      draws++;
      result.innerText = "Draw!";
      unlockAchievement("Draw Duelist");
    } else {
      if (p1 > p2) { wins++; result.innerText = "Player 1 Wins!"; }
      else { losses++; result.innerText = "Player 2 Wins!"; }
      unlockAchievement("Duel Winner");
    }
  } else {
    $("finalClassic").classList.remove("hidden");
    $("finalScore").innerText = score;
    if (score > highScore) highScore = score;

    const playerName = prompt("Enter your name for the leaderboard:") || profile.name;
    submitScoreToAirtable(playerName, score, mode);
  }

  confetti();
  saveData();
}

// --- Click Handlers ---
$("clickButton").onclick = () => {
  score++;
  totalClicks++;
  vibrate(10);
  playSound("clickSound");
  $("score").innerText = score;
  if (score === 1) unlockAchievement("First Click!");
  if (score === 100) unlockAchievement("Click Champion");
};

$("clickP1").onclick = () => { p1++; $("scoreP1").innerText = p1; vibrate(10); playSound("clickSound"); };
$("clickP2").onclick = () => { p2++; $("scoreP2").innerText = p2; vibrate(10); playSound("clickSound"); };

// --- Start Button ---
$("startGameBtn").onclick = () => {
  mode = $("mode").value;
  $("startScreen").classList.add("hidden");
  $("gameUI").classList.remove("hidden");
  gamesPlayed++; p1 = p2 = score = 0;

  $("score").innerText = "0";
  $("scoreP1").innerText = "0";
  $("scoreP2").innerText = "0";

  if (mode === "duel") {
    $("duelArea").classList.remove("hidden");
    $("scoreClassic").classList.add("hidden");
  } else {
    $("duelArea").classList.add("hidden");
    $("scoreClassic").classList.remove("hidden");
  }

  if (gamesPlayed === 3) unlockAchievement("Replay Enthusiast");
  startCountdown();
};

$("restartBtn").onclick = () => location.reload();

// --- Share Score ---
$("shareScoreBtn").onclick = () => {
  const text = `I got ${score} clicks in ${settings.duration}s on Click the Button! 💥 Can you beat me?`;
  navigator.clipboard.writeText(text).then(() => {
    const box = $("achievementBox");
    box.innerText = "📤 Score copied to clipboard!";
    box.classList.remove("hidden");
    setTimeout(() => box.classList.add("hidden"), 3000);
  });
};

// --- Achievements Data ---
const allAchievements = [
  { id: "First Click!", hint: "Click the button once.", icon: "🖱️", progressKey: "score", target: 1 },
  { id: "Click Champion", hint: "Reach 100 clicks in a game.", icon: "🏆", progressKey: "score", target: 100 },
  { id: "Replay Enthusiast", hint: "Play 3 games total.", icon: "🔁", progressKey: "gamesPlayed", target: 3 },
  { id: "Duel Winner", hint: "Win a duel match.", icon: "⚔️", progressKey: "wins", target: 1 },
  { id: "Draw Duelist", hint: "Draw a duel match.", icon: "🎯", progressKey: "draws", target: 1 }
];

function getProgressValue(key) {
  switch (key) {
    case "score": return score;
    case "gamesPlayed": return gamesPlayed;
    case "wins": return wins;
    case "draws": return draws;
    default: return 0;
  }
}

function unlockAchievement(title) {
  if (unlockedAchievements.has(title)) return;
  unlockedAchievements.add(title);
  $("achievementBox").innerText = `🏆 Achievement Unlocked: ${title}`;
  $("achievementBox").classList.remove("hidden");
  setTimeout(() => $("achievementBox").classList.add("hidden"), 4000);
  playSound("chimeSound");
  saveData();
}

$("openAchievementsBtn").onclick = () => {
  const list = $("achievementList");
  list.innerHTML = "";

  allAchievements.forEach(ach => {
    const unlocked = unlockedAchievements.has(ach.id);
    const current = getProgressValue(ach.progressKey);
    const percent = Math.min(100, (current / ach.target) * 100);

    const li = document.createElement("li");
    li.setAttribute("data-icon", ach.icon);
    li.innerHTML = unlocked
      ? `<strong>✅ ${ach.id}</strong>`
      : `<strong>🔒 ${ach.id}</strong><br><small>${ach.hint}</small>`;

    const bar = document.createElement("div");
    bar.className = "achievement-progress";

    const inner = document.createElement("div");
    inner.className = "achievement-progress-inner";
    inner.style.width = `${percent}%`;

    bar.appendChild(inner);
    li.appendChild(bar);
    list.appendChild(li);
  });

  $("startScreen").classList.add("hidden");
  $("achievementsScreen").classList.remove("hidden");
};

$("closeAchievementsBtn").onclick = () => {
  $("achievementsScreen").classList.add("hidden");
  $("startScreen").classList.remove("hidden");
};

$("shareAchievementsBtn").onclick = () => {
  const unlocked = allAchievements.filter(a => unlockedAchievements.has(a.id));
  const text = "🏆 My Achievements: " + unlocked.map(a => a.icon + " " + a.id).join(", ");
  navigator.clipboard.writeText(text).then(() => {
    const box = $("achievementBox");
    box.innerText = "📤 Achievements copied to clipboard!";
    box.classList.remove("hidden");
    setTimeout(() => box.classList.add("hidden"), 3000);
  });
};

// --- Stats Screen ---
$("openStatsBtn").onclick = () => {
  $("statTotalClicks").innerText = totalClicks;
  $("statGamesPlayed").innerText = gamesPlayed;
  $("statHighScore").innerText = highScore;
  $("statWins").innerText = wins;
  $("statLosses").innerText = losses;
  $("statDraws").innerText = draws;
  $("startScreen").classList.add("hidden");
  $("statsScreen").classList.remove("hidden");
};
$("closeStatsBtn").onclick = () => {
  $("statsScreen").classList.add("hidden");
  $("startScreen").classList.remove("hidden");
};

// --- Settings ---
$("openSettingsBtn").onclick = () => {
  $("startScreen").classList.add("hidden");
  $("settingsScreen").classList.remove("hidden");
};

$("closeSettingsBtn").onclick = () => {
  $("settingsScreen").classList.add("hidden");
  $("startScreen").classList.remove("hidden");
};

$("themeSwitch").onchange = e => {
  settings.darkMode = e.target.checked;
  applySettings();
  saveData();
};

$("soundToggle").onchange = e => {
  settings.sound = e.target.checked;
  saveData();
};

$("durationSelect").onchange = e => {
  settings.duration = parseInt(e.target.value);
  saveData();
};

$("resetDataBtn").onclick = () => {
  localStorage.removeItem("clickGameData");
  localStorage.removeItem("clickGameProfile");
  location.reload();
};

// --- Leaderboard ---
const AIRTABLE_BASE_ID = "app2Bw8BfUuGjla7d";
const AIRTABLE_API_KEY = "pat5Xh1kFnwDgPaBI";
const AIRTABLE_TABLE_NAME = "Scores";

async function submitScoreToAirtable(name, score, mode) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
  const data = { fields: { Name: name || "Anonymous", Score: score, Mode: mode } };

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}

async function fetchTopScores(limit = 10) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?sort[0][field]=Score&sort[0][direction]=desc&maxRecords=${limit}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
  });
  const result = await response.json();
  return result.records || [];
}

$("openLeaderboardBtn").onclick = async () => {
  const list = $("leaderboardList");
  list.innerHTML = "Loading...";
  const scores = await fetchTopScores();
  list.innerHTML = "";

  scores.forEach(record => {
    const { Name, Score, Mode } = record.fields;
    const li = document.createElement("li");
    li.textContent = `${Name || "Anonymous"} - ${Score} (${Mode})`;
    list.appendChild(li);
  });

  $("startScreen").classList.add("hidden");
  $("leaderboardScreen").classList.remove("hidden");
};

$("closeLeaderboardBtn").onclick = () => {
  $("leaderboardScreen").classList.add("hidden");
  $("startScreen").classList.remove("hidden");
};

