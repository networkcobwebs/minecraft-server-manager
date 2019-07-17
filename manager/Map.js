const fs = require('fs-extra');
const tar = require('tar');
const path = require('path');

const timestamp = require(path.resolve('Timestamp.js'));

/**
 * Information about the Minecraft world and its properties
 */
class Map {
  /**
   * Takes an existing saved instance of Map, or if none uses a default one
   * @type {Object}
   */
  constructor (object = Map.default) {
    this.static = object.static;
    this.name = object.name;
    this.server = object.server;
    this.properties = object.properties;
    this.modt = object.modt;
    this.config = object.config;
  }
  /**
   * Returns the data of this Map instance as an object
   * @return {Object}
   */
  export () {
    return {
      static: this.static,
      name: this.name,
      server: this.server,
      properties: this.properties,
      modt: this.modt,
      connfig: this.config
    };
  }
  /**
   * @return {String} The name of the world folder as it would be on disk
   */
  get foldername () {
    return `${this.name.replace(/[^\w]/g, '_')}`;
  }
  /**
   * Updates the world archive on disk with the latest files
   * @param  {String} serverPath Path to Minecraft Server executables folder
   * @return {Promise} Resolves to true or false depending on whether successful or not
   */
  async save (serverPath) {
    try {
      await tar.update({
        file: `${this.foldername}.tgz`,
        cwd: Map.paths.maps,
        gzip: { level: 9 }
      }, [path.join(serverPath, this.foldername)]);
      return true;
    } catch (error) {
      console.log(`Failed to save map to disk! \n${error}`);
      return false;
    }
  }
  /**
   * If the world exists, extracts it into the server folder
   * If not, creates an empty archive ready for the world folder
   * @param  {String} serverPath Path to Minecraft Server executables folder
   * @return {Promise} Resolves to true or false depending on whether successful or not
   */
  async load (serverPath) {
    try {
      if (!this.static) {
        await tar.create({
          gzip: { level: 9 },
          file: path.join(Map.paths.maps, `${this.foldername}.tgz`)
        }, []);
        this.static = true;
      } else {
        await tar.extract({
          cwd: serverPath,
          file: path.join(Map.paths.maps, `${this.foldername}.tgz`)
        });
      }
      return true;
    } catch (error) {
      console.log(`Failed to load map! \n${error}`);
      return false;
    }
  }
  /**
   * Saves and removes the map from the Minecraft Server executables folder
   * @param  {String} serverPath Path to Minecraft Server executables folder
   * @return {Promise} Resolves to true or false depending on whether successful or not
   */
  async unload (serverPath) {
    try {
      await this.save();
      await fs.remove(path.join(serverPath, this.foldername));
      return true;
    } catch (error) {
      console.log(`Failed to unload map! \n${error}`);
      return false;
    }
  }
  /**
   * Saves and creates a backup of the map
   * Has the timestamp, Map name and filename of created backup file
   * @param  {[type]} serverPath Path to Minecraft Server executables folder
   * @return {Promise} Resolves to an object, that holds information about the backup
   */
  async backup (serverPath) {
    try {
      const backup = {
        timestamp: timestamp.getDateTime(),
        map: this.name,
        file: `${this.foldername}.tgz`
      };
      await this.save();
      await fs.copy(
        path.join(Map.paths.maps, `${this.foldername}.tgz`),
        path.join(Map.paths.backups, `${backup.timestamp}_${backup.file}`)
      );
      return backup;
    } catch (error) {
      console.log(`Failed to backup map! \n${error}`);
      return false;
    }
  }
}
/**
 * Absolute paths to folders and files used to store Map and Minecraft world data
 * @type {Object}
 */
Map.paths = {
  maps: path.resolve('maps'),
  backups: path.resolve('backups'),
  get mapList () {
    return path.join(Map.paths.maps, 'maps.json');
  },
  get backupList () {
    return path.join(Map.paths.backups, 'backups.json');
  }
};
/**
 * Values for the default Map instance
 * @type {Object}
 */
Map.default = {
  /**
   * True if the world exists on disk
   * Used to check if the map name, server etc. can still be edited freely
   * @type {Boolean}
   */
  static: false,
  /**
   * The world name / id
   * @type {String}
   */
  name: 'world',
  /**
   * The name of the server to be used
   * @type {String}
   */
  server: 'default',
  /**
   * The name of the properties to be used
   * @type {String}
   */
  properties: 'default',
  /**
   * MOTD string(s) and icon(s) shown in Minecrafts multiplayer page
   * If multiple, one message / icon pair will be chosen randomly on map load
   * @type {Array}
   */
  modt: [
    {
      message: 'A Minecraft Server',
      /** Name of a '.png' file stored in '/icons' or false if none */
      icon: false
    }
  ],
  /**
   * Controls how map saves and backups are handled
   * @type {Object}
   */
  config: {
    /**
     * How often in minutes the world is backed up
     * If negative or zero automatic backups are turned off
     * @type {Number}
     */
    backupInterval: 0,
    /**
     * How many backups are kept before old ones are deleted
     * If negative or zero no all backups are saved
     * @type {Number}
     */
    backups: 3
  }
};

module.exports = Map;
