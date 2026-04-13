import {
  db,
  ref,
  set,
  get,
  update,
  onValue,
  onDisconnect
} from "./firebase.js";

const cells = document.querySelectorAll(".cell");
const winCanvas = document.getElementById("winCanvas");
const winCtx = winCanvas.getContext("2d");

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let currentRoom = "";
let mySymbol = "";
let previousBoard = ["", "", "", "", "", "", "", "", ""];
let gameOver = false;
let winnerSymbol = "";

const winPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// ==========================================
// ✅ Background Particles
// ==========================================
const bgCanvas = document.getElementById("bgCanvas");
const bgCtx = bgCanvas.getContext("2d");
function resizeBg() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
resizeBg();
window.addEventListener("resize", resizeBg);

const particles = Array.from({ length: 60 }, () => ({
  x: Math.random() * bgCanvas.width,
  y: Math.random() * bgCanvas.height,
  r: Math.random() * 2 + 0.5,
  speedX: (Math.random() - 0.5) * 0.3,
  speedY: (Math.random() - 0.5) * 0.3,
  opacity: Math.random() * 0.35 + 0.08
}));

function animateBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  particles.forEach(p => {
    p.x += p.speedX; p.y += p.speedY;
    if (p.x < 0) p.x = bgCanvas.width;
    if (p.x > bgCanvas.width) p.x = 0;
    if (p.y < 0) p.y = bgCanvas.height;
    if (p.y > bgCanvas.height) p.y = 0;
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(0,229,255,${p.opacity})`;
    bgCtx.fill();
  });
  requestAnimationFrame(animateBg);
}
animateBg();

// ==========================================
// ✅ Canvas & Line Drawing
// ==========================================
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
    y: cRect.top - wRect.top + cRect.height / 2,
    cellSize: cRect.width
  };
}

function drawWinLine(pattern) {
  resizeCanvas();
  const p1 = getCellCenter(pattern[0]);
  const p2 = getCellCenter(pattern[2]);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const angle = Math.atan2(dy, dx);
  const extension = p1.cellSize * 0.4; 
  const start = {
    x: p1.x - Math.cos(angle) * extension,
    y: p1.y - Math.sin(angle) * extension
  };
  const end = {
    x: p2.x + Math.cos(angle) * extension,
    y: p2.y + Math.sin(angle) * extension
  };
  let progress = 0;
  function animate() {
    progress += 0.04;
    if (progress > 1) progress = 1;
    winCtx.clearRect(0, 0, winCanvas.width, winCanvas.height);
    winCtx.beginPath();
    winCtx.moveTo(start.x, start.y);
    winCtx.lineTo(start.x + (end.x - start.x) * progress, start.y + (end.y - start.y) * progress);
    winCtx.strokeStyle = "#ffffff";
    winCtx.lineWidth = 10;
    winCtx.lineCap = "round";
    winCtx.shadowColor = "#00e5ff";
    winCtx.shadowBlur = 20;
    winCtx.stroke();
    if (progress < 1) requestAnimationFrame(animate);
  }
  animate();
}

// ==========================================
// ✅ X and O Rendering
// ==========================================
function drawSymbolOnCell(cell, symbol) {
  cell.innerHTML = "";
  const size = cell.offsetWidth;
  const cvs = document.createElement("canvas");
  cvs.width = size; cvs.height = size;
  cell.appendChild(cvs);
  const c = cvs.getContext("2d");
  const cx = size / 2, cy = size / 2, r = size * 0.28;
  c.lineWidth = size * 0.09; c.lineCap = "round"; c.shadowBlur = 14;
  if (symbol === "X") {
    c.strokeStyle = "#c084fc"; c.shadowColor = "rgba(192,132,252,0.7)";
    let progress = 0, lineIndex = 0;
    const lines = [{x1:cx-r,y1:cy-r,x2:cx+r,y2:cy+r},{x1:cx+r,y1:cy-r,x2:cx-r,y2:cy+r}];
    function animX() {
      progress += 0.1; if (progress > 1) progress = 1;
      c.clearRect(0,0,size,size);
      for(let i=0; i<=lineIndex; i++) {
        c.beginPath();
        const ln = lines[i];
        c.moveTo(ln.x1, ln.y1);
        const curProg = (i === lineIndex) ? progress : 1;
        c.lineTo(ln.x1 + (ln.x2-ln.x1)*curProg, ln.y1 + (ln.y2-ln.y1)*curProg);
        c.stroke();
      }
      if(progress < 1) requestAnimationFrame(animX);
      else if(lineIndex === 0) { lineIndex = 1; progress = 0; requestAnimationFrame(animX); }
    }
    animX();
  } else {
    c.strokeStyle = "#f472b6"; c.shadowColor = "rgba(244,114,182,0.7)";
    let progress = 0;
    function animO() {
      progress += 0.08; if (progress > 1) progress = 1;
      c.clearRect(0,0,size,size);
      c.beginPath(); c.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + Math.PI*2*progress);
      c.stroke();
      if(progress < 1) requestAnimationFrame(animO);
    }
    animO();
  }
}

// ==========================================
// ✅ Logic Edits: RANDOM FIRST PLAYER
// ==========================================
window.createRoom = function () {
  currentRoom = Math.floor(10 + Math.random() * 90).toString();
  mySymbol = "X";
  
  // Choose random player: X or O
  const randomStarter = Math.random() > 0.5 ? "X" : "O";

  set(ref(db, "rooms/" + currentRoom), {
    board: Array(9).fill(""),
    currentPlayer: randomStarter, // Set to random here
    gameOver: false,
    winnerPattern: null,
    winnerSymbol: ""
  });
  onDisconnect(ref(db, "rooms/" + currentRoom)).remove();
  listenToRoom();
  document.getElementById("startPopup").style.display = "none";
};

window.openJoinPopup = function () {
  document.getElementById("startPopup").style.display = "none";
  document.getElementById("joinPopup").style.display = "flex";
};

window.joinRoom = async function () {
  const code = document.getElementById("roomInput").value.trim();
  const snapshot = await get(ref(db, "rooms/" + code));
  if (!snapshot.exists()) return alert("Room not found");
  currentRoom = code;
  mySymbol = "O";
  document.getElementById("joinPopup").style.display = "none";
  listenToRoom();
};

window.restartGame = function() {
  if (currentRoom) {
    const randomStarter = Math.random() > 0.5 ? "X" : "O";
    update(ref(db, "rooms/" + currentRoom), {
      board: Array(9).fill(""),
      currentPlayer: randomStarter, // Randomize again on restart
      gameOver: false,
      winnerPattern: null,
      winnerSymbol: ""
    });
    document.getElementById("popup").style.display = "none";
    winCtx.clearRect(0, 0, winCanvas.width, winCanvas.height);
  } else { location.reload(); }
};

function listenToRoom() {
  onValue(ref(db, "rooms/" + currentRoom), (snapshot) => {
    const game = snapshot.val();
    if (!game) return;
    previousBoard = [...board];
    board = game.board;
    currentPlayer = game.currentPlayer;
    gameOver = game.gameOver;
    winnerSymbol = game.winnerSymbol || "";
    renderBoard();
    if (game.winnerPattern) drawWinLine(game.winnerPattern);
    else {
      resizeCanvas();
      winCtx.clearRect(0, 0, winCanvas.width, winCanvas.height);
    }
  });
}

function renderBoard() {
  cells.forEach((cell, index) => {
    if (board[index] === "") { cell.innerHTML = ""; return; }
    if (previousBoard[index] !== board[index]) drawSymbolOnCell(cell, board[index]);
  });

  let text = "";
  if (gameOver) {
    text = winnerSymbol === "draw" ? "It's a Draw!" : `${winnerSymbol} Wins!`;
    document.getElementById("playerInfo").innerText = `Room ${currentRoom} • You: ${mySymbol} • ${text}`;
    setTimeout(() => {
      document.getElementById("popupText").innerText = text;
      document.getElementById("popup").style.display = "flex";
    }, 1500);
  } else {
    // Correctly show whose turn it is
    text = currentPlayer === mySymbol ? "Your turn" : `${currentPlayer}'s turn`;
    document.getElementById("playerInfo").innerText = `Room ${currentRoom} • You: ${mySymbol} • ${text}`;
    document.getElementById("popup").style.display = "none";
  }
}

cells.forEach((cell, index) => {
  cell.addEventListener("click", () => {
    if (!currentRoom || gameOver || board[index] !== "" || currentPlayer !== mySymbol) return;
    const newBoard = [...board];
    newBoard[index] = mySymbol;
    let winnerPattern = null;
    for (let pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[b] === newBoard[c]) {
        winnerPattern = pattern;
        break;
      }
    }
    const isDraw = !winnerPattern && !newBoard.includes("");
    update(ref(db, "rooms/" + currentRoom), {
      board: newBoard,
      currentPlayer: mySymbol === "X" ? "O" : "X",
      gameOver: !!winnerPattern || isDraw,
      winnerPattern: winnerPattern || null,
      winnerSymbol: winnerPattern ? mySymbol : isDraw ? "draw" : ""
    });
  });
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();