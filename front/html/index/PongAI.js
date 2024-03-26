export class PongAI {
    constructor() {
        // Variables de la RNA
        this.WXE1 = [this.random(), this.random(), this.random(), this.random()]; // 4 pesos primera neurona de la capa de entrada
        this.WXE2 = [this.random(), this.random(), this.random(), this.random()]; // 4 pesos segunda neurona de la capa de entrada
        this.WO1E = [this.random(), this.random()]; // 2 pesos primera neurona de la capa oculta
        this.WO2E = [this.random(), this.random()]; // 2 pesos segunda neurona de la capa oculta
        this.WS = [this.random(), this.random()]; // 2 pesos neurona de la capa de salida
        this.X = []; // datos para 'alimentacion' de la red neuronal
        this.E1 = 0; // primera neurona de la capa de entrada
        this.E2 = 0; // segunda neurona de la capa de entrada
        this.O1 = 0; // primera neurona de la capa oculta
        this.O2 = 0; // segunda neurona de la capa oculta
        this.S = 0; // valor de salida
        this.B = 1; // valor de la constante bias (sesgo)
        this.cost = 0; // valor de la tasa de coste
        this.resul;
        this.loadTrainedWeights();

        // Variables del algoritmo normal
        this.prevBallX = null;
        this.prevBallY = null;
    }
    
    loadTrainedWeights() {
        this.WXE1 = [-0.015270523165288798,0.4757071442679575,-0.9136990110769312,-0.15236689800435801];
        this.WXE2 = [-0.002963426208980807,0.9694068855539781,-0.5885226854463134,0.028443858501022785];
        this.WO1E = [0.46745995821474484,0.6663174868997028];
        this.WO2E = [0.4340591391286907,0.5150288467507528];
        this.WS = [0.05680382439738113,0.7930956372213506];
        this.cost = -0.02148083593692185;
    }
    
    process(ballX, ballY, paddleY, paddleSize, canvasHeight, canvasWidth) {
        this.fillData(ballX, ballY, paddleY, paddleSize, canvasHeight, canvasWidth);
        this.feedfoward();
        let ret = this.calculateOutput(this.S);
        this.updateWeights(this.cost);
        return ret;
    }

    fillData(ballX, ballY, paddleY, paddleSize, canvasHeight, canvasWidth){
        this.X = [
            ballX / canvasWidth,                // Posición X actual de la pelota
            ballY / canvasHeight,               // Posición Y actual de la pelota
            //prevBallX / canvasWidth,            // Posición X anterior de la pelota
            //prevBallY / canvasHeight,           // Posición Y anterior de la pelota
            paddleY / canvasHeight,             // Posición Y de la raqueta
            this.B                               // Sesgo
        ];
        // Calcula el error: centro de la bola - centro de la raqueta
        this.cost = ((ballY) - (paddleY + paddleSize / 2)) / canvasHeight;
    }
    
    // Calcular el producto de 2 vectores
    vectorProduct(a, b) {
        const res = [];
        for (let i = 0; i < a.length; i++) {
            res.push(parseFloat(a[i]) * parseFloat(b[i]));
        }
        return res;
    }
    
    // Numero aleatorio para los pesos iniciales
    random() {
        return Math.random();
    }

    // Calcula la tangente hiperbolica: (e^x - e^(-x)) / (e^x + e^(-x)) 
    hyperbolicTangent(x) {
        return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x));
    }

    // Funcion sigmoidal o logistica, en resumen es la funcion que nos va a dar el valor entre 0 y 1 para saber cual es el movimiento que la AI debe realizar
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    feedfoward() {
        // Calcula la activacion de la primera capa oculta (multiplica el vector X por los pesos WXE1, posteriormente suma los resultados de las multiplicaciones, y luego se calcula la tangente hiperbolica del resultado)
        this.E1 = this.hyperbolicTangent(this.vectorProduct(this.X, this.WXE1).reduce((E1, currentElement) => E1 + currentElement));
        // Lo mismo con la segunda capa oculta
        this.E2 = this.hyperbolicTangent(this.vectorProduct(this.X, this.WXE2).reduce((E2, currentElement) => E2 + currentElement));
        // Lo mismo con la primera capa de salida
        this.O1 = this.hyperbolicTangent(this.vectorProduct([this.E1, this.E2], this.WO1E).reduce((O1, currentElement) => O1 + currentElement));
        // Lo mismo con la segunda capa de salida
        this.O2 = this.hyperbolicTangent(this.vectorProduct([this.E1, this.E2], this.WO2E).reduce((O2, currentElement) => O2 + currentElement));
        // Se calcula el resultado haciendo el producto de las dos capas de salida y aplicando la funcion sigmoide
        this.S = this.sigmoid(this.vectorProduct([this.O1, this.O2], this.WS).reduce((resul, currentElement) => resul + currentElement));
    }

    //esta funcion recibe el resultado final de la neurona de la capa de salida normalizado entre 0 y 1
    calculateOutput(x){
        if (Math.abs(x - 0.5) <= 0.001)
            return 0;
        else if(x <= 0.5)
            return -1;
        else if(x > 0.5)
            return 1;
    }

    updateWeights(erro, alpha = 0.01) {
        let input, input1, input2; // variables locales

        for (let i = 0; i < this.WS.length; i++) {
            if (i == 0)
                input = this.O1; // primera neurona de la capa oculta
            else if (i == 1)
                input = this.O2; // segunda neurona de la capa oculta

            this.WS[i] = this.WS[i] + (alpha * input * erro); // actualizacion del peso
        }

        for (let i = 0; i < this.WO1E.length; i++) {
            if (i == 0)
                input1 = this.E1; // primera neurona de la capa de entrada
            else if (i == 1)
                input1 = this.E2; // segunda neurona de la capa de entrada

            this.WO1E[i] = this.WO1E[i] + (alpha * input1 * erro); // actualizacion del peso
        }

        for (let i = 0; i < this.WO2E.length; i++) {
            if (i == 0)
                input2 = this.E1; // primera neurona de la capa de entrada
            else if (i == 1)
                input2 = this.E2; // segunda neurona de la capa de entrada

            this.WO2E[i] = this.WO2E[i] + (alpha * input2 * erro); // actualizacion del peso
        }

        for (let i = 0; i < this.WXE1.length; i++) { // pesos de la primera neurona de entrada
            this.WXE1[i] = this.WXE1[i] + (alpha * this.X[i] * erro);
        }

        for (let i = 0; i < this.WXE2.length; i++) { // pesos de la segunda neurona de entrada
            this.WXE2[i] = this.WXE2[i] + (alpha * this.X[i] * erro);
        }
    }

    increaseCost()
    {
        this.cost *= 10;
    }
    

    saveWeightsToFile() {
        const weightsData = {
            WXE1: this.WXE1,
            WXE2: this.WXE2,
            WO1E: this.WO1E,
            WO2E: this.WO2E,
            WS: this.WS,
            cost: this.cost
        };
        const jsonData = JSON.stringify(weightsData);
        console.log(`${jsonData}`);
    }


    //////////////////////
    // NORMAL ALGORITHM //
    //////////////////////
    setPrevBall(ballX, ballY)
    {
        this.prevBallX = ballX;
        this.prevBallY = ballY;
    }

    ballImpactPoint(ballX, ballY, canvasHeight, canvasWidth) {

        if(this.prevBallX == null || this.prevBallY == null) {
            this.setPrevBall(ballX, ballY);
            return 0;
        }
        // Calcula la dirección de movimiento de la pelota
        var directionX = ballX - this.prevBallX;
        var directionY = ballY - this.prevBallY;
    
        if(directionX == 0 && directionY == 0)
        {
            this.setPrevBall(ballX, ballY);
            return 0;
        }
        
        // Calcula la posición futura de la pelota (suponiendo rebotes ilimitados)
        var posX = ballX;
        var posY = ballY;
        while (true) {
            // Simula el movimiento de la pelota
            posX += directionX;
            posY += directionY;
    
            // Si la pelota alcanza los límites superior o inferior del campo, cambia la dirección en Y
            if (posY <= 0 || posY >= canvasHeight)
                directionY = -directionY;
    
            if(posX <= 0 || posX >= canvasWidth)
            {
                this.setPrevBall(ballX, ballY);
                return posY;
            }
        }
    }
}
