import { GameSocketManager } from "../../socket/GameSocketManager.js";
import { GAME_TYPES, SOCKET, GAMES, CHAT_TYPES } from '../../socket/Constants.js';
import { initializeGame, endGame } from "./localGameLogic.js";

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

// Singleton socket instance
let gameSM = new GameSocketManager();

let optionsView, matchmakingView, localgameView, onlineMenuView,
    tournamentView, tournamentJoinView, tournamentReadyView,
    emparejamientoView, canvasDivView, resultadosView,
    canvas3DDivView;

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
    emparejamientoView = document.getElementById("emparejamiento");
    resultadosView = document.getElementById("results");
    canvas = document.getElementById("pongCanvas");
    ctx = canvas.getContext("2d");

    gameSM.connect();
}

async function setTournaments() {
    gameSM.send(GAME_TYPES.LIST_TOURNAMENTS, GAMES.PONG);
}

function gameEventHandler(e) {
    // multiplayer
    if (e.target.matches('#onlineGameMenu_pong') === true) {
        gameSM.send(GAME_TYPES.LIST_GAMES, GAMES.PONG);
        toggleView(optionsView, false);
        toggleView(onlineMenuView, true);
    }
    else if (e.target.matches('#tournamentButton_pong') === true) {
        toggleView(optionsView, false);
        toggleView(tournamentView, true);
        setTournaments();
    }
    else if (e.target.matches('#backToTournaments') === true) {
        tournamentJoined = null;
        toggleView(tournamentJoinView, false);
        toggleView(tournamentView, true);
    }
    else if (e.target.matches('#leaveTournament') === true) {
        // Llamamos a la funcion para salir de un torneo
        gameSM.send(GAME_TYPES.LEAVE_TOURNAMENT, {
            id: tournamentJoined,
            game: GAMES.PONG
        })
        tournamentJoined = null;
        toggleView(tournamentJoinView, false);
        toggleView(tournamentReadyView, false);
        toggleView(tournamentView, true);
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
        // Comprobamos si el nickname es valido
        // Llamamos a la funcion para entrar a un torneo
        // toggleView(tournamentView, false);
        // toggleView(tournamentReadyView, true);
    }
    else if (e.target.matches('#createTournament') === true) {
        CreateTournament();
    }
    else if (e.target.matches('#onlineGameButton_pong') === true) {
        toggleView(onlineMenuView, false);
        toggleView(matchmakingView, true);
        InitMatchmaking();
    }
    else if (e.target.matches('#cancelMatchmakingButton_pong') === true) {
        toggleView(matchmakingView, false);
        toggleView(onlineMenuView, false);
        toggleView(tournamentView, false);
        toggleView(optionsView, true);
        CancelMatchmaking();
    }
    // juego local (2 players)
    else if (e.target.matches('#localGameButton_pong') === true) {
        toggleView(optionsView, false);
        toggleView(localgameView, true);
    }
    // 1 jugador (with Neural network)
    else if (e.target.matches('#soloGameButton_pong') === true) {
        toggleView(localgameView, false);
        toggleView(canvasDivView, true);
        initializeGame();
    }
    // 1 jugador (With Algorithm)
    else if (e.target.matches('#soloGameButtonAlgo_pong') === true) {
        toggleView(localgameView, false);
        toggleView(canvasDivView, true);
        initializeGame(false, false)
    }
    // 3D
    else if (e.target.matches('#soloGameButton3D_pong') === true) {
        toggleView(localgameView, false);
        toggleView(canvas3DDivView, true);
        initializeGame(false, true, true)
    }

    // Multijugador local
    else if (e.target.matches('#localMultiplayerButton_pong') === true) {
        toggleView(localgameView, false);
        toggleView(canvasDivView, true);
        initializeGame(true);
    }
    else if (e.target.matches('#goBackButton_pong') === true) {
        toggleView(optionsView, true);
        toggleView(localgameView, false);
        toggleView(onlineMenuView, false);
    }
    else if (e.target.matches('#red-myWindowGame') === true) {
        // si está conectado el socket, lo desconecta
        gameSM.disconnect();
        // si está en una partida de un jugador, la termina
        endGame(true);
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
    if (data.game == GAMES.PONG) {
        gameSM.send(GAME_TYPES.PLAYER_READY);
        toggleView(optionsView, false);
    }
});

// MATCHMAKING
// TODO Aqui oculto la tabla del emparejamiento
gameSM.registerCallback(GAME_TYPES.INITMATCHMAKING, data => {

    if (data.game == GAMES.PONG) {
        isPlaying = true;
        toggleView(matchmakingView, false);
        toggleView(onlineMenuView, false);
        toggleView(tournamentView, false);
        toggleView(optionsView, false);
        toggleView(tournamentReadyView, false);
        toggleView(tournamentJoinView, false);
        toggleView(localgameView, false);
        toggleView(canvasDivView, true);
        toggleView(emparejamientoView, false);
        gameSM.send(GAME_TYPES.PLAYER_READY);
    }
});

gameSM.registerCallback(GAME_TYPES.CANCELMATCHMAKING, data => {

});

