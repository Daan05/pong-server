const socket = new WebSocket('ws://localhost:8081');

// game is in [0, 1] space
// 60 FPS
let pong = {
    ly: 0.35,       // left paddle x
    ry: 0.35,       // left paddle y
    bx: 0.5,        // ball x
    by: 0.5,        // ball y
    bvx: -0.01,     // ball velocity x
    bvy: 0.0,       // ball velocity y
    lpoints: 0,     // left player points
    rpoints: 0      // right player points
};

socket.onmessage = ({ data }) => {
    try {
        pong = JSON.parse(data);
        render();
    } catch (err) {
        alert("Server already has 2 players! You won't be able to play but you can watch.")
    }
}

// Get the canvas element and its context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);

function render() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    // left paddle
    ctx.fillRect(0, pong.ly * canvas.height, 0.025 * canvas.width, 0.3 * canvas.height);
    // right paddle
    ctx.fillRect(0.975 * canvas.width, pong.ry * canvas.height, 0.025 * canvas.width, 0.3 * canvas.height);

    // ball
    ctx.beginPath();
    ctx.arc(pong.bx * canvas.width, pong.by * canvas.height, 0.025 * canvas.width, 0, Math.PI * 2, false); // arc(x, y, radius, startAngle, endAngle, anticlockwise)
    ctx.fill();
    ctx.closePath();

    // score
    ctx.font = "96px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw text at x=50, y=50
    ctx.fillText(pong.lpoints.toString(), 50, 50);
    ctx.fillText(pong.rpoints.toString(), canvas.width - 50, 50);


    // check for end of game
    if (pong.lpoints == 5) {
        ctx.fillText("Player 1 has won", canvas.width / 2, canvas.width / 2 - 100);
        socket.close();
    }
    if (pong.rpoints == 5) {
        ctx.fillText("Player 2 has won", canvas.width / 2, canvas.width / 2 - 100);
        socket.close();
    }
}

socket.onclose = (event) => {
    ctx.fillText("Returning to main menu", canvas.width / 2, canvas.width / 2);
    setTimeout(() => {
        window.location.replace("../index.html");
    }, 5000);
}

// 60 FPS = ~16.67ms
const TICK_RATE = 1000 / 60;
setInterval(() => {
    if (keys["ArrowUp"]) socket.send("UP");
    if (keys["ArrowDown"]) socket.send("DOWN");
}, TICK_RATE);

let keys = {};
window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});