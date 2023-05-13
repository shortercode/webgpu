const SHADER_CODE = `
struct VertexData {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

@vertex fn vs(
  @builtin(vertex_index) vertexIndex : u32
) -> VertexData {
  var pos = array<vec2f, 3>(
    vec2f(-0.5, -0.5), // bottom left
    vec2f(0.5, -0.5),  // bottom right
    vec2f(0, 0.5),   // top center
  );

  var vsOutput: VertexData;
  vsOutput.position = vec4f(pos[vertexIndex], 0, 1);
  vsOutput.color = vec4f(0.5 + pos[vertexIndex].x, 0, 0.5 + pos[vertexIndex].y, 1);
  return vsOutput;
}

@fragment fn fs(fsInput: VertexData) -> @location(0) vec4f {
  return fsInput.color;
}`;

function main() {
  const { canvas } = setup_canvas();

  /**
   * @type Context
   */
  let gpu_context;
  /**
   * @type GPURenderPipeline
   */
  let pipeline;

  setup_context(canvas, async (ctx) => {
    // create shader module
    const module = ctx.device.createShaderModule({
      label: 'our hardcoded purple triangle shaders',
      code: SHADER_CODE,
    });

    await check_compilation_errors(module);
    // create pipeline
    pipeline = ctx.device.createRenderPipeline({
      label: 'our hardcoded red triangle pipeline',
      layout: 'auto',
      vertex: {
        module,
        entryPoint: 'vs',
      },
      fragment: {
        module,
        entryPoint: 'fs',
        targets: [{ format: ctx.format }],
      },
    });
    gpu_context = ctx;
  });

  on_frame(() => {
    if (!gpu_context) {
      return;
    }
    const { device, context } = gpu_context;
    const encoder = device.createCommandEncoder({ label: 'our encoder' });
    const view = context.getCurrentTexture().createView();
    const pass = encoder.beginRenderPass({
      label: 'our basic canvas renderPass',
      colorAttachments: [
        {
          view,
          clearValue: [0.7, 0.7, 0.7, 1],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    pass.setPipeline(pipeline);
    pass.draw(3);  // call our vertex shader 3 times.
    pass.end();

    const command_buffer = encoder.finish();
    gpu_context.device.queue.submit([command_buffer]);
  });
}

main();