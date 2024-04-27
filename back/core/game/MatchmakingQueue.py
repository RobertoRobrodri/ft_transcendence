import queue

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
                
    # def pop_users(self):
    #     if len(self.queue) >= 1:
    #         return self.queue.pop(0)#, self.queue.pop(0)
    #     else:
    #         return None
        
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