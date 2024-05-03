FROM node:20-slim
#if you want to deploy on mac m1 m2 maybe you need to uncomment this line
#RUN apt-get update && apt-get install -y python3 python3-pip build-essential
RUN npm install -g npm@latest
RUN npm install -g truffle
COPY . .
WORKDIR contract

# Launch truffle migrations with this script to prevent re compile smart contract
RUN chmod +x script.sh
CMD ./script.sh
