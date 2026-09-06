import { BloomEffect, ShaderPass } from "postprocessing";
import {
  HalfFloatType,
  NoBlending,
  ShaderMaterial,
  Uniform,
  Vector2,
  WebGLRenderTarget,
} from "three";
import type { Texture, WebGLRenderer } from "three";
import { BLOOM_BLUR_FRAGMENT, BLOOM_PREFILTER_FRAGMENT } from "./shaders";

/** Bright-pixel extraction and two-pass reconstruction around the library's mipmap bloom. */
export class AstraBloomEffect extends BloomEffect {
  private readonly sourceTexelSize = new Uniform(new Vector2());
  private readonly blurSource = new Uniform<Texture | null>(null);
  private readonly blurStep = new Uniform(new Vector2());
  private readonly horizontalTarget = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthBuffer: false,
  });
  private readonly verticalTarget = this.horizontalTarget.clone();
  private readonly reconstruction = new ShaderPass(
    new ShaderMaterial({
      uniforms: { source: this.blurSource, stepSize: this.blurStep },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = position.xy * 0.5 + 0.5;
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `,
      fragmentShader: BLOOM_BLUR_FRAGMENT,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
  );

  constructor(options: ConstructorParameters<typeof BloomEffect>[0]) {
    super(options);
    this.luminanceMaterial.uniforms.sourceTexelSize = this.sourceTexelSize;
    this.luminanceMaterial.fragmentShader = BLOOM_PREFILTER_FRAGMENT;
    this.luminanceMaterial.needsUpdate = true;
    this.uniforms.set("map", new Uniform(this.verticalTarget.texture));
  }

  override setSize(width: number, height: number): void {
    super.setSize(width, height);
    const halfWidth = Math.max(1, Math.round(0.5 * width));
    const halfHeight = Math.max(1, Math.round(0.5 * height));
    // BloomEffect can call this virtual method before subclass fields initialize.
    this.horizontalTarget?.setSize(halfWidth, halfHeight);
    this.verticalTarget?.setSize(halfWidth, halfHeight);
  }

  override update(renderer: WebGLRenderer, inputBuffer: WebGLRenderTarget, delta?: number): void {
    this.sourceTexelSize.value.set(1 / inputBuffer.width, 1 / inputBuffer.height);
    super.update(renderer, inputBuffer, delta);
    this.blurSource.value = super.texture;
    this.blurStep.value.set(1 / this.horizontalTarget.width, 0);
    this.reconstruction.render(renderer, null, this.horizontalTarget);
    this.blurSource.value = this.horizontalTarget.texture;
    this.blurStep.value.set(0, 1 / this.verticalTarget.height);
    this.reconstruction.render(renderer, null, this.verticalTarget);
  }
}
