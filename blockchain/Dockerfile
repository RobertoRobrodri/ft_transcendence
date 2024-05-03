FROM node:20-slim

RUN npm install -g npm@latest
RUN npm install -g truffle
COPY . .
WORKDIR contract

# Launch truffle migrations with this script to prevent re compile smart contract
RUN chmod +x script.sh
CMD ./script.sh