export class PongAI {
    constructor(train = true) {
		
		this.numberOfInputs = 7;
								// 2, 5, 1
        this.neuronsPerLayer = [3, 3, 2, 1]; // Cada elemento indica la cantidad de neuronas de la capa (4 capas en este caso)
        this.weights = [];
        this.neurons = [];

        // Generar pesos para las conexiones entre capas
        for (let i = 0; i < this.neuronsPerLayer.length; i++) {
            const currentLayerSize = this.neuronsPerLayer[i];
            const previousLayerSize = i === 0 ? this.numberOfInputs : this.neuronsPerLayer[i - 1];

            // Generar pesos para cada neurona en la capa actual
            for (let j = 0; j < currentLayerSize; j++) {
                const neuronWeights = Array.from({ length: previousLayerSize }, () => this.random());
                this.weights.push(neuronWeights);
            }
        }

        // Inicializar los valores de las neuronas
        for (let i = 0; i < this.neuronsPerLayer.length - 1; i++) {
            const currentLayerSize = this.neuronsPerLayer[i];
            this.neurons.push(Array(currentLayerSize).fill(0));
        }
        
        this.S = 0; // valor de salida
        this.B = 1; // valor de la constante bias (sesgo)
        this.X = []; // datos para 'alimentacion' de la red neuronal
        this.cost = 0; // valor de la tasa de coste
        this.resul;

        // Variables del algoritmo normal
        this.prevBallX = null;
        this.prevBallY = null;
        this.train = train;

        if (!this.train)
            this.loadTrainedWeights();
    }
    
    loadTrainedWeights() {

        this.weights = [
			[-0.6473951754361702,-4.629659076094637,-0.6163376810647907,-4.658606726103024,-28.81915508849465,34.132273913929716,5.387194980102622],
			[-0.42684192953270106,-4.67389574260295,-1.120957809275921,-4.929946402961457,-28.58217031521181,34.03059220632195,5.386581133189583],
			[101.366185611093,96.92820095584906],
			[100.78691476078386,96.63512017923341],
			[100.95362933299752,96.80203737705095],
			[101.61126526496773,96.60219341918831],
			[101.4332728092831,97.140850274679],
			[102.83673243137912,102.66757578615244,102.6084112146527,102.7317177415675,102.75254380873551]
		];
		this.cost = -0.006730010101077255;
    }
    
    process(ballX, ballY, paddleY, paddleSize, canvasHeight, canvasWidth, border_thickness, ball_radius) {
        let ret = 0;
        if (this.prevBallX == null && this.prevBallY == null)
        {
            this.prevBallX = ballX;
            this.prevBallY = ballY;
            return 0;
        }
        // Obtener velocidad de la pelota normalizada
        let speedX = ballX - this.prevBallX;
        let speedY = ballY - this.prevBallY;
        let ballSpeed = Math.sqrt(speedX * speedX + speedY * speedY);
        if(this.fillData(ballX, ballY, ballSpeed, paddleY, paddleSize, canvasHeight, canvasWidth, border_thickness, ball_radius))
            this.feedfoward();
            ret = this.calculateOutput(this.S);
            if (this.train)
                this.updateWeights(this.cost);
        return ret;
    }

