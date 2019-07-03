
# Development

These are the development practices for the project. These are simply guidelines and open to
suggestion.

## Requirements

To run the production Minecraft Server Manager, the latest NodeJS LTS version should be supported
and used for testing.

Any environment can use ![NVM](https://github.com/nvm-sh/nvm "NVM"), and there is a `.nvmrc` file
that includes the version of NodeJS supported by Minecraft Server Manager.

## Debugging

If using Visual Studio Code, there are Launch Configurations included that:

- Run the `index.js` script in a NodeJS debugger;
- Run the `react-scripts` debug web server;
- Run a standalone version of Google Chrome.

To debug things in either the `minecraft-api.js`, `minecraft-server.js`, or in the React web app,
processes must be started in that order. Of course if using a browser other than Google Chrome,
use that instead.

## Code Formatting

When possible use the built-in modules included in the `package.json` to ensure consistency with
things like tabs vs. spaces, indentation size, and general code hygiene.

## Release Notes

A `release-notes.txt` file should be included that details major UI or backend behavior changes.

## Source Control

All pull requests should be completed on their own branches. This makes it easier to make changes
before merge, and prevents rebasing problems.

To get the code for development purposes, visit https://github.com/nickrnet/minecraft-server-manager
and click the `Fork` button at the top of the page.

Then in a Terminal or Command Prompt execute
```
    git clone <your fork url>
    pushd minecraft-server-manager
    git remote add upstream git@github.com:nickrnet/minecraft-server-manager.git
    npm install
    pushd minecraftservermanager
    npm install
    popd && popd
```

Please make sure to `git pull upstream/master` before PRs so as to have any merge conflicts taken care of
prior to initializing the PR.

In general

- do not commit binary executables without including the source;
- do not remove IDE-level files without group discussion;
- do not change the build process without group discussion.

### Testing

Testing should be completed against the latest version of NodeJS LTS.

Testing scope is mainly a responsibility of the developer. There is currently not much by way of
automated testing.

When making changes to the web app, typically the testing can be isolated to the page/view affected,
unless making changes to REST API polling functions or their results.

Depending on the impact of a change to the `minecraft-api.js` or `minecraft-server.js` file, the entire
web app may be impacted.

## Logging Issues or Working on Issues

There are no doubt bugs waiting to be discovered, and features missing outright.
The
[minecraft-server-manager issues](https://github.com/nickrnet/minecraft-server-manager/issues)
page may or may not have up to date things to work on. Realize that
there is no schedule for this project, so any PRs may take some time to be dealt with.
