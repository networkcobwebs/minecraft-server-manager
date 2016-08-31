# Development Installation
## Ubuntu
1. Get Node.js
```
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs apache2
```

2. Install Node.js modules
```
cd minecraft-server-manager/backend/node
npm install
```

3. Edit your minecraft_server.js script accordingly, then
```
node minecraft_server.js
```
**Be careful how changes to the minecraft_server.js script are committed
back -- make sure paths aren't all silly with usernames and such in them**

4. Then things are as simple as
```
cd minecraft-server-manager/MinecraftServerManager
sencha app watch
```
and develop away!
