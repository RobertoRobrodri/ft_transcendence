import queue

class MatchmakingQueue:
    def __init__(self):
        self.queue = []

    def add_user(self, channel_name, userid):
        if not self.is_user_in_queue(channel_name):
            self.queue.append({'channel_name': channel_name, 'userid': userid})

    def remove_user(self, userid):
        for user_info in self.queue:
            if user_info['userid'] == userid:
                self.queue.remove(user_info)

    def pop_users(self):
        if len(self.queue) >= 1:
            return self.queue.pop(0)#, self.queue.pop(0)
        else:
            return None

    def get_queue_size(self):
        return len(self.queue)
    
    def is_user_in_queue(self, userid):
        return any(user_info['userid'] == userid for user_info in self.queue)