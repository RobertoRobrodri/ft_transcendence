// Defines to chat socket events

export const SOCKET = {
    CONNECTED:      'Connected',
    DISCONNECTED:   'Disconnected',
    ERROR:          'Error'
};

// Chat socket events
export const CHAT_TYPES = {
    USER_CONNECTED:    'user_connected',        // Callback: User connected
    USER_DISCONNECTED: 'user_disconnected',     // Callback: User disconnected
    USER_LIST:         'user_list',             // Callback and sender: All online users
    GENERAL_MSG:       'general_chat',          // Callback and sender: General message
    PRIV_MSG:          'priv_msg',              // Callback and sender: Private message from or to user
    LIST_MSG:          'get_messages_between',  // Callback and sender: Request and receive a list of private message history
    IGNORE_USER:       'ignore_user',           // Sender: Request to ignore user
    UNIGNORE_USER:     'unignore_user',         // Sender: Request to unignore user
    IGNORE_LIST:       'ignore_list',           // Callback and sender: Request and get ignored list
    SEEN_MSG:          'seen_msg',              // Sender: mark message as seen
    GAME_REQUEST:      'game_request',          // Sender: Invite user to private game
    ACCEPT_GAME:       'accept_game',           // Sender: Accept game
};

// Game socket events
export const GAME_TYPES = {
    INITMATCHMAKING:    'init_matchmaking',
    CANCELMATCHMAKING:  'cancel_matchmaking',
    INQUEUE:            'queue_matchmaking',
    PLAYER_READY:       'player_ready',
    RESTORE_GAME:       'restore_game',
    
    GAME_STATE:         'game_state',
    GAME_SCORE:         'game_score',
    GAME_END:           'game_end',
    GAME_RIVAL_LEAVE:   'game_rival_leave',
    DIRECTION:          'direction',
    WALL_COLLISON:      'wall_collison',
    PADDLE_COLLISON:    'paddle_collison',
};