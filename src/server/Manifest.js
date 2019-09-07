const https = require('https');
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
}
// Default manifest URL string, so as not to store copies in every instance
Manifest.url = new URL('https://launchermeta.mojang.com/mc/game/version_manifest.json');
// The default Set of version type strings to include when parsing the manifest
// NOTE: Should be per instance customizable, but not sure how to implement that
Manifest.types = new Set(['release', 'snapshot']);

module.exports = Manifest;
