class Main {
    constructor(renderElement, gameSM) {
        this.balls = [];
        this.tps = 120;
        this.loop = new GameLoop(this.tps);
        this.keyHandler = new KeyHandler(this.loop);
        this.scene = new Scene(renderElement, this);
        this.gameSM = gameSM;
        this.hitSound = new FrequencySound('./index/games/pool/sound/hit.mp3');
        this.pocketSound = new VolumeSound('./index/games/pool/sound/pocket.mp3');

        this.setKeymap();
    }

    startGame(player1, player2) {
        console.log("gamestarted")
        //this.game = new Game(player1, player2);
    }

    setKeymap() {
        let main = this;
        this.keyHandler.setSingleKey(' ', 'Shoot cue', function () {
            this.gameSM.send("action", "shoot");
        }.bind(this));
        this.keyHandler.setSingleKey('5', 'Top view', function () {
            main.scene.topView();
        }.bind(this));
        this.keyHandler.setSingleKey('6', 'East view', function () {
            main.scene.eastView();
        }.bind(this));
        this.keyHandler.setSingleKey('4', 'West view', function () {
            main.scene.westView();
        }.bind(this));
        this.keyHandler.setSingleKey('2', 'South view', function () {
            main.scene.southView();
        }.bind(this));
        this.keyHandler.setSingleKey('8', 'North view', function () {
            main.scene.northView();
        }.bind(this));
        // this.keyHandler.setSingleKey('c', 'Enable aim line', function() {
        //     main.scene.children = main.scene.children.filter((child) => child.type !== 'Line');
        //     main.game.cheatLine = !main.game.cheatLine;
        // }.bind(this));
        this.keyHandler.setContinuousKey('ArrowLeft', 'Rotate cue left', function () {
            let rotateSpeed = 3 / this.tps;
            rotateSpeed /= this.keyHandler.isPressed('Shift') ? 10 : 1;
            rotateSpeed /= this.keyHandler.isPressed('Control') ? 5 : 1;
            this.gameSM.send("action", {
                "rotateCue": rotateSpeed
            });
        }.bind(this));
        this.keyHandler.setContinuousKey('ArrowRight', 'Rotate cue right', function () {
            let rotateSpeed = 3 / this.tps;
            rotateSpeed /= this.keyHandler.isPressed('Shift') ? 10 : 1;
            rotateSpeed /= this.keyHandler.isPressed('Control') ? 5 : 1;
            this.gameSM.send("action", {
                "rotateCue": -rotateSpeed
            });
        }.bind(this));
        this.keyHandler.setContinuousKey('ArrowUp', 'Cue power up', function () {
            let powerSpeed = 20 / this.tps;
            powerSpeed /= this.keyHandler.isPressed('Shift') ? 5 : 1;
            powerSpeed /= this.keyHandler.isPressed('Control') ? 5 : 1;
            this.gameSM.send("action", {
                "power": powerSpeed
            });
        }.bind(this));
        this.keyHandler.setContinuousKey('ArrowDown', 'Cue power down', function () {
            let powerSpeed = 20 / this.tps;
            powerSpeed /= this.keyHandler.isPressed('Shift') ? 5 : 1;
            powerSpeed /= this.keyHandler.isPressed('Control') ? 5 : 1;
            this.gameSM.send("action", {
                "power": -powerSpeed
            });
        }.bind(this));
    }

    setBalls(ballDataArray) {
        if (this.balls.length === 0)
            ballDataArray.forEach(ballData => {
                const ball = new Ball(ballData, this);
                this.balls.push(ball);
            });
    }

    rotateCue(data) {
        var quaternion = new THREE.Quaternion(data.x, data.y, data.z, data.w);
        this.scene.cue.setRotationFromQuaternion(quaternion);
    }

    moveBall(data) {
        if (this.balls.length === 0) {
            console.log("this.balls.length: 0")
            return;
        }
        data.forEach((ballPosition, index) => {
            this.balls[index].moveBall(ballPosition);
        });
        // let ball = this.balls[data.idx];
        // ball.moveBall(data.pos)
    }

    makeSound(freq) {
        this.hitSound.play(freq);
    }

    poket(ballNumber) {
        let ballWithNumber = null;
        // Get ball
        for (let i = 0; i < this.balls.length; i++) {
            if (this.balls[i].number === ballNumber) {
                ballWithNumber = this.balls[i];
                break;
            }
        }
        if (ballWithNumber === null)
            return;

        // Hidde ball animation
        let dst = ballWithNumber.position;
        dst[1] -= 0.9;
        this.scene.animateObject(ballWithNumber, dst, 500);
        this.scene.animateScale(ballWithNumber, { x: 0.1, y: 0.1, z: 0.1 }, 500);

        // Make poket sound
        this.hitSound.play(0.2);
        setTimeout(() => this.hitSound.play(0.4), 300);
        setTimeout(() => this.hitSound.play(0.3), 500);
        setTimeout(() => this.pocketSound.play(0.05 * (0.5 + Math.random())), 250);
        setTimeout(() => {
            this.scene.remove(this.balls.find(b => b.number === ballNumber));
            this.balls = this.balls.filter(b => b.number !== ballNumber);
        }, 500);
    }

    shoot(power) {
        let origPos = new THREE.Vector3(0, 0.9, -8.5),
            backPos = origPos.clone(),
            frontPos = origPos.clone();
        backPos.z -= power * 5;
        frontPos.z += 1.5;
        this.scene.animateObject(this.scene.cue.children[0], backPos, 500);
        setTimeout(() => {
            let slowTween = this.scene.animateObject(this.scene.cue.children[0], frontPos, 60 / power);
            setTimeout(() => {
                this.hitSound.play(power / 0.3075)
                setTimeout(() => {
                    slowTween.stop();
                    this.scene.animateObject(this.scene.cue.children[0], origPos, 500);
                }, 200);
            }, 60 / power / 1.9);
        }, 500);
    }

    switchPlayer(position) {
        this.scene.animateObject(this.scene.cue, new THREE.Vector3(position[0], position[1], position[2]), 1000);
    }
}
