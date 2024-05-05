import { GameSocketManager } from "../../socket/GameSocketManager.js";
import { GAME_TYPES, SOCKET, GAMES, CHAT_TYPES } from '../../socket/Constants.js';
import { initializeGame, endGame } from "./localGameLogic.js";
import { drawTournament } from "../../components/tournamentTable.js"

/////////////////
// Global vars //
/////////////////
let isPlaying = false;
let myUserId = null;
let myUsername = null;
let tournamentJoined = null;
let canvas;
let ctx;
let score = [0, 0];
let direction = null;
let isSending = false;
let ranked = false;

// Singleton socket instance
let gameSM = new GameSocketManager();

let optionsView, matchmakingView, localgameView, onlineMenuView,
    tournamentView, tournamentJoinView, tournamentReadyView,
    canvasDivView, canvas3DDivView, tournamentHistory;

export function init(customData = null) {
    document.getElementById('root').addEventListener('click', gameEventHandler);
    document.getElementById('root').addEventListener('mouseover', showDescription);
    optionsView = document.getElementById("game_options_pong");
    matchmakingView = document.getElementById("matchmaking_pong");
    localgameView = document.getElementById("local_game_options_pong");
    onlineMenuView = document.getElementById("online_menu_pong");
    tournamentView = document.getElementById("tournament_menu");
    tournamentJoinView = document.getElementById("tournament_join");
    tournamentReadyView = document.getElementById("tournament_ready");
    canvasDivView = document.getElementById("canvasDiv");
    canvas3DDivView = document.getElementById("canvas3DDiv");
    tournamentHistory = document.getElementById("tournamentHistory");
    canvas = document.getElementById("pongCanvas");
    ctx = canvas.getContext("2d");
    initGameListener();
    gameSM.connect();
}

async function setTournaments() {
    gameSM.send(GAME_TYPES.LIST_TOURNAMENTS, GAMES.PONG);
}

function gameEventHandler(e) {
    // multiplayer
    if (e.target.matches('#onlineGameMenu_pong') === true) {
        gameSM.send(GAME_TYPES.LIST_GAMES, GAMES.PONG);
        showOnlyView(onlineMenuView);
    }
    else if (e.target.matches('#tournamentButton_pong') === true) {
        showOnlyView(tournamentView);
        setTournaments();
    }
    else if (e.target.matches('#backToTournaments') === true) {
        tournamentJoined = null;
        showOnlyView(tournamentView);
    }
    else if (e.target.matches('#leaveTournament') === true) {
        // Llamamos a la funcion para salir de un torneo
        gameSM.send(GAME_TYPES.LEAVE_TOURNAMENT, {
            id: tournamentJoined,
            game: GAMES.PONG
        })
        tournamentJoined = null;
        showOnlyView(tournamentView);
    }
    else if (e.target.matches('#joinTournament') === true) {
        let nickname = document.getElementById("tournament-nickname").value;
        if (nickname !== null && nickname !== "") {
            //JOIN_TOURNAMENT

            toggleView(tournamentJoinView, false);
            gameSM.send(GAME_TYPES.JOIN_TOURNAMENT, {
                id: tournamentJoined,
                nick: nickname,
                game: GAMES.PONG
            })
        }
    }
    else if (e.target.matches('#createTournament') === true) {
        CreateTournament();
    }
    else if (e.target.matches('#onlineGameButton_pong') === true) {
        ranked = false;
        showOnlyView(matchmakingView);
        InitMatchmaking();
        let win = document.getElementById("myWindowGame-content");
        if(win)
            win.style.overflow = "hidden";
    }
    else if (e.target.matches('#rankedGameButton_pong') === true) {
        ranked = true;
        showOnlyView(matchmakingView);
        InitMatchmaking(true);
        let win = document.getElementById("myWindowGame-content");
        if(win)
            win.style.overflow = "hidden";
    }
    else if (e.target.matches('#cancelMatchmakingButton_pong') === true) {
        showOnlyView(optionsView);
        CancelMatchmaking(ranked);
        let win = document.getElementById("myWindowGame-content");
        if(win)
            win.style.overflow = "auto";
    }
    // juego local (2 players)
    else if (e.target.matches('#localGameButton_pong') === true) {
        showOnlyView(localgameView);
    }
    // 1 jugador (with Neural network)
    else if (e.target.matches('#soloGameButton_pong') === true) {
        showOnlyView(canvasDivView);
        initializeGame();
    }
    // 1 jugador (With Algorithm)
    else if (e.target.matches('#soloGameButtonAlgo_pong') === true) {
        showOnlyView(canvasDivView);
        initializeGame(false, false)
    }
    // 3D
    else if (e.target.matches('#soloGameButton3D_pong') === true) {
        showOnlyView(canvas3DDivView);
        initializeGame(false, false, true)
    }

    // Multijugador local
    else if (e.target.matches('#localMultiplayerButton_pong') === true) {
        showOnlyView(canvasDivView);
        initializeGame(true);
    }
    else if (e.target.matches('#goBackButton_pong') === true) {
        showOnlyView(optionsView);
    }
    else if (e.target.matches('#red-myWindowGame') === true) {
        // si está conectado el socket, lo desconecta
        gameSM.disconnect();
        // si está en una partida de un jugador, la termina
        endGame(true);
        removeGameListener();
    }
}

