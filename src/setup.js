/**
 * @typedef {{
*  canvas: HTMLCanvasElement;
*  device: GPUDevice;
*  context: GPUCanvasContext;
*  adapter: GPUAdapter;
*  format: GPUTextureFormat;
* }} Context
*/

/**
* @returns {{ canvas: HTMLCanvasElement }}
*/
function setup_canvas() {
  const canvas = document.querySelector('canvas');

  Panic.Assert(isDefined(canvas), 'Unable to locate canvas element');

  const observer = new ResizeObserver(([change]) => {
    const contentBoxSize = change?.contentBoxSize[0]
    if (!contentBoxSize) {
      return;
    }
    const {
      inlineSize: width,
      blockSize: height
    } = contentBoxSize;

    canvas.width = width;
    canvas.height = height;
  });

  observer.observe(canvas);

  return { canvas };
}

/**
* @param {HTMLCanvasElement} canvas
* @param {(ctx: Context) => void} context_callback
*/
function setup_context(canvas, context_callback) {
  const initialise = async () => {
    Panic.Assert(isDefined(navigator.gpu), 'this browser does not support WebGPU');

    const adapter = await navigator.gpu.requestAdapter();
    Panic.Assert(isDefined(adapter), 'this browser supports webgpu but it appears disabled');

    const device = await adapter.requestDevice();
    device.lost.then((info) => {
      console.error(`WebGPU device was lost: ${info.message}`);

      // 'reason' will be 'destroyed' if we intentionally destroy the device.
      if (info.reason !== 'destroyed') {
        // try again
        initialise();
      }
    });

    const context = canvas.getContext('webgpu');
    Panic.Assert(isDefined(context), 'this browser supports webgpu but it appears disabled');

    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
      device,
      format,
    });

    const ctx = {
      device,
      canvas,
      format,
      adapter,
      context,
    };

    try {
      context_callback(ctx)
    } catch (err) {
      
    }
  };

  void initialise();
}

/**
 * 
 * @param {(delta: number) => void} cb 
 */
function on_frame(cb) {
  /**
   * @type number
   */
  let previous;

  /**
   * 
   * @param {number} now 
   */
  const call = now => {
    requestAnimationFrame(call);
    const delta = now - previous;
    previous = now;
    cb(delta);
  }

  requestAnimationFrame(timestamp => {
    previous = timestamp;
    requestAnimationFrame(call);
  });
}