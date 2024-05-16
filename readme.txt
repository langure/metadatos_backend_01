change node version:
nvm use 18

running mongo on local docker:
docker pull mongo:latest
docker run --name mongodb-container --network=host -d mongo
docker ps
docker inspect mongodb-container | grep "IPAddress"

URL:
mongodb://<mongodb-container-ip-address>:27017/mydatabase

for example
mongodb://72.17.0.2:27017/metadatos

or locally
brew tap mongodb/brew
brew install mongodb-community