function showDescription(e) {
    let description = document.getElementById("description");
    if (e.target.matches('#localGameButton_pong') === true) {
        description.innerText = " Play against AI or multiplayer in the same keyboard \n First to score 6 points \n -- Player 1 controls -- \n Paddle Up = W \n Paddle Down = S \n -- Player 2 controls -- \n Paddle Up = O \n Paddle Down = L \n"
    }
    else if (e.target.matches('#onlineGameMenu_pong') === true) {
        description.innerText = "Enter a game against a random opponent.\n This game will count for your stats \n -- Player controls -- \n Paddle Up = ↑ \n Paddle Down = ↓"
    }
    else if (e.target.matches('#tournamentButton_pong') === true) {
        description.innerText = "Enter a tournament \n multiple players will take \nturns playing against each other \n -- Player controls -- \n Paddle Up = ↑ \n Paddle Down = ↓"
    }
}

export function toggleView(view, visible = true) {
    if (visible)
        view.classList.remove("mshide");
    else
        view.classList.add("mshide");
}

export function showOnlyView(viewToShow) {
    const viewsToHide = [optionsView, matchmakingView, localgameView, onlineMenuView, tournamentView, tournamentJoinView, tournamentReadyView, canvasDivView, canvas3DDivView, tournamentHistory];
    
    viewsToHide.forEach(view => {
        if (view !== viewToShow) {
            toggleView(view, false);
        } else {
            toggleView(view, true);
        }
    });
}

// Callback socket connected
gameSM.registerCallback(SOCKET.CONNECTED, event => {
    gameSM.send(GAME_TYPES.RESTORE_GAME, GAMES.PONG);
});

// Callback socket disconnected
gameSM.registerCallback(SOCKET.DISCONNECTED, event => {

});

// Callback socket error
gameSM.registerCallback(SOCKET.ERROR, event => {

});


gameSM.registerCallback(GAME_TYPES.GAME_RESTORED, data => {
    if (data.game == GAMES.PONG) {
        gameSM.send(GAME_TYPES.PLAYER_READY);
        showOnlyView(canvasDivView);
        let win = document.getElementById("myWindowGame-content");
        if(win)
            win.style.overflow = "hidden";
    }
});

// MATCHMAKING
// TODO Aqui oculto la tabla del emparejamiento
gameSM.registerCallback(GAME_TYPES.INITMATCHMAKING, data => {

    if (data.game == GAMES.PONG) {
        isPlaying = true;
        showOnlyView(canvasDivView);
        gameSM.send(GAME_TYPES.PLAYER_READY);
        let win = document.getElementById("myWindowGame-content");
        if(win)
            win.style.overflow = "hidden";
    }
});

gameSM.registerCallback(GAME_TYPES.CANCELMATCHMAKING, data => {

});

