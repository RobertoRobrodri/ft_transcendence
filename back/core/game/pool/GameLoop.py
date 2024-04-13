import asyncio

class GameLoop:
    def __init__(self, main):
        self.tps = main.tps
        self.functions = {}
        self.running = True
        self.amount = 1

    def add(self, fun, *args, **kwargs):
        self.functions[self.amount] = (fun, args, kwargs)
        self.amount += 1
        return self.amount - 1

    def remove(self, funIndex):
        if funIndex in self.functions:
            del self.functions[funIndex]
        return False
    
    def stop(self):
        self.running = False
        
    async def start(self):
        while self.running:
            await self.loop()
            await asyncio.sleep(1 / self.tps)

    async def loop(self):
        for _, (fun, args, kwargs) in list(self.functions.items()):
            await fun(*args, **kwargs)