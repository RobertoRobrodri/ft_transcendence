class Ball extends THREE.Mesh {
    constructor(data, main) {
        let textureLoader = new THREE.TextureLoader();
        let map = null;
        if (data.number !== 0)
            map = textureLoader.load(`./games/pool/img/textures/balls/${data.number}.png`);

        let geometry = new THREE.SphereGeometry(data.radius, 36, 36),
            material = new THREE.MeshPhongMaterial(data.number === 0 ? { color: 0xffffff } : {
                map: map
            });
        super(geometry, material);

        this.stripe = data.stripe;
        this.radius = data.radius;
        this.position.set(data.position[0], data.position[1], data.position[2]);
        this.castShadow = true;
        this.number = data.number;
        main.scene.add(this);

    }
    
    moveBall(pos, speed) {
        
        // Update ball position
        this.position.set(pos[0], pos[1], pos[2]);
        
        // Update ball rotation
        let stepX = speed[0];
        let stepY = speed[2];
        let tempMat = new THREE.Matrix4();
        tempMat.makeRotationAxis(new THREE.Vector3(0, 0, 1), -stepX / this.radius);
        tempMat.multiply(this.matrix);
        this.matrix = tempMat;
        tempMat = new THREE.Matrix4();
        tempMat.makeRotationAxis(new THREE.Vector3(1, 0, 0), stepY / this.radius);
        tempMat.multiply(this.matrix);
        this.matrix = tempMat;
        this.rotation.setFromRotationMatrix(this.matrix);
    }

    playSound(ball) {
        let hitSpeed = ball.speed.clone().sub(this.speed);
        hitSpeed.x = Math.abs(hitSpeed.x);
        hitSpeed.y = Math.abs(hitSpeed.y);
        hitSpeed.z = Math.abs(hitSpeed.z);
        let frequency = 0.3 + (hitSpeed.length() / 0.3 * (0.75 + Math.random() / 2)) / 1.5;
        MAIN.game.hitSound.play(frequency);
    }
}
