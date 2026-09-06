/** Original Astra GPU programs, retained verbatim; see THIRD_PARTY_NOTICES.md. */
import { PARTICLE_MOTION_COAST_GLSL, PARTICLE_MOTION_SETTLE_SECONDS } from "../motion";

export const BLOOM_PREFILTER_FRAGMENT = `
  #include <common>
  uniform sampler2D inputBuffer;
  uniform vec2 sourceTexelSize;
  uniform float threshold;
  uniform float smoothing;
  varying vec2 vUv;
  void main() {
    vec2 offset = sourceTexelSize * 0.5;
    vec4 color = (
      texture2D(inputBuffer, vUv + vec2(-offset.x, -offset.y)) +
      texture2D(inputBuffer, vUv + vec2( offset.x, -offset.y)) +
      texture2D(inputBuffer, vUv + vec2(-offset.x,  offset.y)) +
      texture2D(inputBuffer, vUv + vec2( offset.x,  offset.y))
    ) * 0.25;
    gl_FragColor = color * smoothstep(threshold, threshold + smoothing, luminance(color.rgb));
  }
`;

export const BLOOM_BLUR_FRAGMENT = `
  uniform sampler2D source;
  uniform vec2 stepSize;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(source, vUv) * 0.2270270270;
    color += (texture2D(source, vUv + stepSize * 1.3846153846)
      + texture2D(source, vUv - stepSize * 1.3846153846)) * 0.3162162162;
    color += (texture2D(source, vUv + stepSize * 3.2307692308)
      + texture2D(source, vUv - stepSize * 3.2307692308)) * 0.0702702703;
    gl_FragColor = color;
  }
`;

export const LENS_FLARE_VERTEX = `
  uniform sampler2D uParticleMotionTexture;
  uniform float uParticleMotionAge;
  uniform vec3 uPrimaryMotionUv;
  uniform vec3 uSecondaryMotionUvs[5];
  varying vec2 vPrimaryMotion;
  varying vec2 vSecondaryMotion[5];
  ${PARTICLE_MOTION_COAST_GLSL}
  vec2 particleOffset(vec3 particleUv) {
    if (particleUv.x < 0.0 || uParticleMotionAge >= ${PARTICLE_MOTION_SETTLE_SECONDS}.0) return vec2(0.0);
    return astraCoast(texture2D(uParticleMotionTexture, particleUv.xy), particleUv.z, uParticleMotionAge).xy * 0.5;
  }
  void mainSupport() {
    vPrimaryMotion = particleOffset(uPrimaryMotionUv);
    for (int i = 0; i < 5; i++) vSecondaryMotion[i] = particleOffset(uSecondaryMotionUvs[i]);
  }
`;

