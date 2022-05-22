FROM networkcobwebs/minecraft-server-manager:base

### Do everything in this image as the Minecraft user created by minecraft-server-manager:base ###

#Minecraft 1.18 needs java17 to run
USER root
RUN apt-get update -y && apt-get install openjdk-17-jdk -y
RUN update-alternatives --set java /usr/lib/jvm/java-17-openjdk-amd64/bin/java

USER minecraft
WORKDIR /home/minecraft

# Install Minecraft Server Manager from NPM
RUN . /home/minecraft/.bash_profile; npm install @networkcobwebs/minecraft-server-manager
RUN echo 'export PATH=/home/minecraft/node_modules/.bin:$PATH' >> .bash_profile

# It is better to specify `-p` when running `docker run` than to use `EXPOSE` commands
# Allow web traffic and Minecraft traffic
# EXPOSE 3001
# EXPOSE 25565

# Run Minecraft Server Manager
ENTRYPOINT . /home/minecraft/.bash_profile; minecraft-server-manager

# docker build --label minecraft-server-manager - < Dockerfile
# docker build -t networkcobwebs/minecraft-server-manager:latest -t networkcobwebs/minecraft-server-manager:1.15.2 - < Dockerfile
# docker push networkcobwebs/minecraft-server-manager:latest
# docker push networkcobwebs/minecraft-server-manager:1.15.2
# docker run --name minecraft-server -p 3001:3001 -p 25565:25565 minecraft-server-manager
# To use a volume that can be external to the container:
# docker volume create --name minecraft-server --label minecraft-server minecraft-server
# docker run -v minecraft-server:/home/minecraft/minecraft-server-manager -p 3001:3001 -p 25565:25565 minecraft-server-manager
