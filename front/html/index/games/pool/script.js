import { GameSocketManager } from "../../../socket/GameSocketManager.js"
import { GAME_TYPES, SOCKET, GAMES } from '../../../socket/Constants.js';

// Singleton socket instance
let gameSM = new GameSocketManager();
let POOL = null;

function register() {
    document.getElementById("initmatchmakingpool").addEventListener("click", InitMatchmaking);
    // document.getElementById("initmatchmakingtournament").addEventListener("click", InitMatchmakingTournament);
    // document.getElementById("createTournament").addEventListener("click", CreateTournament);
    // document.getElementById("cancelmatchmaking").addEventListener("click", CancelMatchmaking);
}


export function connectPoolGame()
{
    gameSM.connect();
    register();
}

function InitMatchmaking()
{
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

function updateGame(gameState) {
    if (POOL == null)
        return;

    
}

//connectGame()