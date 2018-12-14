const fs = require('fs-extra');
const archiver = require('archiver');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
const os = require('os');
const https = require('https');

let pathToMinecraftDirectory = 'minecraft_server',
    minecraftServerJar = 'minecraft_server.jar',
    minecraftServerProcess,
    minecraftServerLog = 'minecraft_server.log',
    minecraftStarting, minecraftStarted, minecraftStartedTimer, minecraftStartTime,
    minecraftStopping, minecraftStoppedTimer,
    minecraftOutput = [],
    minecraftServerOutputCaptured = false,
    minecraftCurrentVersion,
    minecraftCommands = [],
    minecraftHelpPages,
    minecraftFullHelp = [],
    minecraftEulaUrl = 'https://account.mojang.com/documents/minecraft_eula',
    minecraftAcceptedEula = false,
    javaHome, javaMaxMem, javaMinMem,
    players, ops, serverProperties,
    startTime = Date.now(),
    osType = os.type();

process.on('exit', function() {
    if (minecraftStarted) {
        stopMinecraft();
    }
});

function getMinecraftVersions() {
    // TODO enable snapshot updates with a property/preference
    let minecraftVersionsArray = [],
        minecraftVersions = {};

    https.get('https://launchermeta.mojang.com/mc/game/version_manifest.json', (res) => {
        res.on('data', (d) => {
            minecraftVersionsArray.push(d);
        });
        res.on('end', () => {
            try {
                minecraftVersions = JSON.parse(minecraftVersionsArray);
                console.log('Got Minecraft version list.');
                // TODO Actually do something here
                return minecraftVersions;
            } catch (e) {
                console.log('An error occurred processing the Minecraft official version list:', e);
            }
        });
      }).on('error', (e) => {
        console.error('An error occurred retrieving the Minecraft official version list:', e);
      });
}

function getCommand (line, required, optional) {
    let start = 0;
    let end = 0;
    let args = [];
    let startChar, endChar;

    if (required) {
        startChar = '<';
        endChar = '>'
    }
    if (optional) {
        startChar = '[';
        endChar = ']';
    }

    while (start !== -1) {
        start = line.indexOf(startChar, end);
        end = line.indexOf(endChar, start);
        
        if (start !== -1) {
            let option = line.substr(start + 1, end - start - 1);
            let options = option.concat(line.substr(end + 1, line.indexOf(' ', end + 1) - end - 1));
            if (options.indexOf('|') !== -1) {
                let args2 = options.split('|');
                while ( (arg = args2.shift()) !== undefined ) {
                    args.push(arg);
                }
            } else {
                args.push(options);
            }
            start = line.indexOf(startChar, end);
        }
    }

    return args
}

function waitForHelpOutput (buffer, callback) {
    while( (line = minecraftOutput.shift()) !== undefined ) {
        if (line.indexOf('Showing help page') !== -1) {
            minecraftServerProcess.stdout.removeListener('data', bufferMinecraftOutput);
            minecraftOutput.length = 0;

            let part1 = line.split('Showing help page ');
            let part2 = part1[1].split(' ');
            minecraftHelpPages = parseInt(part2[2]);

            minecraftServerProcess.stdout.addListener('data', bufferMinecraftOutput);
            for (let i = 1; i <= minecraftHelpPages; i++) {
                minecraftServerProcess.stdin.write('/help ' + i + '\n');
            }
            setTimeout(() => {
                minecraftServerProcess.stdout.removeListener('data', bufferMinecraftOutput);
                while ( (line = minecraftOutput.shift()) !== undefined ) {
                    let command = {};
                    let commandLine = line.split(' [Server thread/INFO]: ');

                    if (commandLine[1].indexOf('/') === 0) {
                        let aThing = {}
                        aThing.key = minecraftFullHelp.length;
                        aThing.command = commandLine[1];
                        minecraftFullHelp.push(aThing);
                        let commandLineSpaces = commandLine[1].split(' ');
                        let args = [];
                        let commands = [];
                        
                        command = {
                            command: commandLineSpaces[0].substr(commandLineSpaces[0].indexOf('/') + 1)
                        };

                        commandLineSpaces.shift();

                        if (commandLine[1].indexOf(' OR ') !== -1) {
                            commands = commandLine[1].split(' OR ');
                        } else {
                            commands.push(commandLine[1]);
                        }

                        args.length = 0;
                        for (let c of commands) {
                            let things = getCommand(c, true, false);
                            for (let thing of things) {
                                args.push(thing);
                            }
                        }
                        if (args.length) {
                            command['requiredArgs'] = Array.from(new Set(args));
                        }

                        args.length = 0;
                        for (let c of commands) {
                            let things = getCommand(c, false, true);
                            for (let thing of things) {
                                args.push(thing);
                            }
                        }
                        if (args.length) {
                            command['optionalArgs'] = Array.from(new Set(args));
                        }
    
                        minecraftCommands.push(command);
                    }
                }

                minecraftOutput.length = 0;
                minecraftServerOutputCaptured = false;
                if (typeof callback === 'function') {
                    callback();
                }
            }, 500);
        }
    }
}

if (osType.indexOf('Windows') !== -1) {
    // do Windows related things
    // set javaHome from Windows? LOTS OF POTENTIAL PLACES
} else if (osType.indexOf('Linux') !== -1) {
    // do Linux related things
    // set javaHome from profile? bash_profile? bash_rc? TOO MANY PLACES
} else if (osType.indexOf('Darwin') !== -1) {
    // do Mac related things
    // set javaHome from java_home
    exec('/usr/libexec/java_home', (err, stdout, stderr) => {
        if (err) {
            console.log('Could not set JAVA_HOME. Make sure Java is properly installed.');
            throw err;
        } else {
            // console.log('Using java from', stdout);
            javaHome = stdout;
            app.listen(ipPort);
            console.log('Web app running.');
            getMinecraftVersions();
            startMinecraft(() => {
                getEula();
                listMinecraftCommands(0);
            });
        }
    });
}
