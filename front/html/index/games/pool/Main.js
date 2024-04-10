class Main {
    constructor(renderElement, gameSM) {
        this.balls = [];
        this.tps = 120;
        this.loop = new GameLoop(this.tps);
        this.keyHandler = new KeyHandler(this.loop);
        this.scene = new Scene(renderElement, this);
        this.gameSM = gameSM;
        this.setKeymap();
    }

    startGame(player1, player2) {
        console.log("gamestarted")
        //this.game = new Game(player1, player2);
    }

    setKeymap() {
        let main = this;
        this.keyHandler.setSingleKey(' ', 'Shoot cue', function() {
            //main.game.shoot();
            this.gameSM.send("action", "shoot");
        }.bind(this));
        this.keyHandler.setSingleKey('5', 'Top view', function() {
            main.scene.topView();
        }.bind(this));
        this.keyHandler.setSingleKey('6', 'East view', function() {
            main.scene.eastView();
        }.bind(this));
        this.keyHandler.setSingleKey('4', 'West view', function() {
            main.scene.westView();
        }.bind(this));
        this.keyHandler.setSingleKey('2', 'South view', function() {
            main.scene.southView();
        }.bind(this));
        this.keyHandler.setSingleKey('8', 'North view', function() {
            main.scene.northView();
        }.bind(this));
        // this.keyHandler.setSingleKey('c', 'Enable aim line', function() {
        //     main.scene.children = main.scene.children.filter((child) => child.type !== 'Line');
        //     main.game.cheatLine = !main.game.cheatLine;
        // }.bind(this));
        this.keyHandler.setContinuousKey('ArrowLeft', 'Rotate cue left', function() {
            let rotateSpeed = 3 / this.tps;
            rotateSpeed /= this.keyHandler.isPressed('Shift') ? 10 : 1;
            rotateSpeed /= this.keyHandler.isPressed('Control') ? 5 : 1;
            this.gameSM.send("action", {
                "rotateCue": rotateSpeed
            });
        }.bind(this));
        this.keyHandler.setContinuousKey('ArrowRight', 'Rotate cue right', function() {
            let rotateSpeed = 3 / this.tps;
            rotateSpeed /= this.keyHandler.isPressed('Shift') ? 10 : 1;
            rotateSpeed /= this.keyHandler.isPressed('Control') ? 5 : 1;
            this.gameSM.send("action", {
                "rotateCue": -rotateSpeed
            });
        }.bind(this));
        this.keyHandler.setContinuousKey('ArrowUp', 'Cue power up', function() {
            let powerSpeed = 20 / this.tps;
            powerSpeed /= this.keyHandler.isPressed('Shift') ? 5 : 1;
            powerSpeed /= this.keyHandler.isPressed('Control') ? 5 : 1;
            //this.game.cuePower += powerSpeed;
        }.bind(this));
        this.keyHandler.setContinuousKey('ArrowDown', 'Cue power down', function() {
            let powerSpeed = 20 / this.tps;
            powerSpeed /= this.keyHandler.isPressed('Shift') ? 5 : 1;
            powerSpeed /= this.keyHandler.isPressed('Control') ? 5 : 1;
            //this.game.cuePower -= powerSpeed;
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
        if (this.balls.length === 0)
            return;
        data.forEach((ballPosition, index) => {
            this.balls[index].moveBall(ballPosition);
        });
        // let ball = this.balls[data.idx];
        // ball.moveBall(data.pos)
    }

    shoot(cuePower) {
        if (this.shootingEnabled) {
            this.shootingEnabled = false;
            let origPos = new THREE.Vector3(0, 0.9, -8.5),
                backPos = origPos.clone(),
                frontPos = origPos.clone(),
                power = cuePower / this.tps;
            backPos.z -= power * 5;
            frontPos.z += 1.8;

            let that = this;
            this.scene.animateObject(this.scene.cue.children[0], backPos, 500);
            self.setTimeout(function() {
                let slowTween = this.scene.animateObject(this.scene.cue.children[0], frontPos, 60 / power);
                self.setTimeout(function() {

                    let rotation = this.scene.cue.rotation.y;
                    if (this.scene.cue.rotation.x === Math.PI)
                        rotation = Math.PI - rotation;
                    if (this.scene.cue.rotation.x < -1)
                        rotation = Math.PI - rotation;
                    else if (this.scene.cue.rotation.y < 0)
                        rotation = 2 * Math.PI + rotation;
                    let x = Math.cos(rotation),
                        z = Math.sin(rotation),
                        speed = new THREE.Vector3(z, 0, x).multiplyScalar(power);

                    //that.selectedBall.setSpeed(speed);

                    that.hitSound.play(power / 0.3075)

                    self.setTimeout(function() {
                        slowTween.stop();
                        this.scene.animateObject(this.scene.cue.children[0], origPos, 500);
                    }, 200);

                }, 60 / power / 1.9);
            }, 500);
        }
    }
}
