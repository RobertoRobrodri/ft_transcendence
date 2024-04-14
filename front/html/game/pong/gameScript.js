import { GameSocketManager } from "../socket/GameSocketManager.js"
import { GAME_TYPES, SOCKET, GAMES } from '../socket/Constants.js';
import { GameSocketManager } from "../../../socket/GameSocketManager.js"
import { GAME_TYPES, SOCKET } from '../../../socket/Constants.js';
import { sleep } from '../../../components/utils.js'

/////////////////
// Global vars //
/////////////////
let canvas;
let ctx;
let score = [0, 0];

// function register() {
//     document.getElementById("initmatchmaking").addEventListener("click", InitMatchmaking);
//     document.getElementById("initmatchmakingtournament").addEventListener("click", InitMatchmakingTournament);
//     document.getElementById("createTournament").addEventListener("click", CreateTournament);
//     document.getElementById("cancelmatchmaking").addEventListener("click", CancelMatchmaking);
// }
// function register() {
//     document.getElementById("initmatchmaking").addEventListener("click", InitMatchmaking);
//     document.getElementById("cancelmatchmaking").addEventListener("click", CancelMatchmaking);
// }

// Singleton socket instance
let gameSM = new GameSocketManager();

export async function connectGame()
{
    gameSM.connect();
    // register();
    await sleep(200); // Si entramos directos al matchmaking necesita un pequeño sleep
    InitMatchmaking();
    // ! We now get the canvas from the update game
    // canvas = document.getElementById("pongCanvas");
    // ctx = canvas.getContext("2d");
}

// Callback socket connected
gameSM.registerCallback(SOCKET.CONNECTED, event => {
    //when game open, try restore any running game, i put here for test
    gameSM.send(GAME_TYPES.RESTORE_GAME);
    // When need get list of current tournaments
    gameSM.send(GAME_TYPES.LIST_TOURNAMENTS, {
        "game": GAMES.PONG //replace with specific game
    });
    // When need get list of current tournaments
    gameSM.send(GAME_TYPES.LIST_GAMES, {
        "game": GAMES.PONG //replace with specific game
    }); 
});

// Callback socket disconnected
gameSM.registerCallback(SOCKET.DISCONNECTED, event => {
    
});

// Callback socket error
gameSM.registerCallback(SOCKET.ERROR, event => {
    
});

// MATCHMAKING
gameSM.registerCallback(GAME_TYPES.INITMATCHMAKING, data => {
    //Game matched! game started
    // send ready request after open game, message to ask about ready etc
    // Hide matchmaking elements
    let matchmaking = document.getElementById("matchmaking");
    matchmaking.classList.add("mshide");
    gameSM.send(GAME_TYPES.PLAYER_READY);
});

gameSM.registerCallback(GAME_TYPES.CANCELMATCHMAKING, data => {
    
});

gameSM.registerCallback(GAME_TYPES.INQUEUE, data => {
    console.log(data);
});

// GAME
gameSM.registerCallback(GAME_TYPES.GAME_STATE, data => {
    updateGame(data);
});

gameSM.registerCallback(GAME_TYPES.WALL_COLLISON, data => {
    const audio = new Audio("assets/game/sounds/ball_wall.mp3");
    audio.play();
});


gameSM.registerCallback(GAME_TYPES.PADDLE_COLLISON, data => {
    const audio = new Audio("assets/game/sounds/ball_kick.mp3");
    audio.play();
});

gameSM.registerCallback(GAME_TYPES.GAME_END, data => {
    const audio = new Audio("assets/game/sounds/chipi-chapa.mp3");
    score = [0, 0];
    audio.play();
});

gameSM.registerCallback(GAME_TYPES.GAME_SCORE, data => {
    score = data;
    console.log(data);
});

gameSM.registerCallback(GAME_TYPES.LIST_TOURNAMENTS, data => {
    fillTournaments(data);
});

gameSM.registerCallback(GAME_TYPES.LIST_GAMES, data => {
    fillGames(data);
});

gameSM.registerCallback(GAME_TYPES.COUNTDOWN, data => {
    console.log(`game start in: ${data.counter}`)
});

gameSM.registerCallback(GAME_TYPES.TOURNAMENT_TABLE, data => {
    console.log(`tournament data table: ${data}`)
});


////////////////
// GAME LOGIC //
////////////////

function InitMatchmaking()
{
    gameSM.send(GAME_TYPES.INITMATCHMAKING, GAMES.PONG);
}

function InitMatchmakingTournament()
{
    gameSM.send(GAME_TYPES.INITMATCHMAKING, GAMES.TOURNAMENT);
}

