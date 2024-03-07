// Defines to chat socket events

export const SOCKET = {
    CONNECTED:      'Connected',
    DISCONNECTED:   'Disconnected',
    ERROR:          'Error'
};

// Send types
export const CHAT_TYPES = {
    GET_USERS:          'get_users',

    USER_CONNECTED:    'user_connected',
    USER_DISCONNECTED: 'user_disconnected',
    USER_LIST:         'user_list',
    GENERAL_MSG:       'general_msg',
    PRIV_MSG:          'priv_msg',
};

// Defines to game socket events
export const GAME_TYPES = {
    EVENT: 'event',
};