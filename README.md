
# minecraft-server-manager

A web management interface for Minecraft Server

Includes:

* a Node.js script to control your Minecraft server instance
* a set of web pages for management created using React

## Requirements

Node.js 8.x or greater LTS release.

## Installation

1. In a Terminal or Command Prompt, execute
```
    git clone https://github.com/nickrnet/minecraft-server-manager.git
    pushd minecraft-server-manager && npm install
    pushd minecraftservermanager && npm install
    popd && npm run build && popd
```

2. If desired, edit the IP address and port properties at the top of the
`minecraft-api.js`
script. By default, the web server will run on `localhost` on port 3001.

## Running Minecraft Server Manager

1. Execute

```
    pushd minecraft-server-manager && node .
```

2. Navigate to your web server's URL: http://localhost:3001
3. Start Minecraft and/or accept the Minecraft end user license agreement if
needed.
4. Play Minecraft on your server.
5. Manage things on the Minecraft server via the web interface.

### Notes

Current OS testing has been with:

* Ubuntu 16.04, 18.04
* CentOS 7
* OS X Sierra (10.12) and higher
* Node.js 8.11.3 and Node.js 10.15.0

That is not to say that it will not run on Windows, it should, but it just has
not been tested.

Make sure if your Minecraft Server is running as a normal user that the
same normal user executes the Node `index.js` script provided in order for the
web interface to be able to read the ops, properties, and most importantly,
the jar to be able to manage chunks.
