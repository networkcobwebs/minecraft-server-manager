
# minecraft-server-manager
Minecraft Server Manager

A web management interface for Minecraft Server

Includes:
* a Node.js script to control your minecraft_server jar
* a set of web pages for management created using ExtJS from Sencha

## Requirements
Node.js 4.x
Web server of your choice

To prevent cross-site scripting, it is required to run the web server on
the same machine as the Minecraft Server at this time. 

## Installation
1. Download the release for your version of Minecraft Server you are
running.
2. Place the ```backend/node/minecraft_server.js``` script where it can be run
by the user that owns the Minecraft Server jar.
3. Place the MinecraftServerManager web application in your web server

## Running Minecraft Server Manager
1. Edit the ```backend/node/minecraft_server.js``` script and:
    * Set the path to the directory containing the Minecraft Server jar
    in ```pathToMinecraftDirectory```
    * Set the name of the Minecraft Server jar in ```minecraftServerJar```
2. In the ```backend/node``` directory
    * ```npm install```
3. Execute the ```minecraft_server.js``` Node.js script in ```backend/node```
4. Place the web app in your web server
5. Navigate to your web server's URL: ```http://localhost/MinecraftServerManager```

### Notes
The current supported version of Minecraft is **1.10.2**.

Current testing has been with:
* Ubuntu 14.04 (EOL'ed, btw) and Ubuntu 16.04.1
* Apache2 installed from their repository
* Node.js 4.5.0

Make sure if your Minecraft Server is running as a normal user that the
same normal user executes the Node.js ```minecraft_server.js``` script
provided in order for the web interface to be able to read the ops,
properties, and most importantly, the jar to be able to manage chunks.

The web interface assumes the Node.js script that controls the Minecraft
server Java process is listening on localhost:3000 for now.

