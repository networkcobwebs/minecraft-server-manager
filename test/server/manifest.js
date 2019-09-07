const { describe, it, before, after } = require('mocha');
const assert = require('assert').strict;
const mock = require('mock-fs');
const https = require('https');
const nock = require('nock');
const path = require('path');

const Manifest = require(path.resolve('src', 'server', 'Manifest.js'));

describe('Manifest', function () {
  before(async function () {
    // NOTE: This is a bit reundant
    nock.restore();
    // The official Minecraft version manifest
    this.mcm = await new Promise((resolve, reject) => {
      https.get(Manifest.url, (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => { resolve(JSON.parse(data)); });
      }).on('error', reject);
    });
    nock.disableNetConnect();
    nock.activate();
  });
  describe('static', function () {
    describe('url', function () {
      it('should be an instance of URL', function () {
        assert.ok(Manifest.url instanceof URL);
      });
    });
    describe('types', function () {
      it('should be an instance of Set', function () {
        assert.ok(Manifest.types instanceof Set);
      });
    });
    describe('default', function () {
      it('should resolve to an instance of Manifest', async function () {
        nock(Manifest.url.origin).get(Manifest.url.pathname).reply(200, this.mcm);
        const instance = Manifest.default;
        assert.ok(instance instanceof Promise);
        assert.ok(await instance instanceof Manifest);
      });
      it('should be cached after first look up', async function () {
        assert.ok(!Object.getOwnPropertyDescriptor(Manifest, 'default').get);
        assert.ok(await Manifest.default instanceof Manifest);
      });
    });
  });
});
