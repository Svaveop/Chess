const BOARD_SIZE = 560;
const PANEL_WIDTH = 220;
const LABEL_SPACE = 28;
const SQ_SIZE = BOARD_SIZE / 8;

const WHITE = "#f0d9b5";
const BLACK = "#b58863";
const HIGHLIGHT = "rgba(100,200,100,0.45)";

const canvas = document.getElementById("game");
canvas.width = BOARD_SIZE + PANEL_WIDTH + LABEL_SPACE * 2;
canvas.height = BOARD_SIZE + LABEL_SPACE * 2;
const ctx = canvas.getContext("2d");

const pieces = {
  wp:"♙", wr:"♖", wn:"♘", wb:"♗", wq:"♕", wk:"♔",
  bp:"♟", br:"♜", bn:"♞", bb:"♝", bq:"♛", bk:"♚"
};

let board = [
  ["br","bn","bb","bq","bk","bb","bn","br"],
  ["bp","bp","bp","bp","bp","bp","bp","bp"],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ["wp","wp","wp","wp","wp","wp","wp","wp"],
  ["wr","wn","wb","wq","wk","wb","wn","wr"]
];

let turn = "w";
let selected = null;
let history = [];
let moveNumber = 1;

function getMousePos(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = evt.clientX - rect.left - LABEL_SPACE;
  const y = evt.clientY - rect.top - LABEL_SPACE;
  if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) return null;
  return [Math.floor(y / SQ_SIZE), Math.floor(x / SQ_SIZE)];
}

function roundRect(x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function drawBoard() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const bx = LABEL_SPACE;
  const by = LABEL_SPACE;

  ctx.save();
  roundRect(bx,by,BOARD_SIZE,BOARD_SIZE,18);
  ctx.clip();

  for (let r=0;r<8;r++) {
    for (let c=0;c<8;c++) {
      ctx.fillStyle = (r+c)%2===0 ? WHITE : BLACK;
      ctx.fillRect(
        bx + c*SQ_SIZE,
        by + r*SQ_SIZE,
        SQ_SIZE,
        SQ_SIZE
      );

      if (selected && selected[0]===r && selected[1]===c) {
        ctx.fillStyle = HIGHLIGHT;
        ctx.fillRect(
          bx + c*SQ_SIZE,
          by + r*SQ_SIZE,
          SQ_SIZE,
          SQ_SIZE
        );
      }

      const p = board[r][c];
      if (p) {
        ctx.font = "42px serif";
        ctx.fillStyle = p[0]==="w" ? "#fff" : "#000";
        ctx.fillText(
          pieces[p],
          bx + c*SQ_SIZE + 12,
          by + r*SQ_SIZE + 46
        );
      }
    }
  }
  ctx.restore();

  ctx.fillStyle = "#bbb";
  ctx.font = "14px Arial";

  for (let i=0;i<8;i++) {
    // files
    ctx.fillText(
      String.fromCharCode(97+i),
      bx + i*SQ_SIZE + SQ_SIZE/2 - 4,
      by + BOARD_SIZE + 18
    );
    // ranks
    ctx.fillText(
      8-i,
      bx - 18,
      by + i*SQ_SIZE + SQ_SIZE/2 + 5
    );
  }

  const px = bx + BOARD_SIZE + 16;
  const py = by;
  roundRect(px,py,PANEL_WIDTH,BOARD_SIZE,16);
  ctx.fillStyle = "#141414";
  ctx.fill();

  ctx.fillStyle = "#eaeaea";
  ctx.font = "16px Arial";
  history.slice(-24).forEach((m,i)=>{
    ctx.fillText(m, px+14, py+28+i*22);
  });
}

function isInCheck(col) {
  let kr,kc;
  for (let r=0;r<8;r++)
    for (let c=0;c<8;c++)
      if (board[r][c]===col+"k"){kr=r;kc=c;}

  const enemy = col==="w"?"b":"w";
  for (let r=0;r<8;r++)
    for (let c=0;c<8;c++)
      if (board[r][c]?.[0]===enemy)
        if (attacks(r,c,kr,kc)) return true;
  return false;
}

function attacks(r,c,tr,tc) {
  const p = board[r][c];
  const dr = tr-r, dc = tc-c;
  if (p[1]==="n") return Math.abs(dr*dc)===2;
  if (p[1]==="k") return Math.max(Math.abs(dr),Math.abs(dc))===1;
  if (p[1]==="p") {
    const dir = p[0]==="w"?-1:1;
    return dr===dir && Math.abs(dc)===1;
  }
  if (p[1]==="b") return Math.abs(dr)===Math.abs(dc);
  if (p[1]==="r") return dr===0||dc===0;
  if (p[1]==="q") return dr===0||dc===0||Math.abs(dr)===Math.abs(dc);
}

function playMove(fr,to) {
  const [r1,c1]=fr,[r2,c2]=to;
  const p=board[r1][c1];
  const capture=board[r2][c2];

  board[r2][c2]=p;
  board[r1][c1]=null;

  let n="";
  if (p[1]==="p") {
    if (capture) n+=String.fromCharCode(97+c1)+"x";
    n+=String.fromCharCode(97+c2)+(8-r2);
  } else {
    n+=p[1].toUpperCase();
    if (capture) n+="x";
    n+=String.fromCharCode(97+c2)+(8-r2);
  }

  turn=turn==="w"?"b":"w";
  if (isInCheck(turn)) n+="+";

  if (p[0]==="w") history.push(`${moveNumber}. ${n}`);
  else { history[history.length-1]+=`   ${n}`; moveNumber++; }
}

canvas.addEventListener("mousedown",e=>{
  const pos=getMousePos(e);
  if(!pos) return;
  const [r,c]=pos;
  if(selected){ playMove(selected,[r,c]); selected=null; }
  else if(board[r][c] && board[r][c][0]===turn) selected=[r,c];
});

(function loop(){ drawBoard(); requestAnimationFrame(loop); })();