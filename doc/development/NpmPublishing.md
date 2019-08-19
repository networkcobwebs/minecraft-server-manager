# Publishing to NPM

Create an account on the NPM registry and request access to the NetworkCobwebs org:
https://docs.npmjs.com/getting-started/

Make a branch to work on your feature, do the development there. When finished, submit
a PR.

Once it is merged, a GitHub and npm maintainer with proper permissions should run

```
npm version [patch | major | minor]
npm publish
git push
```

on the remote `master` branch.

The `npm version` command is documented at https://docs.npmjs.com/updating-your-published-package-version-number.

The `npm publish` step requires two-factor auth for the moment as there is no continuous
integration.

The `git push` step could be automated with a `scripts.postversion` property in the `package.json`. We probably
want to investigate git tags at that time as well.
