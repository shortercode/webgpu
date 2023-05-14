const SHADER_CODE = `
struct Intermediate {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
};

struct Vertex {
  @location(0) position: vec2f,
};

struct Entity {
  scale: vec2f,
  position: vec2f,
}

@group(0) @binding(0) var<uniform> entity: Entity;

@vertex fn vs(
  vert: Vertex,
) -> Intermediate {
  var pos = entity.scale * vert.position + entity.position;

  var vsOutput: Intermediate;
  vsOutput.position = vec4f(pos, 0, 1);
  vsOutput.color = vec4f(0.5 + pos.x, 0, 0.5 + pos.y, 1);
  return vsOutput;
}

@fragment fn fs(fsInput: Intermediate) -> @location(0) vec4f {
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

  /**
   * @type GPUBuffer
   */
  let vertex_buffer;

  /**
   * @type GPUBindGroup
   */
  let bind_group;

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
        buffers: [
          {
            arrayStride: 2 * 4, // 2 floats, 4 bytes each
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x2' },  // position
            ],
          },
        ],
      },
      fragment: {
        module,
        entryPoint: 'fs',
        targets: [{ format: ctx.format }],
      },
    });

    const vertex_data = generate_circle_vertices(0, 0, 0.5, 24);

    vertex_buffer = ctx.device.createBuffer({
      label: 'vertex buffer vertices',
      size: vertex_data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    ctx.device.queue.writeBuffer(vertex_buffer, 0, vertex_data);

    const uniform_buffer = ctx.device.createBuffer({
      size: 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // create a typedarray to hold the values for the uniforms in JavaScript
    const uniform_values = new Float32Array([
      1.6, 1,
      0.2, 0.2,
    ]);

    bind_group = ctx.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniform_buffer }},
      ],
    });

    ctx.device.queue.writeBuffer(uniform_buffer, 0, uniform_values);

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
    pass.setVertexBuffer(0, vertex_buffer);
    pass.setBindGroup(0, bind_group);

    pass.draw(vertex_buffer.size / ( 2 * 4 ));
    pass.end();

    const command_buffer = encoder.finish();
    gpu_context.device.queue.submit([command_buffer]);
  });
}

/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {number} radius 
 * @param {number} segments 
 * @returns {Float32Array}
 */
function generate_circle_vertices(x, y, radius, segments) {
  const output = new Float32Array(segments * 3 * 2);
  const slice = (2 * Math.PI) / segments;

  let t = 0;

  for (let i = 0; i < segments; i += 1) {
    let offset = i * 3 * 2;

    output[offset] = x;
    output[offset + 1] = y;

    output[offset + 2] = x + radius * Math.cos(t);
    output[offset + 3] = y + radius * Math.sin(t);

    t += slice;

    output[offset + 4] = x + radius * Math.cos(t);
    output[offset + 5] = y + radius * Math.sin(t);
  }

  return output;
}

main();