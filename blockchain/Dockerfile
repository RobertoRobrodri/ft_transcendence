FROM node:20-slim

RUN npm install -g truffle
COPY . .
WORKDIR contract

# Launch truffle migrations with this script to prevent re compile smart contract
CMD ./script.sh