
# minecraft-server-manager
Minecraft Server Manager

A web management UI for Minecraft Server

## Requirements
Node.js 4.x
Web server of your choice

## Notes
The web UI assumes the Node.js script that controls the Minecraft server Java process is listening on localhost:3000 for now.

## Running Minecraft Server Manager
1. npm install
2. Edit the backend/node/minecraft_server.js script and:
    * Set the path to the directory containing the Minecraft server jar in pathToMinecraftDirectory
    * Set the name of the minecraft_server-x.jar in the startMinecraft function
3. Execute the Node.js script in backend/node/minecraft_server.js
4. Place the web app in your web server
5. Navigate to your web server's URL
