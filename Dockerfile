FROM ubuntu:latest

# Update the image
RUN apt update
RUN apt upgrade -y
# Install prerequisite(s)
RUN apt install -y curl gnupg gnupg2 gnupg1 java-common software-properties-common wget

# Install Amazon Coretto JRE
# https://docs.aws.amazon.com/corretto/latest/corretto-11-ug/generic-linux-install.html
RUN curl -o- https://apt.corretto.aws/corretto.key | apt-key add - 
RUN add-apt-repository 'deb https://apt.corretto.aws stable main'
RUN apt update; apt install -y java-11-amazon-corretto-jdk

### Create a Minecraft user and group ###
RUN useradd --create-home --user-group --shell /bin/bash minecraft

### Do everything else from here on as the Minecraft user ###
USER minecraft
WORKDIR /home/minecraft

# Set up Node Version Manager
# https://github.com/nvm-sh/nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
RUN echo 'export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"' >> .bash_profile
RUN echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> .bash_profile
# Install NodeJS LTS
RUN . /home/minecraft/.bash_profile; nvm install --lts
RUN . /home/minecraft/.bash_profile; nvm use --lts

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
# docker build -t networkcobwebs/minecraft-server-manager:latest -t networkcobwebs/minecraft-server-manager:1.14.14 - < Dockerfile
# docker run --name minecraft-server -p 3000:3000 -p 25565:25565 minecraft-server-manager
# To use a volume that can be external to the container:
# docker volume create --name minecraft-server --label minecraft-server minecraft-server
# docker run -v minecraft-server:/home/minecraft/minecraft-server-manager -p 3000:3000 -p 25565:25565 minecraft-server-manager
