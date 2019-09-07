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
  describe('instance', function () {
    before(async function () {
      this.id = '1.9-pre4';
      this.manifest = await Manifest.default;
    });
    it('should extend Map', function () {
      assert.ok(this.manifest instanceof Map);
    });
    it('should hold hold type, url and age of version', async function () {
      this.manifest.forEach(({ type, url, age }, id) => {
        assert.ok(Manifest.types.has(type));
        assert.equal(new URL(url).href, url);
        assert.ok(Number.isSafeInteger(age));
      });
    });
    describe('url', function () {
      it('should store a custom URL', function () {
        const url = new URL('https://not.quite.mojang/mc/game/manifest.json');
        this.manifest.url = url;
        assert.equal(this.manifest.url, url);
      });
      it('should not store the default URL', function () {
        this.manifest.url = Manifest.url;
        assert.equal(this.manifest.url, Manifest.url);
      });
    });
    describe('latest()', function () {
      it('should return latest id overall when invalid type', async function () {
        const reducer = (latest, id) => this.manifest.get(id).age > this.manifest.get(latest).age ? id : latest;
        assert.equal(this.manifest.latest(), [...this.manifest.keys()].reduce(reducer));
      });
      it('should return latest ids for all "Manifest.types"', async function () {
        const reducer = (latest, id) => this.manifest.get(id).age > this.manifest.get(latest).age ? id : latest;
        Manifest.types.forEach(type => {
          const filtered = [...this.manifest.keys()].filter(id => this.manifest.get(id).type === type);
          assert.equal(this.manifest.latest(type), filtered.reduce(reducer));
        });
      });
    });
    describe('update()', function () {
      it('should return latest snapshot when given a snapshot id', function () {
        assert.equal(this.manifest.update(this.id), this.manifest.latest('snapshot'));
      });
      it('should return latest release when given a release type', function () {
        assert.equal(this.manifest.update(`${this.id}@release`), this.manifest.latest('release'));
      });
      it('should return latest version when given an invalid id', function () {
        assert.equal(this.manifest.update('latest'), this.manifest.latest());
      });
    });
    describe('fetch()', function () {
      it('should return own instance', async function () {
        nock(Manifest.url.origin).get(Manifest.url.pathname).reply(200, this.mcm);
        // Kind of tests that returned data is still sane
        assert.deepEqual(this.manifest, await this.manifest.fetch());
      });
    });
  });
});
