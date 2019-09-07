const https = require('https');
const fs = require('fs-extra');
const crypto = require('crypto');
/**
 * Map, that can fetch, parse, download and update Minecraft Server versions
 * @extends Map
 */
class Manifest extends Map {
  /**
   * Lazy getter for a cached instance with prefetched versions from default URL
   * @return {Promise}
   */
  static get default () {
    delete Manifest.default;
    Manifest.default = (new Manifest()).fetch();
    return Manifest.default;
  }

  /**
   * @param  {URL} url
   */
  set url (url) {
    this.customUrl = url.href === Manifest.url.href ? undefined : url;
  }

  /**
   * @return {URL}
   */
  get url () {
    return this.customUrl || Manifest.url;
  }

  /**
   * @param  {String} type Type of id which to search for
   * @return {String} Latest version id found of given type or overall
   */
  latest (type) {
    // We assume that versions are in chronological order with latest first
    return type && Manifest.types.has(type)
      ? [...this.keys()].find(id => this.get(id).type === type)
      : this.keys().next().value;
  }

  /**
   * See "downlod()" for version syntax
   * @param  {String} version Version which to update
   * @return {Promise} Resolves to latest version id of given / evaluated type
   */
  update (version) {
    const [id, type] = version.split('@');
    return this.latest(type || (this.get(id) || { type: false }).type);
  }

  /**
   * Fetches the Minecraft version manifest from "this.url" and parses it
   * @return {Promise} Resolves to 'this' or rejects with an Error object
   */
  fetch () {
    return new Promise((resolve, reject) => {
      https.get(this.url, (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => {
          JSON.parse(data).versions.forEach(({ id, type, url, releaseTime }) => {
            if (Manifest.types.has(type)) {
              this.set(id, { type, url, age: Date.parse(releaseTime) });
            }
          });
          resolve(this);
        });
      }).on('error', reject);
    });
  }

  /**
   * Downloads the requested version of Minecraft Server into the the given path
   * Given version is split in two at "@", resulting in the version id and type
   * One of these is required, but not both, with the id taking precedence
   * @param  {String} version Version which to download or latest if invalid
   * @param  {String} path An absolute file path where to write the downloaded file
   * @return {Promise} Resolves to downloads version id or rejects with an Error object
   */
  download (version, path) {
    return new Promise((resolve, reject) => {
      const [id, type] = version.split('@');
      const url = (this.get(id) || this.get(this.latest(type))).url;
      https.get(new URL(url), (response) => {
        let data = '';
        response.on('data', chunk => { data += chunk; });
        response.on('end', () => { resolve(data); });
      }).on('error', reject);
    }).then(data => new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(path);
      const hash = crypto.createHash('sha1');
      const executable = JSON.parse(data);
      https.get(new URL(executable.downloads.server.url), (response) => {
        response.pipe(fileStream).pipe(hash);
        response.on('data', chunk => { hash.update(chunk); });
        response.on('end', () => {
          if (executable.downloads.server.sha1 !== hash.digest('hex')) {
            reject(new Error('File hash mismatch!'));
          }
        });
        fileStream.on('finish', () => { resolve(executable.id); });
      }).on('error', reject);
    }));
  }
}
// Default manifest URL string, so as not to store copies in every instance
Manifest.url = new URL('https://launchermeta.mojang.com/mc/game/version_manifest.json');
// The default Set of version type strings to include when parsing the manifest
// NOTE: Should be per instance customizable, but not sure how to implement that
Manifest.types = new Set(['release', 'snapshot']);

module.exports = Manifest;
