let score = 0, timer, mode = "classic", duration = 10, p1 = 0, p2 = 0;

document.getElementById("startGameBtn").onclick = () => {
  mode = document.getElementById("mode").value;
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("gameUI").classList.remove("hidden");

  if (mode === "duel") {
    document.getElementById("duelArea").classList.remove("hidden");
    document.getElementById("scoreClassic").classList.add("hidden");
  } else {
    document.getElementById("duelArea").classList.add("hidden");
    document.getElementById("scoreClassic").classList.remove("hidden");
  }

  startCountdown();
};

document.getElementById("clickButton").onclick = () => {
  score++;
  document.getElementById("score").innerText = score;
};

document.getElementById("clickP1").onclick = () => {
  p1++;
  document.getElementById("scoreP1").innerText = p1;
};

document.getElementById("clickP2").onclick = () => {
  p2++;
  document.getElementById("scoreP2").innerText = p2;
};

document.getElementById("restartBtn").onclick = () => location.reload();

document.getElementById("themeSwitch").onchange = (e) => {
  document.body.classList.toggle("dark", e.target.checked);
};

function startCountdown() {
  let count = 3;
  const cd = document.getElementById("countdown");
  cd.classList.remove("hidden");
  cd.innerText = count;

  const interval = setInterval(() => {
    count--;
    cd.innerText = count;
    if (count === 0) {
      clearInterval(interval);
      cd.classList.add("hidden");
      startGame();
    }
  }, 1000);
}

function startGame() {
  let timeLeft = duration;
  document.getElementById("timerBar").style.width = "100%";

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timerBar").style.width = (timeLeft / duration) * 100 + "%";
    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame();
    }
  }, 1000);
}

function endGame() {
  document.getElementById("gameOver").classList.remove("hidden");
  if (mode === "duel") {
    const result = document.getElementById("finalDuel");
    result.classList.remove("hidden");
    result.innerHTML = p1 === p2 ? "Draw!" : (p1 > p2 ? "Player 1 Wins!" : "Player 2 Wins!");
  } else {
    document.getElementById("finalClassic").classList.remove("hidden");
    document.getElementById("finalScore").innerText = score;
  }
  confetti();
}