gameSM.registerCallback(GAME_TYPES.INQUEUE, data => {
    if (data.game == GAMES.PONG) {
        showOnlyView(matchmakingView);
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
    if (data.game == GAMES.PONG) {
        isPlaying = false;
        const audio = new Audio("assets/game/sounds/chipi-chapa.mp3");
        score = [0, 0];
        audio.play();
        //gameSM.disconnect();
        let leaveButton = document.getElementById("leaveButton-spectator")
        if (leaveButton)
            leaveButton.remove();
        showOnlyView(optionsView);
        removeGameListener();
        let win = document.getElementById("myWindowGame-content");
        if(win)
            win.style.overflow = "auto";
    }
});

gameSM.registerCallback(GAME_TYPES.GAME_SCORE, data => {
    score = data;
});

gameSM.registerCallback(GAME_TYPES.LIST_TOURNAMENTS, data => {
    if (data.game == GAMES.PONG) {
        fillTournamentsList(data.data);
    }
});

gameSM.registerCallback(GAME_TYPES.LIST_GAMES, data => {
    if (data.game == GAMES.PONG) {
        fillGames(data);
    }
});

gameSM.registerCallback(GAME_TYPES.COUNTDOWN, data => {
    const countdownValue = data.counter;
    let countdownDiv = document.getElementById("countdown");
    if (countdownDiv)
        countdownDiv.parentNode.removeChild(countdownDiv);

    countdownDiv = document.createElement("div");
    countdownDiv.id = "countdown";
    countdownDiv.style.position = "absolute";
    countdownDiv.style.top = "50%";
    countdownDiv.style.left = "50%";
    countdownDiv.style.transform = "translate(-50%, -50%)";
    countdownDiv.style.fontSize = "40px";
    countdownDiv.style.color = "#fff";
    countdownDiv.style.fontFamily = "Arial";
    countdownDiv.style.textAlign = "center";
    countdownDiv.style.opacity = "0";
        
    const canvasDiv = document.getElementById("canvasDiv");
    const canvas3DDiv = document.getElementById("canvas3DDiv");

    if (!canvasDiv.classList.contains("mshide"))
        canvasDiv.appendChild(countdownDiv);
    else if (!canvas3DDiv.classList.contains("mshide"))
        canvas3DDiv.appendChild(countdownDiv);

    if (countdownValue >= 1) {
        countdownDiv.innerText = countdownValue.toString();
        countdownDiv.style.opacity = "1";
        countdownDiv.classList.add("countdown-animation");
    } else {
        countdownDiv.parentNode.removeChild(countdownDiv);
    }
});

gameSM.registerCallback(CHAT_TYPES.MY_DATA, data => {
    myUserId = data.id;
    myUsername = data.username;
});

gameSM.registerCallback(GAME_TYPES.USERS_PLAYING, data => {
    if (data.game == GAMES.PONG) {
    }
});

gameSM.registerCallback(GAME_TYPES.TOURNAMENT_CREATED, data => {
    if (data.game == GAMES.PONG) {
        if (data.data.adminId == myUserId) {
            fillTournamentData(data.data)
            showOnlyView(tournamentReadyView);
        }
    }
});

gameSM.registerCallback(GAME_TYPES.IN_TOURNAMENT, data => {
    if (data.game == GAMES.PONG) {
        if (isPlaying)
            return;
        fillTournamentData(data.data)
        showOnlyView(tournamentReadyView);
    }
});

// TODO, muestro la tabla de los emparejamientos
gameSM.registerCallback(GAME_TYPES.TOURNAMENT_TABLE, data => {
    showOnlyView(tournamentHistory);
    drawTournament(data.data);
});

gameSM.registerCallback(GAME_TYPES.TOURNAMENT_PLAYERS, data => {
});

//////////////////////
// TOURNAMENT LOGIC //
//////////////////////

// Llamando esta funcion se obtienen el emparejamiento del torneo
function requestTournamentTable(tournamentID) {
    gameSM.send(GAME_TYPES.TOURNAMENT_TABLE, tournamentID);
}

// Llamando esta funcion se obtienen los jugadores de un torneo
function requestTournamentPlayers(tournamentID) {
    gameSM.send(GAME_TYPES.TOURNAMENT_PLAYERS, tournamentID);
}

function CreateTournament() {
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

// Fill Tournament table
function fillTournamentsList(data) {
    var tournaments = document.getElementById("allTournaments-table-body");
    tournaments.innerHTML = "";
    let currentTournamentExist = false;
    data.forEach((element) => {
        if (!currentTournamentExist && element.id == tournamentJoined) {
            currentTournamentExist = true;
        }
        if (element.id == tournamentJoined)
        {
            fillTournamentData(element);
        }
        const row = document.createElement("tr");
        row.addEventListener("click", function () {
            // Fill tournament_name_join data:
            // toggleView(tournamentView, false);
            // toggleView(tournamentJoinView, true);
            showOnlyView(tournamentJoinView);
            fillTournamentData(element);
        });
        row.innerHTML = `
            <td>${element.name}</td>
            <td>${element.currentPlayers}/${element.size}</td>
        `;
        tournaments.appendChild(row);
    });
    if (!currentTournamentExist && tournamentJoined != null && !isPlaying) {
        tournamentJoined = null
        showOnlyView(optionsView);
        // toggleView(optionsView, true);
        // toggleView(tournamentJoinView, false);
        // toggleView(tournamentReadyView, false);
    }
    // TODO Cambiar tambien en la tabla de waiting fot the tournament
}

function fillTournamentData(data) {

    //Joined
    let tournamentName = document.getElementById("tournament_name_joinned");
    let nbrPlayers = document.getElementById("tournament_number_joined");
    let admin = document.getElementById("tournament_admin_joined");
    tournamentName.textContent = data.name;
    nbrPlayers.textContent = `${data.currentPlayers}/${data.size}`;
    admin.textContent = data.admin;
    tournamentJoined = data.id;

    //Join
    let tournamentName2 = document.getElementById("tournament_name_join");
    let nbrPlayers2 = document.getElementById("tournament_number_join");
    let admin2 = document.getElementById("tournament_admin_join");
    tournamentName2.textContent = data.name;
    nbrPlayers2.textContent = `${data.currentPlayers}/${data.size}`;
    admin2.textContent = data.admin;
    tournamentJoined = data.id;
}

function fillGames(data) {
    var games = document.getElementById("gameList");
    if (!games)
        return;
    // let div = gameType === "pong" ? canvasDivView = document.getElementById("canvasDiv") : document.getElementById("renderView");
    // Remove previous li elements
    while (games.firstChild)
        games.removeChild(games.firstChild);

    data.data.forEach((element) => {
        var curli = document.createElement("li");
        curli.textContent = `${element.players[0]} vs ${element.players[1]}`;
        curli.classList.add("list-group-item");
        var joinButton = document.createElement("button");
        joinButton.textContent = "View";
        joinButton.classList.add("btn", "btn-success", "btn-sm", "ml-2");
        joinButton.addEventListener('click', function () {
            gameSM.send(GAME_TYPES.SPECTATE_GAME, {
                id: element.id
            })
            showOnlyView(canvasDivView);
            // Leave
            var leaveButton = document.createElement("button");
            leaveButton.textContent = "Leave";
            leaveButton.classList.add("btn", "btn-danger", "btn-sm", "ml-2");
            leaveButton.id = "leaveButton-spectator"
            leaveButton.addEventListener('click', function (event) {
                event.stopPropagation();
                gameSM.send(GAME_TYPES.LEAVE_SPECTATE_GAME, {
                    id: element.id
                })
                leaveButton.remove();
                showOnlyView(onlineMenuView);
            });
            canvasDivView.appendChild(leaveButton);
        });
        curli.appendChild(joinButton);
        games.appendChild(curli);
    });
}

////////////////
// GAME LOGIC //
////////////////
// ! ranked false by default
function InitMatchmaking(ranked = false) {
    gameSM.send(GAME_TYPES.INITMATCHMAKING, {game : GAMES.PONG, ranked: ranked});
}

function CancelMatchmaking(ranked = false) {
    gameSM.send(GAME_TYPES.CANCELMATCHMAKING, ranked);
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
    // Draw lines
    drawDashedCenterLine();

    // Draw paddles
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        drawPaddle(player.paddle_x, player.paddle_y);
    }
    // Draw ball
    drawBall(gameState.ball.x, gameState.ball.y);
}

function drawDashedCenterLine() {
    ctx.fillStyle = "#9b9b9b";
    const lineHeight = 10;
    const gap = 20;
    const center = canvas.width / 2;
    for (let y = 5; y < canvas.height; y += gap) {
        ctx.fillRect(center - 2.5, y, 5, lineHeight);
    }
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

function initGameListener() {
    // Event listener detect keys
    window.addEventListener("keydown", handleKeyDown, false);
    window.addEventListener("keyup", handleKeyUp, false);
}

function removeGameListener() {
    // Event listener detect keys
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
}

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
        gameSM.send(GAME_TYPES.ACTION, { "game": GAMES.PONG, "action": direction })
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

export function drawScore(scores) {
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