function CreateTournament()
{
    var customUsername = document.getElementById("nickname").value;
    var tournamentName = document.getElementById("tournament-name").value;
    var playerSize = document.getElementById("number-of-players").value;
    gameSM.send(GAME_TYPES.CREATE_TOURNAMENT, {
        game: "Pong",
        nickname: customUsername,
        size: playerSize,
        tournament_name: tournamentName
    });

}

export function CancelMatchmaking()
{
    gameSM.send(GAME_TYPES.CANCELMATCHMAKING);
}

function updateGame(gameState) {
    // This prevents an error when reloading the page where it cannot find the canvas
    canvas = document.getElementById("pongCanvas");
    ctx = canvas.getContext("2d");
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Black background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw Score
    drawScore(score);
    // Draw paddles
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        drawPaddle(player.paddle_x, player.paddle_y);
    }
    // Draw ball
    drawBall(gameState.ball.x, gameState.ball.y);
}

function drawPaddle(x, y) {
    ctx.fillStyle = "#ffff";
    ctx.fillRect(x, y, 10, 40);
}

function drawBall(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffff";
    ctx.fill();
    ctx.closePath();
}

// Event listener detect keys
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
let direction = null;
let isSending = false;

function handleKeyDown(event) {
    if (!isSending) {
        direction = getDirectionFromKeyCode(event.keyCode);
        if (direction) {
            // Set a flag to indicate that we are sending a request
            isSending = true;
            // Send key event to server
            sendDirectionToServer();
        }
    }
}

function handleKeyUp(event) {
    direction = null;  // When release, set direction as null
    isSending = false;  // Reset the flag when key is released
}

function sendDirectionToServer() {
    if (direction) {
        // Send direction
        gameSM.send(GAME_TYPES.ACTION, direction);
        // Schedule the next update while the key is pressed
        requestAnimationFrame(sendDirectionToServer);
    } else {
        // Reset the flag when the key is released
        isSending = false;
    }
}

function getDirectionFromKeyCode(keyCode) {
    switch (keyCode) {
        case 38: // UP
            return '-1';
        case 40: // DOWN
            return '1';
        default:
            return null;
    }
}

// Fill Tournament list
function fillTournaments(data) {
    var tournaments = document.getElementById("tournamentList");

    // Remove previous li elements
    while (tournaments.firstChild)
        tournaments.removeChild(tournaments.firstChild);
    
    data.forEach((element) => {
        var curli = document.createElement("li");
        curli.textContent = `${element.name} (${element.currentPlayers}/${element.size})`;
        curli.classList.add("list-group-item");
        // curli.dataset.tournamentId = element.id;
        // Click example to join tournament
        curli.addEventListener('click', function() {
            var nickname = prompt(`¿Want join to ${element.name} tournament? Introduce your nickname:`);
            if (nickname !== null && nickname !== "") {
                //JOIN_TOURNAMENT
                gameSM.send(GAME_TYPES.JOIN_TOURNAMENT, {
                    id: element.id,
                    nick: nickname,
                    game: GAMES.PONG
                })
                console.log("El usuario confirmó la entrada al torneo.");
            }
        });

        // Leave
        var leaveButton = document.createElement("button");
        leaveButton.textContent = "Leave";
        leaveButton.classList.add("btn", "btn-danger", "btn-sm", "ml-2");
        leaveButton.addEventListener('click', function(event) {
            event.stopPropagation();
            gameSM.send(GAME_TYPES.LEAVE_TOURNAMENT, {
                id: element.id,
                game: GAMES.PONG
            })
        });
        curli.appendChild(leaveButton);
        tournaments.appendChild(curli);
    });
}

function fillGames(data) {
    var games = document.getElementById("gameList");

    // Remove previous li elements
    while (games.firstChild)
        games.removeChild(games.firstChild);
    
    data.forEach((element) => {
        var curli = document.createElement("li");
        curli.textContent = `${element.id}`;
        curli.classList.add("list-group-item");
        //Click example to join tournament
        curli.addEventListener('click', function() {
            gameSM.send(GAME_TYPES.SPECTATE_GAME, {
                id: element.id
            })
        });
        
        // Leave
        var leaveButton = document.createElement("button");
        leaveButton.textContent = "Leave";
        leaveButton.classList.add("btn", "btn-danger", "btn-sm", "ml-2");
        leaveButton.addEventListener('click', function(event) {
            event.stopPropagation();
            gameSM.send(GAME_TYPES.LEAVE_SPECTATE_GAME, {
                id: element.id
            })
        });
        curli.appendChild(leaveButton);
        games.appendChild(curli);
    });
}

function drawScore(scores) {
    // Set font style
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    // Loop through the scores object
    for (const playerId in scores) {
        // Determine position based on player ID or index
        const xPos = (playerId === "0") ? canvas.width / 4 : canvas.width * 3 / 4;
        const yPos = 30; // Position at the top

        // Draw the score
        ctx.fillText(scores[playerId], xPos, yPos);
    }
}