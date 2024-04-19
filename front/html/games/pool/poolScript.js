import { GameSocketManager } from "../../socket/GameSocketManager.js"
import { GAME_TYPES, SOCKET, GAMES } from '../../socket/Constants.js';

// Singleton socket instance
let gameSM = new GameSocketManager();
let POOL = null;

let optionsView, matchmakingView, uiView;

export function init()
{
    document.getElementById('root').addEventListener('click', poolEventHandler);

    optionsView     = document.getElementById("game_options_pool");
    matchmakingView = document.getElementById("matchmaking_pool");
    uiView          = document.getElementById("ui");

    gameSM.connect();
}

function poolEventHandler(e) {
    if (e.target.matches('#onlineGameButton_pool') === true) {
        connectGame();
    } 
    else if (e.target.matches('#cancelMatchmakingButton_pool') === true) {
        toggleView(matchmakingView, false);
        toggleView(optionsView, true);
        CancelMatchmaking();
    }
    else if (e.target.matches('#red-myWindowPool') === true) {
        gameSM.disconnect();
        POOL = null;
    }
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

gameSM.registerCallback(GAME_TYPES.GAME_END, data => {
    //gameSM.disconnect();
    if(data.game == GAMES.POOL) {
        resetThreejs();
    }
});

gameSM.registerCallback(GAME_TYPES.GAME_RESTORED, data => {
    if(data.game == GAMES.POOL) {
        toggleView(optionsView, false);
        toggleView(uiView, true);
        resetUI();
        if (POOL == null)
            POOL = new Main(document.getElementById('renderView'), gameSM);
    }
});

// MATCHMAKING
gameSM.registerCallback(GAME_TYPES.INITMATCHMAKING, data => {
    if (data.game == GAMES.POOL) {
        toggleView(matchmakingView, false);
        toggleView(uiView, true);
        gameSM.send(GAME_TYPES.PLAYER_READY);
        resetUI();
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
    if(data.game == GAMES.POOL) {
        toggleView(matchmakingView, true);
        toggleView(optionsView, false);
    }
});

gameSM.registerCallback(GAME_TYPES.USERS_PLAYING, data => {
    if (data.game == GAMES.POOL) {
        const usersArray = Object.values(data.users);
        const username0 = usersArray[0].username;
        const username1 = usersArray[1].username;

        document.querySelector('.top-right').textContent = username0;
        document.querySelector('.top-left').textContent = username1;
    }
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
    POOL.poket(data.ballNumber)
    if(data.ballNumber != 0 && data.ballNumber != 8) {
        if(data.ballNumber < 8) {
            if(data.user1Balls)
                inserBalltImage(data.ballNumber, '.image-row');
            else
                inserBalltImage(data.ballNumber, '.image-row-2');
        }
        else {
            if(!data.user1Balls)
                inserBalltImage(data.ballNumber, '.image-row');
            else
                inserBalltImage(data.ballNumber, '.image-row-2');
        }
    }
});

function inserBalltImage(imageNumber, targetContainer) {
    const img = document.createElement('img');
    const imageUrl = `games/pool/textures/balls/${imageNumber}.png`;
    img.src = imageUrl;
    const container = document.querySelector(targetContainer);
    container.appendChild(img);
}

gameSM.registerCallback("shoot", data => {
    POOL.shoot(data)
});

gameSM.registerCallback("cue_power", data => {
    //cue power changed
    const minValue = 6;
    const maxValue = 55;
    const receivedValue = data;
    const percentage = ((receivedValue - minValue) / (maxValue - minValue)) * 100;
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.width = percentage + '%';
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
    //gameSM.disconnect();
    resetThreejs();
});

function resetThreejs() {
    //POOL.stop();
    var renderViewDiv = document.getElementById("renderView");
    var canvas = renderViewDiv.querySelector("canvas");
    if (canvas)
        renderViewDiv.removeChild(canvas);
    POOL = null;
    toggleView(uiView, false);
    toggleView(optionsView, true);
    resetUI();
}

function resetUI() {
    //Reset content if have
    document.querySelector('.progress-bar').style.width = '100%'
    document.querySelector('.top-right').textContent = '';
    document.querySelector('.top-left').textContent = '';
    document.querySelector('.image-row').innerHTML = '';
    document.querySelector('.image-row-2').innerHTML = '';
}