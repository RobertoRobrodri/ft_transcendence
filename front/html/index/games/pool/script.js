import { GameSocketManager } from "../../../socket/GameSocketManager.js"
import { GAME_TYPES, SOCKET, GAMES } from '../../../socket/Constants.js';

// Singleton socket instance
let gameSM = new GameSocketManager();
let POOL = null;

function register() {
    document.getElementById("initmatchmakingpool").addEventListener("click", InitMatchmakingPool);
    // document.getElementById("initmatchmakingtournament").addEventListener("click", InitMatchmakingTournament);
    // document.getElementById("createTournament").addEventListener("click", CreateTournament);
    // document.getElementById("cancelmatchmaking").addEventListener("click", CancelMatchmaking);
}


export function connectPoolGame()
{
    gameSM.connect();
    register();
}

function InitMatchmakingPool()
{
    console.log("InitMatchmakingPool func")
    POOL = new Main(document.getElementById('renderView'), gameSM);
    gameSM.send(GAME_TYPES.INITMATCHMAKING, GAMES.POOL);
}

// Callback socket connected
gameSM.registerCallback(SOCKET.CONNECTED, event => {
    gameSM.send(GAME_TYPES.RESTORE_GAME);

});

// Callback socket disconnected
gameSM.registerCallback(SOCKET.DISCONNECTED, event => {
    
});

// Callback socket error
gameSM.registerCallback(SOCKET.ERROR, event => {
    
});

// MATCHMAKING
gameSM.registerCallback(GAME_TYPES.INITMATCHMAKING, data => {
    console.log("INITMATCHMAKING callback")
    if (POOL == null)
        POOL = new Main(document.getElementById('renderView'), gameSM);
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
