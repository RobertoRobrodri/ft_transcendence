import queue

class MatchmakingQueue:
    def __init__(self):
        self.queue = []

    def add_user(self, channel_name, username):
        if not self.is_user_in_queue(channel_name):
            self.queue.append({'channel_name': channel_name, 'username': username})

    def remove_user(self, channel_name):
        for user_info in self.queue:
            if user_info['channel_name'] == channel_name:
                self.queue.remove(user_info)

    def pop_users(self):
        if len(self.queue) >= 1:
            return self.queue.pop(0)#, self.queue.pop(0)
        else:
            return None

    def get_queue_size(self):
        return len(self.queue)
    
    def is_user_in_queue(self, channel_name):
        return any(user_info['channel_name'] == channel_name for user_info in self.queue)