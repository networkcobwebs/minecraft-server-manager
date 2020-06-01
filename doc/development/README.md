
# Development

These are the development practices for the project. These are simply guidelines and open to
suggestion.

## Requirements

You'll need a [GitHub](https://github.com) account and the tools to interact with it. To create
a new GitHub account, see https://git-scm.com/book/en/v2/GitHub-Account-Setup-and-Configuration.

To run the production Minecraft Server Manager, the latest NodeJS LTS version should be supported
and used for testing.

Any environment can use [NVM](https://github.com/nvm-sh/nvm "NVM"), and there is a `.nvmrc` file
that includes the version of NodeJS supported by Minecraft Server Manager.

## Debugging

If using Visual Studio Code, there are workspace-level Launch Configurations included that:

- Run the `index.js` script in a NodeJS debugger;
- Run the `react-scripts` debug web server;
- Run a standalone version of Google Chrome.

To debug things in either the `MinecraftApi.js`, `MinecraftServer.js`, or in the React web interface
using Visual Studio Code, the debug processes must be started in that order. Of course if using
a browser other than Google Chrome, use that instead.

Feel free to add other debug settings for other development environments, as long as they can be
committed without stomping on other users' global IDE configurations.

## Code Formatting

When possible use the built-in modules included in the `package.json` to ensure consistency with
things like tabs vs. spaces, indentation size, and general code hygiene. `eslint` is currently
installed to warn of bad formatting or other errors.

## Release Notes

A `release-notes.txt` file should be included and updated that details major UI or backend behavior
changes.

## Source Control

All pull requests should be completed on their own branches. This makes it easier to make changes
before merge, and prevents rebasing problems.

To get the code for development purposes, visit https://github.com/networkcobwebs/minecraft-server-manager
and click the `Fork` button at the top of the page.

Then in a Terminal or Command Prompt execute

```
    git clone <your fork url>
    pushd minecraft-server-manager
    git remote add upstream git@github.com:networkcobwebs/minecraft-server-manager.git
    npm install
    pushd src/web
    npm install
    popd && popd
```

Please make sure to `git pull upstream/master` before creating a pull request so as to have any merge
conflicts taken care of prior to initializing the PR.

In general

- do not commit binary executables without including the source;
- do not remove IDE-level files without group discussion;
- do not change the build process without group discussion.

## Directory Structure

```
├── README.md
├── api.properties                      # Configuration file for the web service.
├── doc                                 # Documentation
│   ├── development
│   │   └── README.md
│   └── screenshots
│       ├── dashboard.png
│       ├── players.png
│       ├── server.png
│       └── world.png
├── index.js
├── minecraft-server.log                # The output log for the MinecraftServer. gitignore'd.
├── minecraft_server                    # The installation path for the Minecraft server jar. gitignore'd.
│   ├── 1.11.2_minecraft_server.jar
│   ├── 1.14.4_minecraft_server.jar
│   ├── backups
│   │   └── worlds
│   │       └── ...
│   ├── banned-ips.json
│   ├── banned-players.json
│   ├── eula.txt
│   ├── logs
│   │   ├── 2019-08-12-7.log.gz
│   │   └── latest.log
│   ├── ops.json
│   ├── server.jar
│   ├── server.properties
│   ├── usercache.json
│   ├── whitelist.json
│   └── world
│       ├── ...
│       ├── data
│       │   └── ...
│       ├── level.dat
│       ├── level.dat_old
│       ├── playerdata
│       │   └── ...
│       ├── region
│       │   └── ...
│       ├── session.lock
│       └── stats
│           └── ...
├── node_modules                        # The NodeJS modules used. gitignore'd.
│   └── ...
├── package-lock.json
├── package.json
├── release-notes.txt
├── server.properties
├── src                                 # The executable NodeJS code.
│   ├── api                             # Code related to the web server.
│   │   └── MinecraftApi.js
│   ├── server                          # Code related to the Minecraft jar.
│   │   ├── Eula.js
│   │   └── MinecraftServer.js
│   ├── util                            # Shared code used in this project.
│   │   └── util.js
│   └── web                             # Code for the web interface.
│       ├── build                       # Production build of the web interface.
│       │   └── ...
│       ├── node_modules                # The NodeJS modules used by the web interface. gitignore'd.
│       │   └── ...
│       ├── package-lock.json
│       ├── package.json
│       ├── public                      # Static assets served by the web interface.
│       │   ├── favicon.ico
│       │   ├── index.html
│       │   └── manifest.json
│       └── src                         # The ReactJS web interface.
│           ├── About
│           ├── App.css
│           ├── App.js
│           ├── App.test.js
│           ├── Dashboard
│           ├── Players
│           ├── Preferences
│           ├── ServerControls
│           ├── index.css
│           ├── index.js
│           ├── logo.svg
│           └── registerServiceWorker.js
├── test                                # The tests for the project.
│   ├── api                             # Tests for the web server.
│   │   └── MinecraftApi.js
│   └── server                          # Tests for the Minecraft integration.
│       ├── MinecraftServer.js
│       └── eula.js
└── test-results                        # Test results from Mocha tests. gitignore'd.
    └── ...
```


## Testing

Testing should be performed using the latest version of NodeJS LTS.

Testing scope is mainly a responsibility of the developer. There is currently not much by way of
automated testing for the web interface. Add or modify tests for backend services in the `test`
directory. The current testing strategy uses Mocha.

When making changes to the web interface, typically the testing can be isolated to the page/view
affected, unless making changes to REST API polling functions or their results.

Depending on the impact of a change to the `MinecraftApi.js` or `MinecraftServer.js` file, the entire
web interface may be impacted.

## Logging Issues or Working on Issues

There are no doubt bugs waiting to be discovered, and features missing outright.
The
[minecraft-server-manager issues](https://github.com/networkcobwebs/minecraft-server-manager/issues)
page may or may not have up to date things to work on. Realize that
there is no schedule for this project, so any pull requests may take some time to be merged.
