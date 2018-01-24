
# minecraft-server-manager
A web management interface for Minecraft Server

Includes:
* a Node.js script to control your minecraft_server jar
* a set of web pages for management created using React

## Requirements
Node.js 8.x

## Installation
1. Execute

```
    git clone https://github.com/nickrnet/minecraft-server-manager.git
```

in a Terminal or Command Prompt.

2. Execute

```
    cd minecraft-server-manager
    npm install
```

3. Execute

```
    npm run build
```

to build the React web pages.

4. If desired, edit the IP address and port properties at the top of the minecraft_server.js
script. By default, the web server will run on all network interfaces on port 3001.

5. Download a release of Minecraft Server to `minecraft-server-manager` (or place
your Minecraft Server installation in `minecraft-server-manager` named `minecraft_server`.

6. Accept the terms of the Minecraft EULA by setting the eula property to `true` in the 
`eula.txt` file of `minecraft_server` if this is a new installation:

```
    eula=true
```

## Running Minecraft Server Manager
1. Execute

```
    npm start
```

2. Navigate to your web server's URL: http://localhost:3001
3. Play Minecraft on your server.

### Notes
The current supported version of Minecraft is **1.11.2**, but should also run with 1.12.2 as well.

Current testing has been with:
* Ubuntu 16.04
* CentOS 7
* OS X Sierra (10.12)
* Node.js 8.9.1

Make sure if your Minecraft Server is running as a normal user that the
same normal user executes the `minecraft_server.js` script
provided in order for the web interface to be able to read the ops,
properties, and most importantly, the jar to be able to manage chunks.