export const LENS_FLARE_FRAGMENT = `
  uniform sampler2D uDirtTexture;
  varying vec2 vPrimaryMotion;
  varying vec2 vSecondaryMotion[5];
  uniform vec2 uCenter;
  uniform float uAnimated;
  uniform float uAspect;
  uniform float uDirtyGlassEnabled;
  uniform float uDistortion;
  uniform float uDirtTextureAspect;
  uniform vec2 uDirtTextureOffset;
  uniform float uDirtTextureRotation;
  uniform float uFlareEnabled;
  uniform float uGhosts;
  uniform float uGrain;
  uniform float uHalo;
  uniform float uIntensity;
  uniform float uProceduralDirt;
  uniform vec2 uSecondaryCenters[5];
  uniform float uSecondaryIntensity;
  uniform float uSecondaryVisibility[5];
  uniform float uStreakLength;
  uniform float uStreaks;
  uniform float uTime;
  uniform float uTextureDirt;
  uniform float uVerticalStreaks;
  uniform float uVisibility;

  float astraHash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float softDisc(vec2 point, float radius, float softness) {
    return 1.0 - smoothstep(radius - softness, radius + softness, length(point));
  }

  float softRing(vec2 point, float radius, float width) {
    float distanceToRing = abs(length(point) - radius);
    return 1.0 - smoothstep(width, width * 2.0, distanceToRing);
  }

  vec2 aspectCorrect(vec2 point) {
    point.x *= uAspect;
    return point;
  }

  vec2 coverTextureUv(vec2 uv, float viewportAspect, float textureAspect) {
    vec2 centeredUv = uv - 0.5;

    if (viewportAspect > textureAspect) {
      centeredUv.y *= textureAspect / viewportAspect;
    } else {
      centeredUv.x *= viewportAspect / textureAspect;
    }

    return centeredUv + 0.5;
  }

  float secondaryFlare(vec2 center, vec2 uv) {
    vec2 point = aspectCorrect(uv - center);
    float distanceToSource = length(point);
    // The matched particle and bloom already provide the sharp stellar core.
    // Optics should add only a soft halo and restrained glass streaks so a
    // tiny tracking difference can never read as a second, detached star.
    float nearHalo = exp(-distanceToSource * distanceToSource * 520.0) * 0.1;
    float halo = exp(-distanceToSource * 17.0) * 0.055;
    float horizontalWindow = 1.0 - smoothstep(
      uStreakLength * 0.72,
      uStreakLength,
      abs(point.x)
    );
    float verticalWindow = 1.0 - smoothstep(
      uStreakLength * 0.72,
      uStreakLength,
      abs(point.y)
    );
    horizontalWindow = mix(horizontalWindow, 1.0, step(0.99, uStreakLength));
    verticalWindow = mix(verticalWindow, 1.0, step(0.99, uStreakLength));
    float horizontalStreak = exp(-abs(point.y) * 360.0)
      * exp(-abs(point.x) * 10.0) * horizontalWindow * 0.24;
    float verticalStreak = exp(-abs(point.x) * 360.0)
      * exp(-abs(point.y) * 10.0) * verticalWindow * 0.24 * uVerticalStreaks;

    return nearHalo + halo + horizontalStreak + verticalStreak;
  }

  void mainImage(
    const in vec4 inputColor,
    const in vec2 uv,
    out vec4 outputColor
  ) {
    vec3 base = inputColor.rgb;
    vec2 movingCenter = uCenter + vPrimaryMotion;
    vec2 source = aspectCorrect(uv - movingCenter);
    float sourceDistance = length(source);

    float core = exp(-sourceDistance * sourceDistance * 480.0) * 0.18;
    float halo = exp(-sourceDistance * 11.5) * uHalo;
    halo += softRing(source, 0.105, 0.006) * 0.05 * uHalo;

    float horizontalWindow = 1.0 - smoothstep(
      uStreakLength * 0.72,
      uStreakLength,
      abs(source.x)
    );
    float verticalWindow = 1.0 - smoothstep(
      uStreakLength * 0.72,
      uStreakLength,
      abs(source.y)
    );
    horizontalWindow = mix(horizontalWindow, 1.0, step(0.99, uStreakLength));
    verticalWindow = mix(verticalWindow, 1.0, step(0.99, uStreakLength));
    float horizontalStreak = exp(-abs(source.y) * 310.0)
      * exp(-abs(source.x) * 7.5) * horizontalWindow;
    float softHorizontalStreak = exp(-abs(source.y) * 78.0)
      * exp(-abs(source.x) * 5.2) * horizontalWindow * 0.16;
    float verticalStreak = exp(-abs(source.x) * 310.0)
      * exp(-abs(source.y) * 7.5) * verticalWindow;
    float softVerticalStreak = exp(-abs(source.x) * 78.0)
      * exp(-abs(source.y) * 5.2) * verticalWindow * 0.16;
    float streak = (
      horizontalStreak +
      softHorizontalStreak +
      (verticalStreak + softVerticalStreak) * uVerticalStreaks
    ) * uStreaks;

    vec2 opticalAxis = vec2(0.5) - movingCenter;
    vec2 ghostA = aspectCorrect(uv - (movingCenter + opticalAxis * 0.82));
    vec2 ghostB = aspectCorrect(uv - (movingCenter + opticalAxis * 1.38));
    vec2 ghostC = aspectCorrect(uv - (movingCenter + opticalAxis * 1.82));
    float ghosts = 0.0;
    ghosts += softDisc(ghostA, 0.016, 0.014) * 0.18;
    ghosts += softRing(ghostB, 0.046, 0.006) * 0.11;
    ghosts += softDisc(ghostC, 0.025, 0.02) * 0.08;
    ghosts *= uGhosts;

    // Source motion owns the animation. An independent optical pulse made the
    // flare breathe against its matched particle and exposed tiny offsets.
    float flare = (core + halo + streak + ghosts) * uIntensity;
    float secondary = 0.0;
    float secondaryDirtHalo = 0.0;
    for (int i = 0; i < ASTRA_SECONDARY_SOURCES; i++) {
      vec2 secondaryCenter = uSecondaryCenters[i] + vSecondaryMotion[i];
      secondary += secondaryFlare(secondaryCenter, uv)
        * uSecondaryVisibility[i];
      secondaryDirtHalo += exp(
        -length(aspectCorrect(uv - secondaryCenter)) * 10.0
      ) * uSecondaryVisibility[i];
    }
    secondary *= uIntensity * uSecondaryIntensity;
    vec3 flareColor = vec3(0.956, 0.956, 0.956)
      * (flare * uVisibility + secondary) * uFlareEnabled;

    vec3 opticalColor = base + flareColor;
    float baseLuminance = dot(base, vec3(0.2126, 0.7152, 0.0722));
    float reveal = smoothstep(0.025, 0.72, baseLuminance);
    vec2 driftingDirtUv = uv - 0.5;
    float dirtRotationCos = cos(uDirtTextureRotation);
    float dirtRotationSin = sin(uDirtTextureRotation);
    driftingDirtUv = mat2(
      dirtRotationCos,
      -dirtRotationSin,
      dirtRotationSin,
      dirtRotationCos
    ) * driftingDirtUv;
    driftingDirtUv += uDirtTextureOffset;
    vec2 dirtTextureUv = clamp(coverTextureUv(
      driftingDirtUv + 0.5,
      uAspect,
      uDirtTextureAspect
    ), vec2(0.001), vec2(0.999));
    vec3 dirtTextureColor = texture2D(uDirtTexture, dirtTextureUv).rgb;
    float dirtTextureLuminance = dot(
      dirtTextureColor,
      vec3(0.2126, 0.7152, 0.0722)
    );
    float photographicDirt = smoothstep(0.1, 0.72, dirtTextureLuminance);
    // The generated map already contains broad clouds, wipe marks, and fine
    // grit. A softer transfer of the same field replaces two four-octave FBM
    // evaluations that previously repeated that work for every screen pixel.
    float proceduralDirt = smoothstep(0.025, 0.32, dirtTextureLuminance);
    float textureDirtAmount = uTextureDirt * uDirtyGlassEnabled;
    float proceduralDirtAmount = uProceduralDirt * uDirtyGlassEnabled;
    float dirtMask = clamp(
      photographicDirt * textureDirtAmount +
      proceduralDirt * proceduralDirtAmount,
      0.0,
      1.0
    );
    float dirtVariation = clamp(
      (photographicDirt - 0.4) * textureDirtAmount +
      (proceduralDirt - 0.4) * proceduralDirtAmount,
      -0.7,
      0.9
    );
    // Dirt responds to the rendered scene, not to the flare it is currently
    // generating. This removes the feedback-like pop at transition peaks.
    float dirtReveal = smoothstep(0.008, 0.2, baseLuminance)
      * (1.0 - smoothstep(0.9, 3.0, baseLuminance) * 0.68);
    float primaryDirtHalo = exp(-sourceDistance * 6.5) * uVisibility;
    float dirtHalo = (
      primaryDirtHalo + secondaryDirtHalo * uSecondaryIntensity
    ) * uIntensity * uFlareEnabled;

    #if ASTRA_DISTORTION == 1
    vec2 warpUvX = dirtTextureUv * vec2(0.72, 0.78) + vec2(0.17, 0.08);
    vec2 warpUvY = vec2(1.0 - dirtTextureUv.y, dirtTextureUv.x)
      * vec2(0.74, 0.7) + vec2(0.12, 0.16);
    float warpSampleX = texture2D(
      uDirtTexture,
      warpUvX
    ).r;
    float warpSampleY = texture2D(
      uDirtTexture,
      warpUvY
    ).r;
    vec2 warpField = clamp(
      (vec2(warpSampleX, warpSampleY) - dirtTextureLuminance) * 6.0,
      vec2(-0.5),
      vec2(0.5)
    );
    vec2 warp = warpField
      * vec2(1.0 / max(uAspect, 0.001), 1.0)
      * uDistortion * 0.004;
    vec3 warpedBase = texture2D(
      inputBuffer,
      clamp(uv + warp, vec2(0.001), vec2(0.999))
    ).rgb;
    opticalColor += (warpedBase - base)
      * reveal * uDirtyGlassEnabled * 0.55;
    #endif
    opticalColor *= 1.0 + dirtVariation
      * dirtReveal * 0.82;
    opticalColor += vec3(max(dirtVariation, 0.0))
      * dirtReveal
      * (0.022 + min(baseLuminance, 0.8) * 0.055);
    opticalColor += vec3(0.956)
      * dirtHalo
      * dirtMask * 0.14;

    float grain = astraHash(floor(uv * vec2(1536.0, 1024.0)));
    opticalColor += vec3((grain - 0.5) * uGrain)
      * (0.18 + reveal * 0.82) * uDirtyGlassEnabled;

    outputColor = vec4(max(opticalColor, vec3(0.0)), inputColor.a);
  }
`;
