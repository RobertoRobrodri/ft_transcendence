import { GameSocketManager } from "../../socket/GameSocketManager.js"
import { GAME_TYPES, SOCKET, GAMES } from '../../socket/Constants.js';

// Singleton socket instance
let gameSM = new GameSocketManager();
let POOL = null;

let optionsView, matchmakingView;

export function init()
{
    document.getElementById('root').addEventListener('click', poolEventHandler);

    optionsView = document.getElementById("game_options_pool");
    matchmakingView = document.getElementById("matchmaking_pool");

    gameSM.connect();
}

function poolEventHandler(e) {
    if (e.target.matches('#onlineGameButton_pool') === true)
    {
        connectGame();
    } else if (e.target.matches('#cancelMatchmakingButton_pool') === true)
    {
        toggleView(matchmakingView, false);
        toggleView(optionsView, true);
        CancelMatchmaking();
    }
    else if (e.target.matches('#red-myWindowChat') === true)
        gameSM.disconnect();
}

function toggleView(view, visible = true) {
    if (visible)
        view.classList.remove("mshide");
    else
        view.classList.add("mshide");
}

 async function connectGame()
{
    //gameSM.connect();
    //await sleep(200); // Si entramos directos al matchmaking necesita un pequeño sleep
    InitMatchmakingPool();
    // ! We now get the canvas from the update game
    // canvas = document.getElementById("pongCanvas");
    // ctx = canvas.getContext("2d");
}

function InitMatchmakingPool()
{
    gameSM.send(GAME_TYPES.INITMATCHMAKING, GAMES.POOL);
}

function CancelMatchmaking()
{
    gameSM.send(GAME_TYPES.CANCELMATCHMAKING);
}

// Callback socket connected
gameSM.registerCallback(SOCKET.CONNECTED, event => {
    gameSM.send(GAME_TYPES.RESTORE_GAME, GAMES.POOL);

});

// Callback socket disconnected
gameSM.registerCallback(SOCKET.DISCONNECTED, event => {
    
});

// Callback socket error
gameSM.registerCallback(SOCKET.ERROR, event => {
    
});


gameSM.registerCallback(GAME_TYPES.GAME_RESTORED, data => {
    if(data.game == GAMES.POOL) {
        toggleView(optionsView, false);
    }
});

// MATCHMAKING
gameSM.registerCallback(GAME_TYPES.INITMATCHMAKING, data => {
    if (data.game == GAMES.POOL) {
        toggleView(matchmakingView, false);
        gameSM.send(GAME_TYPES.PLAYER_READY);
        if (POOL == null)
            POOL = new Main(document.getElementById('renderView'), gameSM);
        //Game matched! game started
        // send ready request after open game, message to ask about ready etc
        
    }
});

gameSM.registerCallback(GAME_TYPES.CANCELMATCHMAKING, data => {
    
});

gameSM.registerCallback(GAME_TYPES.LIST_TOURNAMENTS, data => {
    if(data.game == GAMES.POOL) {
        //fillTournaments(data);
        console.log("tournaments: " + data)
    }
});

gameSM.registerCallback(GAME_TYPES.LIST_GAMES, data => {
    if(data.game == GAMES.POOL) {
        //fillGames(data);
        console.log("games: " + data)
    }
});

gameSM.registerCallback(GAME_TYPES.INQUEUE, data => {
    toggleView(matchmakingView, true);
    toggleView(optionsView, false);
});

// GAME
gameSM.registerCallback("init_state", data => {
    POOL.setBalls(data)
});

gameSM.registerCallback("rotate_cue", data => {
    POOL.rotateCue(data)
});

gameSM.registerCallback("move_ball", data => {
    POOL.moveBall(data)
});

gameSM.registerCallback("sound", data => {
    POOL.makeSound(data)
});

gameSM.registerCallback("poket", data => {
    POOL.poket(data)
});

gameSM.registerCallback("shoot", data => {
    POOL.shoot(data)
});

gameSM.registerCallback("cue_power", data => {
    //cue power changed
    console.log(data)
});

gameSM.registerCallback("switch_player", data => {
    POOL.switchPlayer(data)
});

// user fault, request move white ball
gameSM.registerCallback("req_place_white", data => {
    POOL.reqMoveWhite(data)
});

//rcv white ball position
gameSM.registerCallback("move_white", data => {
    POOL.moveWhite(data)
});

gameSM.registerCallback("place_white", data => {
    POOL.placeWhite(data)
});

gameSM.registerCallback("rival_leave", data => {
    console.log("The opponent leaves, the game ends in 10 seconds if he does not reconnect")
});
