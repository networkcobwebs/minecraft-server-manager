# Development
1. Start by configuring your Node.js things in
```
minecraft-server-manager/backend/node/minecraft_server.js
```
see the Readme.md there

2. Install Sencha Cmd
3. Start app watch
```
cd minecraft-server-manager/MinecraftServerManager
sencha app watch
```
and develop away! Changes made to source will be immediately (well...
in a few seconds) visible/testable.

# Builds
```
cd minecraft-server-manager/MinecraftServerManager
```
then
```
sencha app build -c --testing
```
**or**
```
sencha app build -c --production
```
then
```
cd minecraft-server-manager/build/**testing or production**
mkdir -p minecraft-server-manager.vVERSION/backend/node
cp -r MinecraftServerManager minecraft-server-manager.vVERSION/.
cp ../../../backend/node/minecraft_server.js minecraft-server-manager.vVERSION/backend/node/.
zip -r minecraft-server-manager.vVERSION.zip minecraft-server-manager.vVERSION
```
Create a new release in GitHub and upload the zip
