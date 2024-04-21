import { GameSocketManager } from "../../socket/GameSocketManager.js";
import { GAME_TYPES, SOCKET, GAMES } from '../../socket/Constants.js';
import { initializeSingleGame, endSingleGame } from "./singlegame.js";
import { initializeVersusGame, endVersusGame } from "./versusgame.js";
// import { renewJWT } from "../components/updatejwt.js";

/////////////////
// Global vars //
/////////////////
let canvas;
let ctx;
let score = [0, 0];

// Singleton socket instance
let gameSM = new GameSocketManager();

let optionsView, matchmakingView, localgameView, onlineMenuView,
    tournamentView, tournamentJoinView, tournamentReadyView;

export function init(customData = null) {
    document.getElementById('root').addEventListener('click', gameEventHandler);

    optionsView = document.getElementById("game_options_pong");
    matchmakingView = document.getElementById("matchmaking_pong");
    localgameView = document.getElementById("local_game_options_pong");
    onlineMenuView = document.getElementById("online_menu_pong");
    tournamentView = document.getElementById("tournament_menu");
    tournamentJoinView = document.getElementById("tournament_join");
    tournamentReadyView = document.getElementById("tournament_ready");
    canvas = document.getElementById("pongCanvas");
    ctx = canvas.getContext("2d");

    gameSM.connect();
}

async function setTournaments() {
    gameSM.send(GAME_TYPES.LIST_TOURNAMENTS, GAMES.PONG);
}

function gameEventHandler(e) {
    // multiplayer
    if (e.target.matches('#onlineGameMenu_pong') === true)
    {
        gameSM.send(GAME_TYPES.LIST_GAMES, GAMES.PONG);
        toggleView(optionsView, false);
        toggleView(onlineMenuView, true);
    }
    else if (e.target.matches('#tournamentButton_pong') === true)
    {
        toggleView(optionsView, false);
        toggleView(tournamentView, true);
        setTournaments();
    }
    else if (e.target.matches('#backToTournaments') === true)
    {
        toggleView(tournamentJoinView, false);
        toggleView(tournamentView, true);
    }
    else if (e.target.matches('#leaveTournament') === true) {
        // Llamamos a la funcion para salir de un torneo
        toggleView(tournamentReadyView, false);
        toggleView(tournamentJoinView, true);
    }
    else if (e.target.matches('#joinTournament') === true) {
        // Comprobamos si el nickname es valido
        // Llamamos a la funcion para entrar a un torneo
        toggleView(tournamentJoinView, false);
        toggleView(tournamentReadyView, true);
    }
    else if (e.target.matches('#createTournament') === true) {
        CreateTournament();
    }
    else if (e.target.matches('#onlineGameButton_pong') === true)
    {
        toggleView(onlineMenuView, false);
        toggleView(matchmakingView, true);
        InitMatchmaking();
    }
    else if (e.target.matches('#cancelMatchmakingButton_pong') === true)
    {
        toggleView(matchmakingView, false);
        toggleView(onlineMenuView, false);
        toggleView(tournamentView, false);
        toggleView(optionsView, true);
        CancelMatchmaking();
    }
    // juego local
    else if (e.target.matches('#localGameButton_pong') === true)
    {
        toggleView(optionsView, false);
        toggleView(localgameView, true);
    }
    // 1 jugador
    else if (e.target.matches('#soloGameButton_pong') === true)
    {
        toggleView(localgameView, false);
        initializeSingleGame();
    }
    // Multijugador local
    else if (e.target.matches('#localMultiplayerButton_pong') === true)
    {
        toggleView(localgameView, false);
        initializeVersusGame();
    }
    else if (e.target.matches('#goBackButton_pong') === true)
    {
        toggleView(optionsView, true);
        toggleView(localgameView, false);
    }
    else if (e.target.matches('#red-myWindowGame') === true)
    {
        // si está conectado el socket, lo desconecta
        gameSM.disconnect();
        // si está en una partida de un jugador, la termina
        endSingleGame();
        // si está jugando en una partida multijugador local, la termina
        endVersusGame();
    }
    
}

export function toggleView(view, visible = true) {
    if (visible)
        view.classList.remove("mshide");
    else
        view.classList.add("mshide");
}