gameSM.registerCallback(GAME_TYPES.INQUEUE, data => {
    if (data.game == GAMES.PONG) {
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
    if (data.game == GAMES.PONG) {
        isPlaying = false;
        const audio = new Audio("assets/game/sounds/chipi-chapa.mp3");
        score = [0, 0];
        audio.play();
        //gameSM.disconnect();
        let leaveButton = document.getElementById("leaveButton-spectator")
        if (leaveButton)
            leaveButton.remove();
        toggleView(canvasDivView, false);
        toggleView(optionsView, true);
        toggleView(emparejamientoView, false);
    }
});

gameSM.registerCallback(GAME_TYPES.GAME_SCORE, data => {
    score = data;
    console.log(data);
});

gameSM.registerCallback(GAME_TYPES.LIST_TOURNAMENTS, data => {
    if (data.game == GAMES.PONG) {
        fillTournamentsList(data.data);
    }
});

gameSM.registerCallback(GAME_TYPES.LIST_GAMES, data => {
    console.log(data)
    if (data.game == GAMES.PONG) {
        fillGames(data);
    }
});

gameSM.registerCallback(GAME_TYPES.COUNTDOWN, data => {
    console.log(`game start in: ${data.counter}`)
    // gameSM.send(GAME_TYPES.PLAYER_READY);

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
            toggleView(tournamentView, false);
            toggleView(tournamentReadyView, true);
        }
    }
});

gameSM.registerCallback(GAME_TYPES.IN_TOURNAMENT, data => {
    if (data.game == GAMES.PONG) {
        if (isPlaying)
            return;
        //el usuario está en un torneo
        console.log(data.data)
        fillTournamentData(data.data)
        toggleView(optionsView, false);
        toggleView(tournamentReadyView, true);
    }
});

function setMatchmaking(data) {
    console.log(data);
    resultadosView.innerHTML = "";
    resultadosView.innerHTML = resultadosView.innerHTML + "<hr class='line'>"; 
    let tabla = "";
    let player1 = "";
    let player1Points = 0;
    for (let ronda of data.data) {
        console.log("________________________")
        for (let jugadores of ronda) {
            if (jugadores[1]) {
                player1 = jugadores[1].nickname;
                player1Points = jugadores[1].points;
            }
            else {
                player1 = "Bye";
                player1Points = 0;
            }
            tabla = `<table class='table table-dark'> \
                            <tbody>\
                                <tr>\
                                    <td class='text-left score'>${jugadores[0].nickname}</td>\
                                    <td class='text-center score'>${jugadores[0].points}</td>\
                                    <td class='text-center score'>${player1Points}</td>\
                                    <td class='text-right' score>${player1}</td>\
                                </tr>\
                            </tbody>\
                        </table>`;
            resultadosView.innerHTML = resultadosView.innerHTML + tabla; 
        }
        resultadosView.innerHTML = resultadosView.innerHTML + "<hr class='line'>"; 
    }
    toggleView(optionsView, false);
    toggleView(tournamentJoinView, false);
    toggleView(tournamentReadyView, false);
    toggleView(emparejamientoView, true);
}

// TODO, muestro la tabla de los emparejamientos
gameSM.registerCallback(GAME_TYPES.TOURNAMENT_TABLE, data => {
    console.log("tournament table");
    setMatchmaking(data);
    // console.log(data);
});

gameSM.registerCallback(GAME_TYPES.TOURNAMENT_PLAYERS, data => {
    console.log(`tournament players: ${data}`)
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
        const row = document.createElement("tr");
        row.addEventListener("click", function () {
            // Fill tournament_name_join data:
            toggleView(tournamentView, false);
            toggleView(tournamentJoinView, true);
            fillTournamentData(element);
        });
        row.innerHTML = `
            <td>${element.name}</td>
            <td>${element.currentPlayers}/${element.size}</td>
        `;
        tournaments.appendChild(row);
    });
    if (!currentTournamentExist && tournamentJoined != null && !isPlaying) {
        // toggleView(tournamentView, true);
        toggleView(tournamentJoinView, false);
        toggleView(tournamentReadyView, false);
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

// // Fill Tournament list
// function fillTournaments2(data) {
//     var tournaments = document.getElementById("tournamentList");

//     // Remove previous li elements
//     while (tournaments.firstChild)
//         tournaments.removeChild(tournaments.firstChild);

//     console.log(data);

//     data.forEach((element) => {
//         var curli = document.createElement("li");
//         curli.textContent = `${element.name} (${element.currentPlayers}/${element.size})`;
//         curli.classList.add("list-group-item");
//         // curli.dataset.tournamentId = element.id;
//         // Click example to join tournament
//         curli.addEventListener('click', function () {
//             var nickname = prompt(`¿Want join to ${element.name} tournament? Introduce your nickname:`);
//             if (nickname !== null && nickname !== "") {
//                 //JOIN_TOURNAMENT
//                 gameSM.send(GAME_TYPES.JOIN_TOURNAMENT, {
//                     id: element.id,
//                     nick: nickname,
//                     game: GAMES.PONG
//                 })
//                 console.log("El usuario confirmó la entrada al torneo.");
//             }
//         });

//         // Leave
//         var leaveButton = document.createElement("button");
//         leaveButton.textContent = "Leave";
//         leaveButton.classList.add("btn", "btn-danger", "btn-sm", "ml-2");
//         leaveButton.addEventListener('click', function (event) {
//             event.stopPropagation();
//             gameSM.send(GAME_TYPES.LEAVE_TOURNAMENT, {
//                 id: element.id,
//                 game: GAMES.PONG
//             })
//         });
//         curli.appendChild(leaveButton);
//         tournaments.appendChild(curli);
//     });
// }

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
            toggleView(canvasDivView, true);
            toggleView(onlineMenuView, false);
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
                toggleView(canvasDivView, false);
                toggleView(onlineMenuView, true);
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

function InitMatchmaking() {
    gameSM.send(GAME_TYPES.INITMATCHMAKING, GAMES.PONG);
}

function InitMatchmakingTournament() {
    gameSM.send(GAME_TYPES.INITMATCHMAKING, GAMES.TOURNAMENT);
}

function CancelMatchmaking() {
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