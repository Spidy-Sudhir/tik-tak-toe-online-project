const cells = document.querySelectorAll(".cell");
const playerInfo = document.getElementById("playerInfo");
const popup = document.getElementById("popup");
const popupText = document.getElementById("popupText");
const startPopup = document.getElementById("startPopup");
const winCanvas = document.getElementById("winCanvas");
const winCtx = winCanvas.getContext("2d");

let board = Array(9).fill("");
let player = "";
let robot = "";
let currentTurn = "";
let gameOver = false;
let difficulty = "hard";

const winPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// ✅ Proper canvas scaling fix
function resizeCanvas() {
  const wrapper = document.querySelector(".board-wrapper");
  const rect = wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  winCanvas.width = rect.width * dpr;
  winCanvas.height = rect.height * dpr;
  winCanvas.style.width = rect.width + "px";
  winCanvas.style.height = rect.height + "px";

  winCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getCellCenter(index) {
  const cell = cells[index];
  const wrapper = document.querySelector(".board-wrapper");

  const wRect = wrapper.getBoundingClientRect();
  const cRect = cell.getBoundingClientRect();

  return {
    x: cRect.left - wRect.left + cRect.width / 2,
    y: cRect.top - wRect.top + cRect.height / 2
  };
}

function drawWinLine(pattern, onDone) {
  resizeCanvas();

  const start = getCellCenter(pattern[0]);
  const end = getCellCenter(pattern[2]);

  let progress = 0;

  function animate() {
    progress += 0.04;
    if (progress > 1) progress = 1;

    winCtx.clearRect(0, 0, winCanvas.width, winCanvas.height);

    winCtx.beginPath();
    winCtx.moveTo(start.x, start.y);
    winCtx.lineTo(
      start.x + (end.x - start.x) * progress,
      start.y + (end.y - start.y) * progress
    );

    winCtx.strokeStyle = "#c084fc";
    winCtx.lineWidth = 6;
    winCtx.lineCap = "round";
    winCtx.shadowColor = "rgba(192,132,252,0.8)";
    winCtx.shadowBlur = 16;
    winCtx.stroke();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      setTimeout(onDone, 1000);
    }
  }

  animate();
}

function drawSymbolOnCell(cell, symbol) {
  cell.innerHTML = "";
  const size = cell.offsetWidth;

  const cvs = document.createElement("canvas");
  cvs.width = size;
  cvs.height = size;
  cvs.style.width = "100%";
  cvs.style.height = "100%";
  cell.appendChild(cvs);

  const c = cvs.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.28;

  c.lineWidth = size * 0.09;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.shadowBlur = 14;

  if (symbol === "X") {
    c.strokeStyle = "#c084fc";
    c.shadowColor = "rgba(192,132,252,0.7)";

    const lines = [
      { x1: cx - r, y1: cy - r, x2: cx + r, y2: cy + r },
      { x1: cx + r, y1: cy - r, x2: cx - r, y2: cy + r }
    ];

    let lineIndex = 0;
    let progress = 0;

    function animateX() {
      progress += 0.07;
      if (progress > 1) progress = 1;

      c.clearRect(0, 0, size, size);

      for (let i = 0; i < lineIndex; i++) {
        c.beginPath();
        c.moveTo(lines[i].x1, lines[i].y1);
        c.lineTo(lines[i].x2, lines[i].y2);
        c.stroke();
      }

      const ln = lines[lineIndex];
      c.beginPath();
      c.moveTo(ln.x1, ln.y1);
      c.lineTo(
        ln.x1 + (ln.x2 - ln.x1) * progress,
        ln.y1 + (ln.y2 - ln.y1) * progress
      );
      c.stroke();

      if (progress < 1) {
        requestAnimationFrame(animateX);
      } else if (lineIndex === 0) {
        lineIndex = 1;
        progress = 0;
        requestAnimationFrame(animateX);
      }
    }

    animateX();
  } else {
    c.strokeStyle = "#f472b6";
    c.shadowColor = "rgba(244,114,182,0.7)";

    let progress = 0;

    function animateO() {
      progress += 0.06;
      if (progress > 1) progress = 1;

      c.clearRect(0, 0, size, size);
      c.beginPath();
      c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      c.stroke();

      if (progress < 1) requestAnimationFrame(animateO);
    }

    animateO();
  }
}

