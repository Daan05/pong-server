const WebSocket = require('ws');
const server = new WebSocket.Server({ port: '8081' });

const players = new Map();
let nextPlayerId = 1;

let isRunning = false;

// game is in [0, 1] space
// 60 FPS
let pong = {
    ly: 0.35,       // left paddle x
    ry: 0.35,       // left paddle y
    bx: 0.5,        // ball x
    by: 0.5,        // ball y
    bvx: -0.012,    // ball velocity x
    bvy: 0.0,       // ball velocity y
    lpoints: 0,     // left player points
    rpoints: 0      // right player points
};

server.on('connection', socket => {
    const playerId = `player_${nextPlayerId++}`;
    players.set(socket, playerId);
    console.log(`${playerId} connected`);

    socket.send(JSON.stringify(pong));

    if (playerId == "player_2") {
        setTimeout(() => {
            isRunning = true;
            console.log("game has started");
        }, 2000);
    }


    // if there are already 2 players playing
    if (nextPlayerId > 3) {
        socket.send("invalid JSON"); // will alert the client that he is just a spectator
    }

    socket.on('message', message => {
        move = message.toString();
        // console.log("received message: ", move);
        if (playerId == "player_1" || playerId == "player_2") {
            switch (move) {
                case "UP":
                    if (playerId == "player_1")
                        pong.ly -= 0.01;
                    else
                        pong.ry -= 0.01;
                    break;
                case "DOWN":
                    if (playerId == "player_1")
                        pong.ly += 0.01;
                    else
                        pong.ry += 0.01;
                    break;
                default:
                    break;
            }
        }
        if (pong.ly < 0)
            pong.ly = 0;
        else if (pong.ly > 0.7)
            pong.ly = 0.7

        if (pong.ry < 0)
            pong.ry = 0;
        else if (pong.ry > 0.7)
            pong.ry = 0.7
    });

    socket.on('close', () => {
        if (playerId == "player_1" || playerId == "player_2")
            endGame();

        console.log(`${playerId} disconnected`);
        players.delete(socket);
    });

});

function endGame() {
    // close all connections, this will signal the clients to return to the main menu
    players.forEach((value, key) => {
        key.close();
    });

    nextPlayerId = 1;

    isRunning = false;
    pong = {
        ly: 0.35,       // left paddle x
        ry: 0.35,       // left paddle y
        bx: 0.5,        // ball x
        by: 0.5,        // ball y
        bvx: -0.012,    // ball velocity x
        bvy: 0.0,       // ball velocity y
        lpoints: 0,     // left player points
        rpoints: 0      // right player points
    };
}

// 60 FPS = ~16.67ms
const TICK_RATE = 1000 / 60;
setInterval(() => {
    if (!isRunning)
        return;

    if (pong.lpoints == 5) {
        setTimeout(() => {
            endGame();
        }, 5000);
    }
    if (pong.rpoints == 5) {
        setTimeout(() => {
            endGame();
        }, 5000);
    }

    // update ball position
    pong.bx += pong.bvx;
    pong.by += pong.bvy;

    if (pong.bvx < 0) {
        if (pong.bx < 0.025 && (pong.by + 0.0125) > pong.ly && (pong.by - 0.0125) < (pong.ly + 0.3)) {
            pong.bvx *= -1;
            let offset = (pong.ly + 0.15) - pong.by;
            pong.bvy -= offset * 0.05;
            pong.bx = 0.025;
            let velocity = Math.sqrt(pong.bvx * pong.bvx + pong.bvy * pong.bvy) * 100;
            pong.bvx /= velocity;
            pong.bvy /= velocity;
        } else if (pong.bx < 0) {
            pong.rpoints++;
            pong.bx = 0.5;
            pong.by = 0.5;
            pong.bvx = 0.01;
            pong.bvy = 0;
        }
    } else {
        if (pong.bx > 1 - 0.025 && (pong.by + 0.0125) > pong.ry && (pong.by - 0.0125) < (pong.ry + 0.3)) {
            pong.bvx *= -1;
            let offset = (pong.ry + 0.15) - pong.by;
            pong.bvy -= offset * 0.05;
            pong.bx = 1 - 0.025;
            let velocity = Math.sqrt(pong.bvx * pong.bvx + pong.bvy * pong.bvy) * 100;
            pong.bvx /= velocity;
            pong.bvy /= velocity;
        } else if (pong.bx > 1.0) {
            pong.lpoints++;
            pong.bx = 0.5;
            pong.by = 0.5;
            pong.bvx = -0.01;
            pong.bvy = 0;
        }
    }

    if (pong.by < 0.0125 || pong.by > 1 - 0.0125)
        pong.bvy *= -1;

    // send updated data to all the clients
    players.forEach((value, key) => {
        key.send(JSON.stringify(pong));
    });
}, TICK_RATE);
