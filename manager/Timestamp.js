module.exports = {
  /**
   * A wrapper for 'padStart()'
   * @param  {string} string String to pad
   * @return {string}
   */
  zp: (string) => string.padStart(2, '0'),
  /**
   * Create a Time only timestamp string with the format:
   * [Hour]:[Minutes]:[Seconds]
   * @param  {Date} date The time to be used
   * @return {string}
   */
  getTime: function (date = new Date()) {
    return `${this.zp(date.getHours())}:${this.zp(date.getMinutes() + 1)}:${this.zp(date.getSeconds())}`;
  },
  /**
   * Create a complete Date / Time timestamp string with the format:
   * [Year]-[Month]-[Date]_[Hour]:[Minutes]:[Seconds]
   * @param  {Date} date The date and time to be used
   * @return {string}
   */
  getDateTime: function getDateTime (date = new Date()) {
    return `${date.getFullYear()}-${this.zp(date.getMonth() + 1)}-${this.zp(date.getDate())}_${this.getTime(date)}`;
  }
};
