
/**
* @template T
* @param {T | undefined | null} value
* @returns {value is T}
*/
function isDefined (value) {
  return value !== undefined && value !== null;
 }
 
 class Panic extends Error {
  /**
   * @param {string} msg
   */
  constructor(msg) {
    super(msg);
  }
 
  /**
   * @param {boolean} condition
   * @param {string} msg
   * @return {asserts condition}
   */
  static Assert (condition, msg) {
    if (!condition) {
      Panic.About(msg);
    }
  }

  /**
   * @param {string} msg
   * @return {never}
   */
  static About (msg) {
    throw new Panic(msg);
  }
 }