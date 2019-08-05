const { describe, it, beforeEach, before, after } = require('mocha');
const assert = require('assert').strict;
const path = require('path');
const Eula = require(path.resolve('minecraft', 'Eula'));

const testUrl = 'http://foo.bar/eula/file';
const testFile = 'aule.txt';

describe('EULA', function () {
  // Testing internal properties (customUrl, customFile) is discouraged,
  // but necessary for full coverage
  describe('properties', function () {
    beforeEach(function () {
      this.eula = new Eula();
    });
    describe('url', function () {
      it('should be defined', function () {
        assert.equal(this.eula.url, Eula.url);
      });
      it('should store a custom URL', function () {
        this.eula.url = testUrl;
        assert.equal(this.eula.url, testUrl);
      });
      it('should not store an identical URL', function () {
        this.eula.url = Eula.url;
        assert.ok(!this.eula.customUrl);
      });
    });
    describe('file', function () {
      it('should be defined', function () {
        assert.equal(this.eula.file, Eula.file);
      });
      it('should store a custom filename', function () {
        this.eula.file = testFile;
        assert.equal(this.eula.file, testFile);
      });
      it('should not store an identical filename', function () {
        this.eula.file = Eula.file;
        assert.ok(!this.eula.customFile);
      });
    });
  });
});
