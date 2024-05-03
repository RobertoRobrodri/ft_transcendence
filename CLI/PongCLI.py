import requests
import websocket
import ssl
import json
import curses
import threading
import queue
import urllib3
urllib3.disable_warnings()

class PongCLI:
    def __init__(self):
        self.token = None
        self.registerUrl = 'https://localhost/api/pong_auth/register/'
        self.loguinUrl   = 'https://localhost/api/pong_auth/login/'
        self.loguin2fa   = 'https://localhost/api/pong_auth/verify_otp/'
        self.socketUrl   = 'wss://localhost:4043/ws/game/?token='

        # SOCKET EVENTS
        self.INITMATCHMAKING = 'init_matchmaking'
        self.PLAYER_READY    = 'player_ready'
        self.GAME_END        = 'game_end'
        self.GAME_STATE      = 'game_state'
        self.ACTION          = 'action'
        self.INQUEUE         = 'queue_matchmaking'

        # GAME VARS
        self.CANVAS_WIDTH  = 400
        self.CANVAS_HEIGHT = 200
        self.PADDLE_WIDTH  = 10
        self.PADDLE_HEIGHT = 40

        # UI
        self.game_win      = None
        self.width_scale   = None
        self.height_scale  = None
        self.canvas_height = None
        self.canvas_width  = None

        # Input buffer
        self.input_queue = queue.Queue()
    
    def welcome_message(self):
        title = """
████████ ██████   █████  ███    ██ ███████  ██████ ███████ ███    ██ ██████  ███████ ███    ██  ██████ ███████      ██████ ██      ██ 
   ██    ██   ██ ██   ██ ████   ██ ██      ██      ██      ████   ██ ██   ██ ██      ████   ██ ██      ██          ██      ██      ██ 
   ██    ██████  ███████ ██ ██  ██ ███████ ██      █████   ██ ██  ██ ██   ██ █████   ██ ██  ██ ██      █████       ██      ██      ██ 
   ██    ██   ██ ██   ██ ██  ██ ██      ██ ██      ██      ██  ██ ██ ██   ██ ██      ██  ██ ██ ██      ██          ██      ██      ██ 
   ██    ██   ██ ██   ██ ██   ████ ███████  ██████ ███████ ██   ████ ██████  ███████ ██   ████  ██████ ███████      ██████ ███████ ██ 
   """
        print(title)
    
    def menu(self):
        while True:
            print("Enter number of your choice:")
            print("1: Login.")
            print("2: Register.")
            print("3: Exit.")
            choice = input("")
            if choice == "1":
                self.login()
                self.startGame()
                break
            elif choice == "2":
                self.register()
                self.startGame()
                break
            elif choice == "3":
                print("Exiting...")
                break
            else:
                print("Invalid choice. Please enter a valid option.")

    def register(self):
        username       = input("Enter your username: ")
        password       = input("Enter your password: ")
        repeatPassword = input("Repeat your password: ")

        if password != repeatPassword:
            print(f"Password not match.")
            self.register()
        try:
            register_data = {"username": username, "password": password, "password_2": repeatPassword}
            response = requests.post(self.registerUrl, json=register_data, verify=False)
            if response.status_code == 200:
                self.token = response.json()["token"]
                print(f"Welcome {username}.")
            else:
                print("Register failed. Please choose other username.")
                self.register()
        except requests.RequestException as e:
            print("Connection error:", e)

    def login(self):

        username = input("Enter your username: ")
        password = input("Enter your password: ")
        login_data = {"username": username, "password": password}
        
        try:
            response = requests.post(self.loguinUrl, json=login_data, verify=False)
            if response.status_code == 200:
                self.token = response.json()["token"]
                print(f"Welcome {username}.")
            elif response.status_code == 308: # 2fa
                self.token = response.json()["verification_token"]
                twofa = input("Enter 2FA code: ")
                twofa_data = {"otp": twofa}
                headers = {
                    'Authorization': f'Bearer {self.token}',
                    'Content-Type': 'application/json'
                }
                response = requests.post(self.loguin2fa, json=twofa_data, headers=headers, verify=False)
                if response.status_code == 200:
                    self.token = response.json()["token"]
                    print(f"Welcome {username}.")
                else:
                    print("Login failed. Please verify your credentials.")
                    self.login()
            else:
                print("Login failed. Please verify your credentials.")
                self.login()
        except requests.RequestException as e:
            print("Connection error:", e)

    def send(self, ws, send_type, send_message = ""):
        if ws and ws.connected:
            try:
                ws.send(json.dumps({
                    "type": send_type,
                    "message": send_message
                }))
            except Exception as e:
                print("Error sending message:", e)
        else:
            print("WebSocket connection not open. Unable to send message:", send_message)

    def connect_to_pong(self):
        if self.token:
            ws_url = self.socketUrl + self.token
            ws = websocket.WebSocket(sslopt={"cert_reqs": ssl.CERT_NONE})
            try:
                ws.connect(ws_url)
                return ws
            except websocket.WebSocketException as e:
                print("WebSocket connection failed:", e)
                return None
    
    def startGame(self):
        ws = self.connect_to_pong()
        if ws:
            input("Press Enter to enter matchmaking...")
            self.send(ws, self.INITMATCHMAKING, "Pong")
            while True:
                response = ws.recv()
                if response == "":
                    continue
                data = json.loads(response)
                type = data["type"]
                if type == self.INITMATCHMAKING:
                    self.createWindow()
                    threading.Thread(target=cli.handle_input, args=(ws,), daemon=True).start()
                    self.send(ws, self.PLAYER_READY)
                elif type == self.GAME_STATE:
                    self.drawGame(data["message"])
                elif type == self.INQUEUE:
                    print("Wating rival")
                elif type == self.GAME_END:
                    print("Game finished!")
                    self.endGame()
                    ws.close()
                    self.startGame()
                    return

    def createWindow(self):
        # Get terminal dimensions
        stdscr = curses.initscr()
        height, width = stdscr.getmaxyx()
        # curses.endwin()

        # Disable echoing of key presses
        curses.noecho()

        # Calculate scale factors for width and height
        self.width_scale = width / self.CANVAS_WIDTH
        self.height_scale = height / self.CANVAS_HEIGHT

        # Calculate the dimensions of the game window
        self.canvas_height = min(height, self.CANVAS_HEIGHT)
        self.canvas_width = min(width, self.CANVAS_WIDTH)

        # Create a new curses window the size of the canvas
        self.game_win = curses.newwin(self.canvas_height, self.canvas_width, 0, 0)

        # Clear the window before drawing the game
        self.game_win.clear()

    def drawGame(self, data):
        try:
            if self.game_win is None:
                return
            self.game_win.clear()
            # Draw border
            self.game_win.border()
            # Draw "canvas"
            self.game_win.addstr(0, 0, f'Pong cli')

            # Draw the paddle
            for player_id, player_data in data["players"].items():
                paddle_x = int(player_data["paddle_x"] * self.width_scale)
                paddle_y = int(player_data["paddle_y"] * self.height_scale)
                paddle_height = int(self.PADDLE_HEIGHT * self.height_scale)
                paddle_width = int(self.PADDLE_WIDTH * self.width_scale)
                
                # Adjust paddle coordinates to fit inside the border
                paddle_x = max(1, min(self.canvas_width - paddle_width - 2, paddle_x))
                paddle_y = max(1, min(self.canvas_height - paddle_height - 2, paddle_y))

                for i in range(paddle_height):
                    for j in range(paddle_width):
                        self.game_win.addch(paddle_y + i, paddle_x + j, '|')
        except:
            pass

        # Draw ball
        ball_x = int(data["ball"]["x"] * self.width_scale)
        ball_y = int(data["ball"]["y"] * self.height_scale)
        self.game_win.addch(ball_y, ball_x, 'o')

        # Refresh screen to show changes
        self.game_win.refresh()

    def endGame(self):
        curses.endwin()
        self.game_win = None

    def handle_input(self, ws):
        # Configure the game window for non-blocking input
        self.game_win.nodelay(True)
        while True:
            if self.game_win == None:
                return
            key = self.game_win.getch()
            if key != -1:
                # If a key is detected, put it into the input queue
                self.input_queue.put(key)

            # Process all keys in the input queue
            while not self.input_queue.empty():
                key = self.input_queue.get()
                if key == ord('w') or key == ord('W'):
                    self.send(ws, self.ACTION, {"game": "Pong", "action": "-3"})
                elif key == ord('s') or key == ord('S'):
                    self.send(ws, self.ACTION, {"game": "Pong", "action": "3"})

if __name__ == "__main__":
    cli = PongCLI()
    cli.welcome_message()
    cli.menu()