// Callback socket connected
gameSM.registerCallback(SOCKET.CONNECTED, event => {
    //when game open, try restore any running game, i put here for test
    gameSM.send(GAME_TYPES.RESTORE_GAME, GAMES.PONG);
    // When need get list of current tournaments
    // gameSM.send(GAME_TYPES.LIST_TOURNAMENTS, GAMES.PONG);
    // When need get list of current tournaments
    // gameSM.send(GAME_TYPES.LIST_GAMES, GAMES.PONG); 
});

// Callback socket disconnected
gameSM.registerCallback(SOCKET.DISCONNECTED, event => {
    
});

// Callback socket error
gameSM.registerCallback(SOCKET.ERROR, event => {
    
});

gameSM.registerCallback(GAME_TYPES.GAME_RESTORED, data => {
    if(data.game == GAMES.PONG) {
        gameSM.send(GAME_TYPES.PLAYER_READY);
        toggleView(optionsView, false);
    }
});

// MATCHMAKING
gameSM.registerCallback(GAME_TYPES.INITMATCHMAKING, data => {
    //Game matched! game started
    // send ready request after open game, message to ask about ready etc
    // Hide matchmaking elements
    if(data.game == GAMES.PONG) {
        toggleView(matchmakingView, false);
        gameSM.send(GAME_TYPES.PLAYER_READY);
    }
});

gameSM.registerCallback(GAME_TYPES.CANCELMATCHMAKING, data => {
    
});

gameSM.registerCallback(GAME_TYPES.INQUEUE, data => {
    if(data.game == GAMES.PONG) {
        toggleView(matchmakingView, true);
        toggleView(optionsView, false);
    }
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
    if(data.game == GAMES.PONG) {
        const audio = new Audio("assets/game/sounds/chipi-chapa.mp3");
        score = [0, 0];
        audio.play();
        //gameSM.disconnect();
        toggleView(optionsView, true);
    }
});

gameSM.registerCallback(GAME_TYPES.GAME_SCORE, data => {
    score = data;
    console.log(data);
});

gameSM.registerCallback(GAME_TYPES.LIST_TOURNAMENTS, data => {
    if(data.game == GAMES.PONG) {
        fillTournaments(data.data);
    }
});

gameSM.registerCallback(GAME_TYPES.LIST_GAMES, data => {
    if(data.game == GAMES.PONG) {
        fillGames(data);
    }
});

gameSM.registerCallback(GAME_TYPES.COUNTDOWN, data => {
    console.log(`game start in: ${data.counter}`)
});

gameSM.registerCallback(GAME_TYPES.TOURNAMENT_TABLE, data => {
    console.log(`tournament data table: ${data}`)
});

gameSM.registerCallback(GAME_TYPES.USERS_PLAYING, data => {
    if (data.game == GAMES.PONG) {

    }
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
    // Ahora cambiamos la vista a la del torneo
}

function CancelMatchmaking()
{
    gameSM.send(GAME_TYPES.CANCELMATCHMAKING);
}

function updateGame(gameState) {
    // This prevents an error when reloading the page where it cannot find the canvas
    
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
        gameSM.send(GAME_TYPES.ACTION,  {"game" : GAMES.PONG, "action": direction })
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

// Fill Tournament table
function fillTournaments(data) {
    console.log(data);
    var tournaments = document.getElementById("allTournaments-table-body");
    tournaments.innerHTML = "";
    data.forEach((element) => {
        const row = document.createElement("tr");
        row.addEventListener("click", function() {
            console.log(element.id);
            toggleView(tournamentView, false);
            toggleView(tournamentJoinView, true);
        });
        row.innerHTML = `
            <td>${element.name}</td>
            <td>${element.currentPlayers}/${element.size}</td>
        `;
        tournaments.appendChild(row);
    });
}

// Fill Tournament list
function fillTournaments2(data) {
    var tournaments = document.getElementById("tournamentList");

    // Remove previous li elements
    while (tournaments.firstChild)
        tournaments.removeChild(tournaments.firstChild);
    
    console.log(data);

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
    if(!games)
        return;
    // Remove previous li elements
    while (games.firstChild)
        games.removeChild(games.firstChild);
    
    data.data.forEach((element) => {
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