import queue
from pong_auth.models import CustomUser
class MatchmakingQueue:
    def __init__(self):
        self.queue = []

    def add_user(self, channel_name, userid, game):
        if not self.is_user_in_queue(channel_name):
            self.queue.append({'channel_name': channel_name, 'userid': userid, 'game': game})

    def remove_user(self, userid):
        for user_info in self.queue:
            if user_info['userid'] == userid:
                self.queue.remove(user_info)
                
    async def check_mmr(self, user, game):
        pop_index = None
        popped_user = []
        user_elo = user.elo if game == 'pong' else user.elo_pool
        for i, candidate in enumerate(self.queue):
            rivalUser = await CustomUser.get_user_by_id(candidate['userid'])
            candidate_elo = rivalUser.elo if game == 'pong' else rivalUser.elo_pool
            if abs(user_elo - candidate_elo) <= 100:
                pop_index = i
                break
        if pop_index is not None:
            user_info = self.queue.pop(pop_index)
            popped_user.append(user_info) 
            return popped_user
        return None
  
    def pop_users(self, game, popAmmount):
        matching_users = [user_info for user_info in self.queue if user_info['game'] == game]
        if len(matching_users) < popAmmount:
            return None
        popped_users = []
        for _ in range(popAmmount):
            user_info = matching_users.pop(0)
            self.queue.remove(user_info)
            popped_users.append(user_info)
        return popped_users

    def get_queue_size(self, game):
        return len([user_info for user_info in self.queue if user_info['game'] == game])
    
    def is_user_in_queue(self, userid):
        return any(user_info['userid'] == userid for user_info in self.queue)