function minimax(boardState, isMaximizing) {
  const winner = getWinner(boardState);
  if (winner === robot) return 10;
  if (winner === player) return -10;
  if (!boardState.includes("")) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    boardState.forEach((val, i) => {
      if (!val) {
        boardState[i] = robot;
        best = Math.max(best, minimax(boardState, false));
        boardState[i] = "";
      }
    });
    return best;
  } else {
    let best = Infinity;
    boardState.forEach((val, i) => {
      if (!val) {
        boardState[i] = player;
        best = Math.min(best, minimax(boardState, true));
        boardState[i] = "";
      }
    });
    return best;
  }
}

function getWinner(boardState) {
  for (let [a, b, c] of winPatterns) {
    if (
      boardState[a] &&
      boardState[a] === boardState[b] &&
      boardState[b] === boardState[c]
    ) {
      return boardState[a];
    }
  }
  return null;
}

function getBestMove() {
  let bestScore = -Infinity;
  let bestMove = null;

  board.forEach((val, i) => {
    if (!val) {
      board[i] = robot;
      const score = minimax(board, false);
      board[i] = "";
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  });

  return bestMove;
}

function chooseSymbol(symbol) {
  player = symbol;
  robot = symbol === "X" ? "O" : "X";
  currentTurn = Math.random() > 0.5 ? player : robot;

  startPopup.style.display = "none";
  updateInfo();

  if (currentTurn === robot) {
    setTimeout(robotMove, 700);
  }
}

function updateInfo() {
  if (gameOver) return;

  playerInfo.innerText =
    currentTurn === player
      ? `Your turn (${player})`
      : `Robot is thinking... (${robot})`;
}

function makeMove(index, symbol) {
  if (board[index] || gameOver) return;

  board[index] = symbol;
  drawSymbolOnCell(cells[index], symbol);
  cells[index].classList.add("taken");

  checkResult();
}

function checkResult() {
  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;

    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      gameOver = true;
      playerInfo.innerText = "";

      drawWinLine(pattern, () => {
        popup.style.display = "flex";
        popupText.innerText =
          board[a] === player ? "You Won!🎉 Noice" : "Robot🤖 Won! You Lost noob";
      });

      return;
    }
  }

  if (!board.includes("")) {
    gameOver = true;
    setTimeout(() => {
      popup.style.display = "flex";
      popupText.innerText = "It's a Draw! 😅 Try to defeat Robot you noob";
    }, 600);
    return;
  }

  currentTurn = currentTurn === player ? robot : player;
  updateInfo();

  if (currentTurn === robot) {
    setTimeout(robotMove, 600);
  }
}

cells.forEach((cell) => {
  cell.addEventListener("click", () => {
    if (currentTurn !== player || gameOver) return;
    const index = Number(cell.dataset.index);
    makeMove(index, player);
  });
});

function robotMove() {
  if (gameOver) return;
  const index = getBestMove();
  if (index === null) return;
  makeMove(index, robot);
}

function restartGame() {
  board = Array(9).fill("");
  gameOver = false;
  player = "";
  robot = "";
  currentTurn = "";

  popup.style.display = "none";
  startPopup.style.display = "flex";
  playerInfo.innerText = "";

  resizeCanvas();
  winCtx.clearRect(0, 0, winCanvas.width, winCanvas.height);

  cells.forEach((cell) => {
    cell.innerHTML = "";
    cell.classList.remove("taken");
  });
}

// extra safety for resize
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
