
/**
* @template T
* @param {T | undefined | null} value
* @returns {value is T}
*/
function isDefined(value) {
  return value !== undefined && value !== null;
}

/**
 * 
 * @param {GPUShaderModule} module 
 * @returns {Promise<void>}
 */
async function check_compilation_errors (module) {
  const info = await module.getCompilationInfo();
  if (info.messages.length > 0) {
    for (const msg of info.messages) {
      console.error(`${module.label} ${msg.message}@${msg.lineNum}`)
    }
    Panic.About(`Shader compilation failed`);
  }
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
  static Assert(condition, msg) {
    if (!condition) {
      Panic.About(msg);
    }
  }

  /**
   * @param {string} msg
   * @return {never}
   */
  static About(msg) {
    throw new Panic(msg);
  }
}