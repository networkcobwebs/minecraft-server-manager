/**
 * Map, that can fetch, parse, download and update Minecraft Server versions
 * @extends Map
 */
class Manifest extends Map {
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
}
// Default manifest URL string, so as not to store copies in every instance
Manifest.url = new URL('https://launchermeta.mojang.com/mc/game/version_manifest.json');

module.exports = Manifest;
