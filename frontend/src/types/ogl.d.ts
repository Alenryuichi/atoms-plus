// Type declarations for OGL (Minimal WebGL Library)
declare module "ogl" {
  export class Renderer {
    constructor(options?: {
      canvas?: HTMLCanvasElement;
      width?: number;
      height?: number;
      dpr?: number;
      alpha?: boolean;
      depth?: boolean;
      stencil?: boolean;
      antialias?: boolean;
      premultipliedAlpha?: boolean;
      preserveDrawingBuffer?: boolean;
      powerPreference?: string;
      autoClear?: boolean;
      webgl?: number;
    });
    gl: WebGLRenderingContext;
    setSize(width: number, height: number): void;
    render(options: { scene: Mesh; camera?: Camera }): void;
  }

  export class Program {
    constructor(
      gl: WebGLRenderingContext,
      options: {
        vertex: string;
        fragment: string;
        uniforms?: Record<string, { value: unknown }>;
        transparent?: boolean;
        cullFace?: number | null;
        frontFace?: number;
        depthTest?: boolean;
        depthWrite?: boolean;
        depthFunc?: number;
      },
    );
    uniforms: Record<string, { value: unknown }>;
  }

  export class Mesh {
    constructor(
      gl: WebGLRenderingContext,
      options: {
        geometry: Geometry | Triangle;
        program: Program;
        mode?: number;
      },
    );
  }

  export class Geometry {
    constructor(
      gl: WebGLRenderingContext,
      attributes?: Record<string, { size: number; data: Float32Array }>,
    );
  }

  export class Triangle extends Geometry {
    constructor(gl: WebGLRenderingContext);
  }

  export class Vec2 {
    x: number;

    y: number;
    constructor(x?: number, y?: number);
    set(x: number, y: number): this;
  }

  export class Vec3 {
    x: number;

    y: number;

    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
  }

  export class Camera {
    constructor(
      gl: WebGLRenderingContext,
      options?: {
        fov?: number;
        near?: number;
        far?: number;
        aspect?: number;
      },
    );
    position: Vec3;
    lookAt(target: Vec3): void;
    perspective(options?: { aspect?: number }): void;
  }
}
