# PongCLI Documentation

## Introduction
PongCLI is a command-line interface (CLI) implementation of the classic game Pong. It allows users to play Pong directly from their terminal window using text-based graphics and keyboard input.

## What is a CLI?
A Command-Line Interface (CLI) is a text-based interface used to interact with computer programs by entering commands into a terminal or command prompt. Unlike graphical user interfaces (GUI), which use windows, icons, and menus, CLIs rely solely on text input and output. CLIs are commonly used for a wide range of applications, including system administration, software development, and more.

In the context of this project, the PongCLI is a CLI-based application that allows users to play the classic game of Pong in a terminal environment. Users interact with the game by typing commands and receiving text-based feedback, creating a simple yet engaging gaming experience.

## Features
- **Login/Register:** Users can log in to an existing account or register a new one.
- **WebSocket Communication:** Utilizes WebSocket communication for real-time multiplayer gameplay.
- **Gameplay:** Allows users to control their paddles using keyboard input and compete against opponents in Pong matches.
- **Text-Based Graphics:** Renders the game interface using text characters to represent paddles and the ball.

## Installation
Before using PongCLI, ensure you have the necessary requirements installed. You can install them using the following command:

```bash
pip install -r requirements.txt
```

## Usage
To start the PongCLI application, execute the `PongCLI.py` file using Python:

```bash
python PongCLI.py
```

## Game Controls
- **w:** Move the paddle up.
- **s:** Move the paddle down.
- **Enter:** Confirm selections and advance through menus.

## Dependencies
- Python 3.x
- requests
- websocket-client
- curses

## Getting Started
1. Run the PongCLI application using the provided command.
2. Follow the on-screen prompts to log in to an existing account or register a new one.
3. Once logged in, the press enter to find a match and the game will start automatically, you can begin playing Pong against other players.