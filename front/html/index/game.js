import { GameSocketManager } from "../socket/GameSocketManager.js"
import { GAME_TYPES, SOCKET, GAMES } from '../socket/Constants.js';

/////////////////
// Global vars //
/////////////////
let canvas;
let ctx;

function register() {
    document.getElementById("initmatchmaking").addEventListener("click", InitMatchmaking);
    document.getElementById("initmatchmakingtournament").addEventListener("click", InitMatchmakingTournament);
    document.getElementById("createTournament").addEventListener("click", CreateTournament);
    document.getElementById("cancelmatchmaking").addEventListener("click", CancelMatchmaking);
}

// Singleton socket instance
let gameSM = new GameSocketManager();

export function connectGame()
{
    gameSM.connect();
    register();

    canvas = document.getElementById("pongCanvas");
    ctx = canvas.getContext("2d");

    
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
    audio.play();
});

gameSM.registerCallback(GAME_TYPES.GAME_SCORE, data => {
    console.log(data)
});

gameSM.registerCallback(GAME_TYPES.LIST_TOURNAMENTS, data => {
    fillTournaments(data);
});

gameSM.registerCallback(GAME_TYPES.LIST_GAMES, data => {
    fillGames(data);
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

function CancelMatchmaking()
{
    gameSM.send(GAME_TYPES.CANCELMATCHMAKING);
}

function updateGame(gameState) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Black background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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


function LeaveTournament(tournamentId)
{
    gameSM.send(GAME_TYPES.LEAVE_TOURNAMENT, {
        id: tournamentId
    });
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
                    nick: nickname
                })
                console.log("El usuario confirmó la entrada al torneo.");
            }
        });
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
        games.appendChild(curli);
    });
}