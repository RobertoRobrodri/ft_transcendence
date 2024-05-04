from .MatchmakingQueue import MatchmakingQueue

tournaments     = {} # Store tournaments
games           = {} # Store games
available_games = ["Pong", "Tournament", "Pool"]
casual_queue = MatchmakingQueue()
ranked_queue = MatchmakingQueue()