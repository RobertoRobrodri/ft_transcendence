import { GameSocketManager } from "../socket/GameSocketManager.js"
import { GAME_TYPES, SOCKET } from '../socket/Constants.js';

function register() {
    document.getElementById("initmatchmaking").addEventListener("click", InitMatchmaking);
    document.getElementById("cancelmatchmaking").addEventListener("click", CancelMatchmaking);
}

// Singleton socket instance
let gameSM = new GameSocketManager();

export function connectGame()
{
    gameSM.connect();
    register();
}

function InitMatchmaking()
{
    gameSM.send(GAME_TYPES.INITMATCHMAKING);
}

function CancelMatchmaking()
{
    gameSM.send(GAME_TYPES.CANCELMATCHMAKING);
}

// Callback socket connected
gameSM.registerCallback(SOCKET.CONNECTED, event => {

});

// Callback socket disconnected
gameSM.registerCallback(SOCKET.DISCONNECTED, event => {
    
});

// Callback socket error
gameSM.registerCallback(SOCKET.ERROR, event => {
    
});

// MATCHMAKING
gameSM.registerCallback(SOCKET.INITMATCHMAKING, event => {
    
});