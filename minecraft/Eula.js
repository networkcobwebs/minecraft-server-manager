/**
 * Used to accept and read data from the Minecraft End User License Agreement file
 */
class Eula {
  /*
  Allow defining EULA URLs or filenames that differ from the default ones
  Setting falsey values (no URL is found in file, invalid path, etc.) results
  in the default value being returned, which is usually desired behaviour
  */
  /**
   * @return {String}
   */
  get url () {
    return this.customUrl ? this.customUrl : Eula.url;
  }
  /**
   * @return {String}
   */
  get file () {
    return this.customFile ? this.customFile : Eula.file;
  }
  /**
   * Non-string values result in undefined behaviour
   * @param  {String} url
   */
  set url (url) {
    this.customUrl = url !== this.url ? url : this.customUrl;
  }
  /**
   * Non-string values result in undefined behaviour
   * @param  {String} file
   */
  set file (file) {
    this.customFile = file !== this.file ? file : this.customFile;
  }
}
// Default URL and filename strings, so as not to store copies in every instance
Eula.url = 'https://account.mojang.com/documents/minecraft_eula';
Eula.file = 'eula.txt';

module.exports = Eula;