    fillData(ballX, ballY, ballSpeed, paddleY, paddleSize, canvasHeight, canvasWidth, border_thickness, ball_radius){
        let impact = this.ballImpactPoint(ballX, ballY, canvasHeight, canvasWidth, border_thickness, ball_radius);
        if (impact == NaN)
            return false;
        this.X = [
            ballX / canvasWidth,                                // Posición X actual de la pelota
            ballY / canvasHeight,                               // Posición Y actual de la pelota
            this.prevBallX / canvasWidth,                       // Posición X anterior de la pelota
            this.prevBallY / canvasHeight,                      // Posición Y anterior de la pelota
            (paddleY + paddleSize / 2) / canvasHeight,          // Posición Y de la raqueta
            
            // Ejemplo, usar el punto de impacto para entrenar el modelo y que tome las decisiones
            impact / canvasHeight,
            // En su defecto se puede omitir este dato por ser demasiado relevante, y damos otro con menor importancia como la velocidad de la pelota
            //ballSpeed / canvasWidth,
            this.B                              // Sesgo
        ];
        // Calcula el error: centro de la bola - centro de la raqueta
        //this.cost = ((ballY) - (paddleY + paddleSize / 2)) / canvasHeight;
        this.cost = (impact - (paddleY + paddleSize / 2)) / canvasHeight;
        return 1;
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
        // Activacion de las capas ocultas
		let currentWeight = 0;
		for (let i = 0; i < this.neurons[0].length; i++) {
			this.neurons[0][i] = this.hyperbolicTangent(this.vectorProduct(this.X, this.weights[currentWeight++]).reduce((acc, curr) => acc + curr));
		}
		// Activacion de las capas ocultas
		for (let l = 1; l < this.neurons.length; l++) {
			for (let i = 0; i < this.neurons[l].length; i++) {
				this.neurons[l][i] = this.hyperbolicTangent(this.vectorProduct(this.neurons[l - 1], this.weights[currentWeight++]).reduce((acc, curr) => acc + curr));
			}
		}
		// Calcular la salida final
		this.S = this.sigmoid(this.vectorProduct(this.neurons[this.neurons.length - 1], this.weights[this.weights.length - 1]).reduce((resul, currentElement) => resul + currentElement));
	}

    //esta funcion recibe el resultado final de la neurona de la capa de salida normalizado entre 0 y 1
    calculateOutput(x){
        if (Math.abs(x - 0.5) <= 0.01)
            return 0;
        else if(x <= 0.5)
            return -1;
        else if(x > 0.5)
            return 1;
    }

    updateWeights(erro, alpha = 0.2) {
		
		let neuronsIndex = this.neurons.length - 1;
		let weightsIndex = this.weights.length - 1;
		for (let layers = this.neuronsPerLayer.length - 1; layers >= 1; layers--) {
			let count = this.neuronsPerLayer[layers];

			for (let layer = 0; layer < count; layer++) {
				for (let i = 0; i < this.weights[weightsIndex].length; i++) {
					this.weights[weightsIndex][i] += (alpha * this.neurons[neuronsIndex][i] * erro);
				}
				weightsIndex--;
			}
			neuronsIndex--;
		}
		
		for (let layers = 0; layers < this.neuronsPerLayer[0]; layers++) {
			for(let i = 0; i < this.weights[layers].length; i++)
			{
				this.weights[layers][i] += (alpha * this.X[i] * erro);
			}
		}
    }

    increaseCost()
    {
        this.cost *= 10;
    }
    

    printWeights() {

        const weightsData = {
            w: this.weights,
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

    ballImpactPoint(ballX, ballY, canvasHeight, canvasWidth, border_thickness, ball_radius) {

        if(this.prevBallX == null || this.prevBallY == null) {
            this.setPrevBall(ballX, ballY);
            return 0;
        }
        //si la posicion anterior es la misma que la actual, omitimos
        if(ballX == this.prevBallX && ballY == this.prevBallY)
            return 0;
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

        let top_side = 0 + border_thickness + ball_radius
        let bottom_side = canvasHeight - border_thickness - ball_radius
        while (true) {
            // Simula el movimiento de la pelota
            posX += directionX;
            posY += directionY;
    
            // Si la pelota alcanza los límites superior o inferior del campo, cambia la dirección en Y
            if ((posY <= top_side && directionY < 0) || (posY >= bottom_side && directionY > 0))
                directionY *= -1;
    
            if(posX <= 12 || posX >= canvasWidth - 12)
            {
                this.setPrevBall(ballX, ballY);
                return posY;
            }
        }
    }
}
