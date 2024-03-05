// Defines to chat socket events

export const SOCKET = {
    CONNECTED: 'Connected',
    DISCONNECTED: 'Disconnected',
    ERROR: 'Error'
};

// Send types
export const CHAT_TYPES = {
    //Senders
    GET_USERS: 'get_users',

    //Receivers
    USER_LIST:         'user_list',
    USER_CONNECTED: 'user_connected',
    USER_DISCONNECTED: 'user_disconnected',
    CHAT_WITH:         'chat_with',
};

// Defines to game socket events
export const GAME_TYPES = {
    EVENT: 'event',
};