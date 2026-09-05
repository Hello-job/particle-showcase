// Extracted from the public OpenAI Astra source, 1rfzm7jt1igp4.js.
// Shader, geometry and motion math are preserved; see README.md for provenance.
export default (t) => {
    "use strict";
    var e = t.i(695418),
      a = t.i(63295),
      r = t.i(396522),
      o = t.i(384051),
      i = t.i(642671),
      s = t.i(83007),
      n = t.i(471772);
    let l = `
  varying float vParticleDiameter;
  float astraCubicCoverage(float coordinate) {
    float x = abs(coordinate);
    if (x < 1.0) return (4.0 - 6.0 * x * x + 3.0 * x * x * x) / 6.0;
    float tail = max(2.0 - x, 0.0);
    return tail * tail * tail / 6.0;
  }
  float astraFilteredCore(vec2 pixel, float area) {
    return astraCubicCoverage(pixel.x) * astraCubicCoverage(pixel.y)
      * area * vParticleDiameter * vParticleDiameter;
  }
`,
      u = `
  vec2 astraDispersedMotion(
    float time,
    float scatterX,
    float scatterY,
    float scatterZ,
    float scrollDrift,
    float strength
  ) {
    float depth = clamp(scatterZ, 0.0, 1.0);
    float motion = clamp(strength, 0.0, 1.0);
    float speed = mix(
      ${n.ASTRA_AMBIENT_SPEED_MIN},
      ${n.ASTRA_AMBIENT_SPEED_MAX},
      depth
    );
    float amount = mix(
      ${n.ASTRA_AMBIENT_DRIFT_MIN},
      ${n.ASTRA_AMBIENT_DRIFT_MAX},
      depth
    ) * motion;
    float phaseX = scatterX * 6.28318530718 + scatterY * 2.7;
    float phaseY = scatterY * 6.28318530718 + scatterZ * 3.1;
    float parallax = scrollDrift * mix(
      ${n.ASTRA_PARALLAX_MIN},
      ${n.ASTRA_PARALLAX_MAX},
      depth * depth
    ) * motion;

    return vec2(
      (sin(phaseX + time * speed) - sin(phaseX)) * amount,
      (cos(phaseY + time * speed * 0.73) - cos(phaseY)) * amount
        + parallax
    );
  }
`,
      c = `
  attribute vec3 particleMotionUv;
  uniform sampler2D uParticleMotionTexture;
  uniform float uParticleMotionEnabled;
  uniform float uParticleMotionAge;
  uniform vec2 uParticleMotionPointer;
  uniform vec2 uParticleMotionPrevious;
  uniform vec2 uParticleMotionImpulse;
  varying vec4 vParticleMotionState;

  ${o.PARTICLE_MOTION_COAST_GLSL}
  void astraParticleMotion(inout vec4 clipPosition) {
    if (uParticleMotionEnabled < 0.5 || uParticleMotionAge >= ${o.PARTICLE_MOTION_SETTLE_SECONDS}.0) return;
    float mass = particleMotionUv.z;
    vec4 state = astraCoast(texture2D(uParticleMotionTexture, particleMotionUv.xy), mass, uParticleMotionAge);
    #ifdef ASTRA_PARTICLE_SIMULATION
      float aspect = max(uViewportAspect, 0.0001);
      vec2 scale = vec2(aspect, 1.0);
      vec2 current = (clipPosition.xy / clipPosition.w + state.xy) * scale;
      vec2 start = uParticleMotionPrevious * scale;
      vec2 segment = (uParticleMotionPointer - uParticleMotionPrevious) * scale;
      float t = clamp(dot(current - start, segment) / max(dot(segment, segment), 0.000001), 0.0, 1.0);
      float radius = max(uPointerRepelRadius * 0.5, 0.025);
      float weight = pow(1.0 - smoothstep(0.0, radius, length(current - start - segment * t)), 2.0);
      vec2 impulse = uParticleMotionImpulse * scale;
      impulse *= min(1.0, 0.18 / max(length(impulse), 0.00001));
      // Individual momentum, with no positional spring pulling toward a cursor.
      state.zw += impulse / scale * weight * 5.4 / mass;
      float speed = length(state.zw * scale);
      state.zw *= min(1.0, 0.5 / max(speed, 0.00001));
      vParticleMotionState = state;
      gl_PointSize = 1.0;
      clipPosition = vec4(particleMotionUv.xy * 2.0 - 1.0, 0.0, 1.0);
    #else
      clipPosition.xy += state.xy * clipPosition.w;
    #endif
  }

`,
      h = `
  float astraParticleRevealProgress(float progress, float seed) {
    float delay = seed * 0.015;
    return smoothstep(delay, 0.14 + delay, progress)
      * mix(0.2, 1.0, smoothstep(0.2, 1.0, progress));
  }
`,
      p = `
  attribute float driftPhase;
  attribute vec3 driftTangent;
  attribute float orbitProgress;
  attribute float particleOpacity;
  attribute float particleScale;

  uniform float uDirection;
  uniform float uDispersedMotion;
  uniform float uDriftDistance;
  uniform float uDriftSpeed;
  uniform float uAccretionRatio;
  uniform float uAmbientPulse;
  uniform float uCoreIntensity;
  uniform float uExhaleStrength;
  uniform float uFormationEnabled;
  uniform float uFormationProgress;
  uniform float uGrowthEnabled;
  uniform float uGrowthProgress;
  uniform float uGrowthRadius;
  uniform float uGrowthSoftness;
  uniform float uHeadProgress;
  uniform float uInwardStrength;
  uniform float uIntensity;
  uniform float uIntroProgress;
  uniform float uLightReach;
  uniform float uPixelRatio;
  uniform float uStarBrightness;
  uniform float uStarVisibility;
  uniform float uTrailEnabled;
  uniform float uTrailLength;
  uniform float uTime;
  uniform float uPropagationSoftness;
  uniform float uSettleRatio;
  uniform float uLensActive;
  uniform float uLensDepth;
  uniform float uLensIllumination;
  uniform float uLensMagnification;
  uniform vec2 uLensPointer;
  uniform float uLensRadius;
  uniform float uPointerRepelRadius;
  uniform vec2 uScatterSize;
  uniform float uScrollDrift;
  uniform float uScrollScatter;
  uniform float uScrollPositionProgress;
  uniform float uViewportAspect;

  varying float vBrightness;
  varying float vLens;
  varying float vOpacity;
  varying float vParticleDiameter;

  ${c}
  ${h}
  ${u}
  ${s.ASTRA_INTRO_MOTION_GLSL}

  void main() {
    float distanceToStar = abs(orbitProgress - uHeadProgress);
    float illumination = 1.0 - smoothstep(
      uLightReach * 0.08,
      uLightReach,
      distanceToStar
    );
    illumination *= illumination * uStarVisibility;

    float distanceBehind = uDirection > 0.0
      ? uHeadProgress - orbitProgress
      : orbitProgress - uHeadProgress;
    if (distanceBehind < 0.0) {
      distanceBehind += 1.0;
    }

    float trailIllumination = 1.0 - smoothstep(
      0.0,
      max(uTrailLength, 0.0001),
      distanceBehind
    );
    trailIllumination *= trailIllumination
      * uTrailEnabled
      * uStarVisibility;
    illumination = max(illumination, trailIllumination * 0.68);

    vBrightness = uIntensity * (
      0.16 + illumination * uStarBrightness * 3.6
    );
    vOpacity = particleOpacity * (0.22 + illumination * 0.78);
    float driftActive = step(0.0001, uDriftSpeed);
    float driftCycle = fract(driftPhase + uTime * uDriftSpeed);
    float driftFade = smoothstep(0.0, 0.1, driftCycle)
      * (1.0 - smoothstep(0.9, 1.0, driftCycle));
    vOpacity *= mix(1.0, driftFade, driftActive);
    vec3 basePosition = position + driftTangent
      * (driftCycle - 0.5)
      * uDriftDistance
      * uDirection
      * driftActive;
    float radialDistance = length(basePosition.xy);
    float localProgress = clamp(
      uFormationProgress
        - radialDistance * uPropagationSoftness * 0.018,
      0.0,
      1.0
    );
    float accretionEnd = clamp(uAccretionRatio, 0.12, 0.72);
    float settleStart = max(accretionEnd + 0.08, 1.0 - uSettleRatio);
    float inward = smoothstep(0.0, accretionEnd, localProgress);
    float exhale = smoothstep(accretionEnd, settleStart, localProgress);
    vec2 radialDirection = basePosition.xy / max(radialDistance, 0.0001);
    vec3 farPosition = basePosition;
    farPosition.xy += radialDirection * uInwardStrength * (2.0 + radialDistance * 0.28);
    farPosition.z += uInwardStrength * 0.8;
    vec3 condensedPosition = vec3(
      basePosition.xy * 0.045,
      basePosition.z * 0.12
    );
    vec3 formedPosition = mix(farPosition, condensedPosition, inward);
    formedPosition = mix(formedPosition, basePosition, exhale);
    formedPosition.xy += radialDirection
      * sin(exhale * 3.14159265359)
      * (1.0 - exhale)
      * uExhaleStrength;
    float formationVisibility = mix(0.08, 0.56, inward);
    formationVisibility = mix(formationVisibility, 1.0, exhale);
    float coreBurst = exp(-pow((localProgress - accretionEnd) * 11.0, 2.0));
    vBrightness *= mix(
      1.0,
      uAmbientPulse + coreBurst * (uCoreIntensity - 1.0),
      uFormationEnabled
    );
    vOpacity *= mix(1.0, formationVisibility, uFormationEnabled);
    vec3 animatedPosition = mix(basePosition, formedPosition, uFormationEnabled);
    float scatterX = fract(sin(
      dot(vec2(orbitProgress, driftPhase), vec2(127.1, 311.7))
    ) * 43758.5453);
    float scatterY = fract(sin(
      dot(vec2(driftPhase, particleScale), vec2(269.5, 183.3))
    ) * 43758.5453);
    float scatterZ = fract(sin(
      dot(vec2(orbitProgress, particleOpacity), vec2(419.2, 371.9))
    ) * 43758.5453);
    vec3 scatteredPosition = vec3(
      (scatterX - 0.5) * uScatterSize.x,
      (scatterY - 0.5) * uScatterSize.y,
      (scatterZ - 0.5) * 0.5
    );
    vec3 introScattered = vec3(
      scatteredPosition.x,
      (fract(scatterY) - 0.5) * uScatterSize.y,
      scatteredPosition.z
    );
    vec2 dispersedOffset = astraDispersedMotion(
      uTime,
      scatterX,
      scatterY,
      scatterZ,
      uScrollDrift,
      uDispersedMotion
    );
    scatteredPosition.x += dispersedOffset.x;
    scatteredPosition.y = mod(
      scatteredPosition.y + dispersedOffset.y + uScatterSize.y * 0.5,
      uScatterSize.y
    ) - uScatterSize.y * 0.5;
    scatteredPosition.y -= sin(uScrollPositionProgress * 3.14159265359)
      * (0.7 + scatterZ * 1.4);
    animatedPosition = mix(
      animatedPosition,
      scatteredPosition,
      uScrollPositionProgress
    );
    animatedPosition = astraIntroMotion(
      animatedPosition, introScattered, uIntroProgress,
      scatterZ, scatterY
    );
    float growthVisibility = (
      1.0 - smoothstep(
        uGrowthProgress,
        uGrowthProgress + max(uGrowthSoftness, 0.001),
        radialDistance / max(uGrowthRadius, 0.001)
      )
    ) * smoothstep(0.0, 0.025, uGrowthProgress);
    vOpacity *= mix(1.0, growthVisibility, uGrowthEnabled);
    // Reveal the dispersed field before pulling its stars into place.
    float introLocalProgress = astraParticleRevealProgress(
      uIntroProgress,
      scatterZ
    );
    float introParticleScale = sqrt(introLocalProgress);
    vOpacity *= smoothstep(
      0.0,
      ${i.ASTRA_PARTICLE_OPACITY_REVEAL_END},
      introLocalProgress
    );
    gl_PointSize = uPixelRatio * (
      1.0 + particleScale * 1.35 + illumination * 1.25
    ) * mix(1.0, 1.0 + coreBurst * 0.35, uFormationEnabled)
      * mix(1.0, 0.3 + growthVisibility * 0.7, uGrowthEnabled)
      * introParticleScale;

    vec4 viewPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
    vec4 clipPosition = projectionMatrix * viewPosition;
    vec2 ndc = clipPosition.xy / max(clipPosition.w, 0.0001);
    vLens = 0.0;
    if (uLensActive > 0.0) {
      float lensDistance = length(ndc - uLensPointer);
      vLens = (1.0 - smoothstep(0.0, uLensRadius, lensDistance))
        * uLensActive;
      viewPosition.z += vLens * uLensDepth;
      clipPosition = projectionMatrix * viewPosition;
      clipPosition.xy = uLensPointer * clipPosition.w
        + (clipPosition.xy - uLensPointer * clipPosition.w)
        * (1.0 + vLens * uLensMagnification);
    }
    vBrightness *= 1.0 + vLens * uLensIllumination;
    gl_PointSize *= 1.0 + vLens * uLensMagnification * 0.7;
    vParticleDiameter = gl_PointSize;
    gl_PointSize = max(gl_PointSize, 4.0);
    astraParticleMotion(clipPosition);
    gl_Position = clipPosition;
  }
`,
      f = `
  varying float vBrightness;
  varying float vLens;
  varying float vOpacity;
  ${l}

  void main() {
    vec2 pixel = (gl_PointCoord - vec2(0.5)) * max(vParticleDiameter, 4.0);
    float distanceToCenter = length(pixel) * 2.0 / max(vParticleDiameter, 0.0001);
    float disc = 1.0 - smoothstep(0.22, 1.0, distanceToCenter);
    float core = mix(astraFilteredCore(pixel, 0.256408), pow(disc, 1.5),
      smoothstep(2.0, 4.0, vParticleDiameter));
    float alpha = core * vOpacity;

    if (alpha <= 0.0) {
      discard;
    }

    gl_FragColor = vec4(vec3(vBrightness), alpha);
  }
`,
      d = `
  attribute float orbitProgress;
  attribute float starAcrossOffset;
  attribute float starBrightness;
  attribute vec3 starColor;
  attribute float starDepthOffset;
  attribute float starHero;
  attribute float starBackground;
  attribute float starOpacity;
  attribute float starScale;
  attribute float twinklePhase;
  attribute float twinkleRate;

  uniform float uIntensity;
  uniform float uIntroProgress;
  uniform float uBackgroundStarsEnabled;
  uniform mat4 uBackgroundModelMatrix;
  uniform float uAccretionRatio;
  uniform float uAmbientPulse;
  uniform float uCoreIntensity;
  uniform float uDensityFalloff;
  uniform float uDispersedMotion;
  uniform float uFlowSpeed;
  uniform float uExhaleStrength;
  uniform float uFormationEnabled;
  uniform float uFormationProgress;
  uniform float uGrowthEnabled;
  uniform float uGrowthDirection;
  uniform float uGrowthProgress;
  uniform float uGrowthRadius;
  uniform float uGrowthSoftness;
  uniform float uInwardStrength;
  uniform float uLensActive;
  uniform float uLensDepth;
  uniform float uLensIllumination;
  uniform float uLensMagnification;
  uniform vec2 uLensPointer;
  uniform float uLensRadius;
  uniform float uPointerRepelRadius;
  uniform vec2 uPathShapeCenter;
  uniform float uPathShapeBrightRetention;
  uniform float uPathShapeDepth;
  uniform float uPathShapeDepthPhase;
  uniform float uPathShapeMotion;
  uniform float uPathShapeProgress;
  uniform float uPathShapePositionProgress;
  uniform vec2 uPathShapeRotation;
  uniform float uPathShapeScatter;
  uniform float uPathShapePointScale;
  uniform float uPathShapeSampleCount;
  uniform vec2 uPathShapeSize;
  uniform vec2 uPathShapeTrackedScatter;
  uniform float uPathShapeTrackedSeed;
  uniform float uPathShapeTrackingEnabled;
  uniform float uTrackedClearanceSeed;
  uniform vec3 uTrackedScatter;
  uniform sampler2D uPathShapeTexture;
  uniform vec2 uScatterSize;
  uniform float uScrollDrift;
  uniform float uScrollScatter;
  uniform float uScrollPositionProgress;
  uniform float uScrollSizeScale;
  uniform vec2 uTextBounds;
  uniform float uPathMotion;
  uniform float uPathOffset;
  uniform float uPathSampleCount;
  uniform float uPathSpeed;
  uniform float uPixelRatio;
  uniform float uSizeFalloff;
  uniform float uPropagationSoftness;
  uniform float uSettleRatio;
  uniform float uTime;
  uniform float uTwinkleSpeed;
  uniform sampler2D uPathTexture;
  uniform float uViewportAspect;

  varying float vBrightness;
  varying vec3 vColor;
  varying float vLens;
  varying float vOpacity;
  varying float vRayStrength;
  varying float vParticleDiameter;

  ${c}
  ${h}
  ${u}
  ${s.ASTRA_INTRO_MOTION_GLSL}

  vec3 samplePath(float progress) {
    float scaledProgress = clamp(progress, 0.0, 1.0)
      * (uPathSampleCount - 1.0);
    float lowerIndex = floor(scaledProgress);
    float upperIndex = min(lowerIndex + 1.0, uPathSampleCount - 1.0);
    float blend = fract(scaledProgress);
    vec3 lowerPoint = texture2D(
      uPathTexture,
      vec2((lowerIndex + 0.5) / uPathSampleCount, 0.5)
    ).xyz;
    vec3 upperPoint = texture2D(
      uPathTexture,
      vec2((upperIndex + 0.5) / uPathSampleCount, 0.5)
    ).xyz;
    return mix(lowerPoint, upperPoint, blend);
  }

  vec4 samplePathShape(float progress) {
    float scaledProgress = clamp(progress, 0.0, 1.0)
      * (uPathShapeSampleCount - 1.0);
    float lowerIndex = floor(scaledProgress);
    float upperIndex = min(lowerIndex + 1.0, uPathShapeSampleCount - 1.0);
    float blend = fract(scaledProgress);
    vec4 lowerPoint = texture2D(
      uPathShapeTexture,
      vec2((lowerIndex + 0.5) / uPathShapeSampleCount, 0.5)
    );
    vec4 upperPoint = texture2D(
      uPathShapeTexture,
      vec2((upperIndex + 0.5) / uPathShapeSampleCount, 0.5)
    );
    return mix(lowerPoint, upperPoint, blend);
  }

  vec2 samplePathShapeRange(float progress) {
    float sampleIndex = min(
      floor(clamp(progress, 0.0, 0.999999) * uPathShapeSampleCount),
      uPathShapeSampleCount - 1.0
    );
    return texture2D(
      uPathShapeTexture,
      vec2((sampleIndex + 0.5) / uPathShapeSampleCount, 0.5)
    ).zw;
  }

  void main() {
    float pathPhase = fract(orbitProgress + uPathOffset);
    float targetProgress = pathPhase + uDensityFalloff
      * sin(pathPhase * 6.28318530718)
      / 6.28318530718;
    float outwardTarget = uGrowthDirection > 0.0
      ? targetProgress
      : 1.0 - targetProgress;
    float growthBirth = outwardTarget * 0.24;
    float growthLocal = clamp(
      (uGrowthProgress - growthBirth) / max(1.0 - growthBirth, 0.0001),
      0.0,
      1.0
    );
    float growthTravel = growthLocal * growthLocal * (3.0 - 2.0 * growthLocal);
    float growthStart = uGrowthDirection > 0.0 ? 0.0 : 1.0;
    float emittedProgress = mix(growthStart, targetProgress, growthTravel);
    float progress = mix(targetProgress, emittedProgress, uGrowthEnabled);
    float growthVisibility = smoothstep(
      growthBirth,
      growthBirth + 0.025,
      uGrowthProgress
    );
    float middleWeight = sin(clamp(progress, 0.0, 1.0) * 3.14159265359);
    float sizeEnvelope = mix(
      1.0,
      0.14 + 0.86 * pow(max(middleWeight, 0.0), 0.68),
      uSizeFalloff
    );
    float endpointVisibility = smoothstep(0.0, 0.055, progress)
      * (1.0 - smoothstep(0.945, 1.0, progress));
    vec3 animatedPosition = position;

    if (uPathMotion > 0.5) {
      // Fully dispersed stars no longer use the spiral position. Preserve its
      // size/opacity envelopes, but avoid six texture reads per star throughout
      // the article. Other authored entrance presets still need radial distance.
      if (uScrollPositionProgress < 1.0 || uFormationEnabled > 0.5 || uGrowthEnabled > 0.5) {
        float tangentStep = 1.0 / max(uPathSampleCount - 1.0, 1.0);
        vec3 pathPosition = samplePath(progress);
        vec3 before = samplePath(max(progress - tangentStep, 0.0));
        vec3 after = samplePath(min(progress + tangentStep, 1.0));
        vec3 tangent = normalize(after - before);
        vec3 across = normalize(vec3(-tangent.y, tangent.x, 0.0));
        animatedPosition = pathPosition
          + across * starAcrossOffset * mix(1.0, growthTravel, uGrowthEnabled)
          + vec3(
            0.0,
            0.0,
            starDepthOffset * mix(1.0, growthTravel, uGrowthEnabled)
          );
      }
    } else {
      sizeEnvelope = 1.0;
      endpointVisibility = 1.0;
    }

    float radialDistance = length(animatedPosition.xy);
    float localProgress = clamp(
      uFormationProgress
        - radialDistance * uPropagationSoftness * 0.018,
      0.0,
      1.0
    );
    float accretionEnd = clamp(uAccretionRatio, 0.12, 0.72);
    float settleStart = max(accretionEnd + 0.08, 1.0 - uSettleRatio);
    float inward = smoothstep(0.0, accretionEnd, localProgress);
    float exhale = smoothstep(accretionEnd, settleStart, localProgress);
    vec2 radialDirection = animatedPosition.xy / max(radialDistance, 0.0001);
    vec3 farPosition = animatedPosition;
    farPosition.xy += radialDirection * uInwardStrength * (2.0 + radialDistance * 0.28);
    farPosition.z += uInwardStrength * 0.8;
    vec3 condensedPosition = vec3(
      animatedPosition.xy * 0.045,
      animatedPosition.z * 0.12
    );
    vec3 formedPosition = mix(farPosition, condensedPosition, inward);
    formedPosition = mix(formedPosition, animatedPosition, exhale);
    formedPosition.xy += radialDirection
      * sin(exhale * 3.14159265359)
      * (1.0 - exhale)
      * uExhaleStrength;
    float formationVisibility = mix(0.06, 0.58, inward);
    formationVisibility = mix(formationVisibility, 1.0, exhale);
    float coreBurst = exp(-pow((localProgress - accretionEnd) * 11.0, 2.0));
    animatedPosition = mix(animatedPosition, formedPosition, uFormationEnabled);
    float scatterX = fract(sin(
      dot(vec2(orbitProgress, twinklePhase), vec2(127.1, 311.7))
    ) * 43758.5453);
    float scatterY = fract(sin(
      dot(vec2(twinklePhase, starScale), vec2(269.5, 183.3))
    ) * 43758.5453);
    float scatterZ = fract(sin(
      dot(vec2(orbitProgress, starBrightness), vec2(419.2, 371.9))
    ) * 43758.5453);
    float clearanceSeed = fract(sin(
      dot(vec2(starOpacity, twinkleRate), vec2(157.3, 283.9))
    ) * 43758.5453);
    float trackedStarWeight = starHero * uPathShapeTrackingEnabled;
    scatterX = mix(scatterX, uTrackedScatter.x, trackedStarWeight);
    scatterY = mix(scatterY, uTrackedScatter.y, trackedStarWeight);
    scatterZ = mix(scatterZ, uTrackedScatter.z, trackedStarWeight);
    clearanceSeed = mix(
      clearanceSeed,
      uTrackedClearanceSeed,
      trackedStarWeight
    );
    float keepInCenter = step(0.72, clearanceSeed);
    float scatterSide = scatterX < 0.5 ? -1.0 : 1.0;
    // Thin the inner edge so the rails read as a loose field rather than a wall.
    float outerProgress = sqrt(fract(scatterX * 2.0));
    float outerX = scatterSide * mix(
      scatterSide < 0.0 ? -uTextBounds.x : uTextBounds.y,
      uScatterSize.x * 0.5,
      outerProgress
    );
    vec3 scatteredPosition = vec3(
      mix(outerX, (scatterX - 0.5) * uScatterSize.x, keepInCenter),
      (scatterY - 0.5) * uScatterSize.y,
      (scatterZ - 0.5) * 0.5
    );
    vec2 dispersedOffset = astraDispersedMotion(
      uTime,
      scatterX,
      scatterY,
      scatterZ,
      uScrollDrift,
      uDispersedMotion
    );
    scatteredPosition.x += dispersedOffset.x;
    scatteredPosition.y = mod(
      scatteredPosition.y + dispersedOffset.y + uScatterSize.y * 0.5,
      uScatterSize.y
    ) - uScatterSize.y * 0.5;
    scatteredPosition.y -= sin(uScrollPositionProgress * 3.14159265359)
      * (0.15 + scatterZ * 0.25);
    // The opening field fills the viewport; text clearance belongs to scrolling.
    vec3 introScattered = vec3(
      (scatterX - 0.5) * uScatterSize.x,
      (fract(scatterY) - 0.5) * uScatterSize.y,
      (scatterZ - 0.5) * 0.5
    );
    // Extra stars stay in the sky while the full authored set forms the galaxy.
    float backgroundStar = starBackground * uBackgroundStarsEnabled;
    animatedPosition = mix(
      animatedPosition,
      introScattered,
      backgroundStar
    );
    animatedPosition = mix(
      animatedPosition,
      scatteredPosition,
      uScrollPositionProgress
    );
    float pathShapeProgress = uPathShapeProgress * (1.0 - backgroundStar);
    float pathShapePositionProgress = uPathShapePositionProgress * (1.0 - backgroundStar);
    float pathShapeDepthCue = 1.0;
    float pathShapeOpacityCue = 1.0;
    float pathShapeBrightKeep = 1.0;
    float shapeBaseSeed = fract(
      orbitProgress * 0.754877666
      + twinklePhase * 0.159154943
      + starScale * 0.117
    );
    float pathShapeTrackingWeight = trackedStarWeight;
    shapeBaseSeed = mix(
      shapeBaseSeed,
      uPathShapeTrackedSeed,
      pathShapeTrackingWeight
    );
    if (pathShapeProgress > 0.0 || pathShapePositionProgress > 0.0) {
    vec2 shapeRange = samplePathShapeRange(shapeBaseSeed);
    float shapeRangeSpan = max(
      shapeRange.y - shapeRange.x,
      1.0 / uPathShapeSampleCount
    );
    float shapeLocalSeed = clamp(
      (shapeBaseSeed - shapeRange.x) / shapeRangeSpan,
      0.0,
      1.0
    );
    float shapeLocalPhase = fract(
      shapeLocalSeed + uPathShapeMotion / shapeRangeSpan
    );
    float shapeLocalProgress = shapeLocalPhase + uDensityFalloff
      * sin(shapeLocalPhase * 6.28318530718)
      / 6.28318530718;
    float shapeSeed = mix(
      shapeRange.x,
      shapeRange.y,
      shapeLocalProgress
    );
    float shapeStep = 1.0 / max(uPathShapeSampleCount - 1.0, 1.0);
    vec3 pathShapePosition = samplePathShape(shapeSeed).xyz;
    vec2 pathShapeBefore = samplePathShape(
      max(shapeSeed - shapeStep, shapeRange.x)
    ).xy * uPathShapeSize;
    vec2 pathShapeAfter = samplePathShape(
      min(shapeSeed + shapeStep, shapeRange.y)
    ).xy * uPathShapeSize;
    vec2 pathShapeTangent = normalize(
      pathShapeAfter - pathShapeBefore + vec2(0.0001, 0.0)
    );
    vec2 pathShapeAcross = vec2(
      -pathShapeTangent.y,
      pathShapeTangent.x
    );
    float pathShapeRandomAcrossScatter = mix(
      (scatterX + scatterY - 1.0) * 0.12,
      uPathShapeTrackedScatter.x,
      pathShapeTrackingWeight
    );
    float pathShapeScatter = (
      starAcrossOffset * 1.1
      + pathShapeRandomAcrossScatter
    ) * uPathShapeScatter;
    float pathShapeDepthEnvelope = sin(
      shapeLocalProgress * 3.14159265359
    );
    float pathShapeContourDepth = sin(
      shapeLocalProgress * 3.14159265359 * 1.35
        + uPathShapeDepthPhase
    ) * uPathShapeDepth * pathShapeDepthEnvelope;
    float pathShapeRandomDepthScatter = mix(
      (scatterZ - 0.5) * 0.22,
      uPathShapeTrackedScatter.y,
      pathShapeTrackingWeight
    );
    vec3 pathShapeOffset = vec3(
      pathShapePosition.xy * uPathShapeSize
        + pathShapeAcross * pathShapeScatter,
      pathShapeContourDepth
      + starDepthOffset * 0.75
      + pathShapeRandomDepthScatter
    );
    pathShapeOffset.z *= uPathShapeScatter;
    float pathShapeCosX = cos(uPathShapeRotation.x);
    float pathShapeSinX = sin(uPathShapeRotation.x);
    pathShapeOffset = vec3(
      pathShapeOffset.x,
      pathShapeOffset.y * pathShapeCosX
        - pathShapeOffset.z * pathShapeSinX,
      pathShapeOffset.y * pathShapeSinX
        + pathShapeOffset.z * pathShapeCosX
    );
    float pathShapeCosY = cos(uPathShapeRotation.y);
    float pathShapeSinY = sin(uPathShapeRotation.y);
    pathShapeOffset = vec3(
      pathShapeOffset.x * pathShapeCosY
        + pathShapeOffset.z * pathShapeSinY,
      pathShapeOffset.y,
      -pathShapeOffset.x * pathShapeSinY
        + pathShapeOffset.z * pathShapeCosY
    );
    pathShapePosition = vec3(uPathShapeCenter, 0.0) + pathShapeOffset;
    float pathShapeFrontness = smoothstep(-1.15, 1.15, pathShapeOffset.z);
    pathShapeDepthCue = mix(0.78, 1.18, pathShapeFrontness);
    pathShapeOpacityCue = mix(0.72, 1.0, pathShapeFrontness);
    float pathShapeMiddleWeight = sin(
      clamp(shapeLocalProgress, 0.0, 1.0) * 3.14159265359
    );
    float pathShapeSizeEnvelope = mix(
      1.0,
      0.14 + 0.86 * pow(max(pathShapeMiddleWeight, 0.0), 0.68),
      uSizeFalloff
    );
    float pathShapeEndpointVisibility = smoothstep(
      0.0,
      0.055,
      shapeLocalProgress
    ) * (1.0 - smoothstep(0.945, 1.0, shapeLocalProgress));
    float pathShapeBrightSeed = fract(sin(
      dot(vec2(orbitProgress, twinklePhase), vec2(193.7, 417.2))
    ) * 43758.5453);
    pathShapeBrightKeep = max(
      starHero,
      step(1.0 - uPathShapeBrightRetention, pathShapeBrightSeed)
    );
    animatedPosition = mix(
      animatedPosition,
      pathShapePosition,
      pathShapePositionProgress
    );
    endpointVisibility = mix(endpointVisibility, 1.0, uScrollScatter);
    sizeEnvelope = mix(sizeEnvelope, 1.0, uScrollScatter);
    endpointVisibility = mix(
      endpointVisibility,
      pathShapeEndpointVisibility,
      pathShapeProgress
    );
    sizeEnvelope = mix(
      sizeEnvelope,
      pathShapeSizeEnvelope,
      pathShapeProgress
    );
    }

    // Scroll and cue morphs move the destination without ending the intro pull.
    animatedPosition = astraIntroMotion(
      animatedPosition, introScattered, mix(uIntroProgress, 1.0, backgroundStar),
      scatterZ, scatterY
    );
    float twinkle = 0.86 + 0.14 * sin(
      twinklePhase + uTime * uTwinkleSpeed * twinkleRate
    );
    float brightStarWeight = smoothstep(1.35, 1.65, starBrightness);
    float pathShapeSuppressedBright = pathShapeProgress
      * brightStarWeight
      * (1.0 - pathShapeBrightKeep);
    vBrightness = uIntensity * starBrightness * twinkle
      * mix(
        1.0,
        uAmbientPulse + coreBurst * (uCoreIntensity - 1.0),
        uFormationEnabled
      )
      * mix(1.0, pathShapeDepthCue, pathShapeProgress)
      * mix(1.0, 0.42, pathShapeSuppressedBright);
    vColor = starColor;
    vOpacity = starOpacity
      * endpointVisibility
      * (0.92 + twinkle * 0.08)
      * mix(1.0, formationVisibility, uFormationEnabled);
    vOpacity *= mix(1.0, growthVisibility, uGrowthEnabled);
    vOpacity *= mix(1.0, pathShapeOpacityCue, pathShapeProgress);
    vRayStrength = smoothstep(1.45, 2.8, starBrightness)
      * mix(1.0, pathShapeBrightKeep, pathShapeProgress);
    float scrollSizeScale = mix(
      uScrollSizeScale,
      1.0,
      pathShapeProgress * brightStarWeight * pathShapeBrightKeep
    );
    // Reveal the dispersed field before pulling its stars into place.
    float introLocalProgress = astraParticleRevealProgress(
      uIntroProgress,
      scatterZ
    );
    float backgroundPresence = backgroundStar
      * max(1.0 - uScrollScatter, uPathShapeProgress);
    scrollSizeScale = mix(scrollSizeScale, 1.0, backgroundPresence);
    vOpacity *= mix(1.0, uBackgroundStarsEnabled, starBackground);
    introLocalProgress = mix(
      introLocalProgress, min(introLocalProgress, 0.2), backgroundPresence
    );
    float introParticleScale = sqrt(introLocalProgress);
    vOpacity *= smoothstep(
      0.0,
      ${i.ASTRA_PARTICLE_OPACITY_REVEAL_END},
      introLocalProgress
    );
    gl_PointSize = uPixelRatio
      * (0.35 + starScale * sizeEnvelope * endpointVisibility * 3.8)
      * (0.97 + twinkle * 0.03)
      * mix(1.0, 1.0 + coreBurst * 0.42, uFormationEnabled)
      * mix(1.0, 0.3 + growthVisibility * 0.7, uGrowthEnabled)
      * scrollSizeScale
      * mix(uPathShapePointScale, 1.0, backgroundStar)
      * mix(1.0, pathShapeDepthCue, pathShapeProgress)
      * introParticleScale;
    vec4 viewPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
    if (backgroundStar > 0.5) {
      viewPosition = viewMatrix * (uBackgroundModelMatrix * vec4(animatedPosition, 1.0));
    }
    vec4 clipPosition = projectionMatrix * viewPosition;
    vec2 ndc = clipPosition.xy / max(clipPosition.w, 0.0001);
    vLens = 0.0;
    if (uLensActive > 0.0) {
      float lensDistance = length(ndc - uLensPointer);
      vLens = (1.0 - smoothstep(0.0, uLensRadius, lensDistance))
        * uLensActive;
      viewPosition.z += vLens * uLensDepth;
      clipPosition = projectionMatrix * viewPosition;
      clipPosition.xy = uLensPointer * clipPosition.w
        + (clipPosition.xy - uLensPointer * clipPosition.w)
        * (1.0 + vLens * uLensMagnification);
    }
    vBrightness *= 1.0 + vLens * uLensIllumination;
    gl_PointSize *= 1.0 + vLens * uLensMagnification * 0.7;
    vParticleDiameter = gl_PointSize;
    gl_PointSize = max(gl_PointSize, 4.0);
    astraParticleMotion(clipPosition);
    gl_Position = clipPosition;
  }
`,
      m = `
  varying float vBrightness;
  varying vec3 vColor;
  varying float vLens;
  varying float vOpacity;
  varying float vRayStrength;
  ${l}

  void main() {
    vec2 pixel = (gl_PointCoord - vec2(0.5)) * max(vParticleDiameter, 4.0);
    vec2 point = pixel * 2.0 / max(vParticleDiameter, 0.0001);
    float distanceToCenter = length(point);
    float disc = 1.0 - smoothstep(0.08, 1.0, distanceToCenter);
    float core = pow(disc, 2.2);
    float horizontalRay = exp(-abs(point.y) * 28.0)
      * (1.0 - smoothstep(0.18, 1.0, abs(point.x)));
    float verticalRay = exp(-abs(point.x) * 28.0)
      * (1.0 - smoothstep(0.18, 1.0, abs(point.y)));
    float rays = max(horizontalRay, verticalRay) * 0.28 * vRayStrength;
    float resolved = smoothstep(2.0, 4.0, vParticleDiameter);
    float alpha = mix(astraFilteredCore(pixel, 0.150904), max(core, rays), resolved)
      * vOpacity;

    if (alpha <= 0.0) {
      discard;
    }

    float whiteCore = mix(0.59228, core, resolved)
      * smoothstep(0.9, 2.8, vBrightness)
      * 0.82;
    float colorEnergy = 1.0
      - min(vColor.r, min(vColor.g, vColor.b));
    vec3 emission = mix(vColor, vec3(1.0), whiteCore)
      * vBrightness
      * (1.0 + colorEnergy * 0.42);
    gl_FragColor = vec4(emission, alpha);
  }
`,
      S = {
        blending: e.CustomBlending,
        blendEquation: e.AddEquation,
        blendSrc: e.SrcAlphaFactor,
        blendDst: e.OneFactor,
        blendEquationAlpha: e.AddEquation,
        blendSrcAlpha: e.OneFactor,
        blendDstAlpha: e.OneMinusSrcAlphaFactor,
      },
      g = `<svg viewBox="0 0 231 325" xmlns="http://www.w3.org/2000/svg">${["M128.472 2.36011C65.4727 24.3601 10.7725 93.1601 9.97246 162.36C8.97246 248.86 79.4138 262.86 87.9725 262.86C116.973 262.86 135.973 244.36 135.973 221.36C135.973 189.86 102.973 193.86 102.973 209.36", "M224.973 31.8602C132.473 3.86011 29.9727 75.8601 29.9727 159.86C29.9727 247.86 98.4726 259.86 126.473 247.86", "M126.473 215.359C124.639 222.692 117.073 237.159 101.473 236.359C89.1905 235.729 76.0585 219.995 76.4724 195.859C76.4724 165.859 100.473 142.859 132.473 142.859C171.973 142.859 213.473 171.36 213.473 231.36C213.473 276.36 170.473 328.36 85.9727 316.86", "M106.973 237.36C81.9727 240.36 61.4727 222.86 61.4727 184.86C61.4727 153.36 91.9727 123.36 132.473 123.36C172.973 123.36 227.973 149.86 227.973 225.36C227.973 287.36 168.473 322.36 121.473 322.36C53.4727 322.36 10.9727 264.86 2.47266 208.36", "M114.973 211.36C114.973 225.86 92.4727 226.86 92.4727 205.36C92.4727 183.86 109.938 175.36 127.973 175.36C146.008 175.36 174.473 195.86 174.473 230.86C174.473 264.36 148.473 281.86 133.973 287.36C119.473 292.86 81.6727 296.56 54.4727 269.36"].map((t) => `<path d="${t}"/>`).join("")}</svg>`,
      P = [
        { depth: 0.62, phase: 0.16, speed: 0.025, strong: !0 },
        { depth: -0.46, phase: 0.72, speed: -0.018, strong: !1 },
        { depth: 0.78, phase: 0.38, speed: 0.021, strong: !0 },
        { depth: -0.7, phase: 0.58, speed: -0.016, strong: !1 },
        { depth: 0.42, phase: 0.08, speed: 0.03, strong: !0 },
      ];
    class y extends e.Curve {
      source;
      depth;
      rotationDepth;
      depthPhase;
      constructor(t, e, a, r) {
        (super(),
          (this.source = t),
          (this.depth = e),
          (this.rotationDepth = a),
          (this.depthPhase = r),
          (this.arcLengthDivisions = 640));
      }
      getPoint(t, a = new e.Vector3()) {
        let r = e.MathUtils.clamp(t, 0, 1),
          o = this.source.getPointAt(r),
          i = Math.sin(r * Math.PI),
          s =
            Math.sin(r * Math.PI * 1.35 + this.depthPhase) *
            this.depth *
            this.rotationDepth *
            i;
        return a.set(
          (o.x - 114.973) * (9.7 / 325),
          (211.36 - o.y) * (9.7 / 325),
          s,
        );
      }
    }
    function v(t) {
      let e = t >>> 0;
      return () => {
        let t = (e += 0x6d2b79f5);
        return (
          (t = Math.imul(t ^ (t >>> 15), 1 | t)),
          (((t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ (t >>> 14)) >>> 0) /
            0x100000000
        );
      };
    }
    function x(t, e, a, r) {
      let o = 43758.5453 * Math.sin(t * a + e * r);
      return o - Math.floor(o);
    }
    function b(t, a) {
      return (
        (t.magFilter = a ? e.LinearFilter : e.NearestFilter),
        (t.minFilter = a ? e.LinearFilter : e.NearestFilter),
        (t.generateMipmaps = !1),
        (t.wrapS = e.ClampToEdgeWrapping),
        (t.wrapT = e.ClampToEdgeWrapping),
        (t.needsUpdate = !0),
        t
      );
    }
    function w(t, a, r = null, o = 0, i = 0.18, s = 0, n = 0.5, l) {
      let { stars: u, accretionExhale: c, grow: h, interaction: p } = t;
      return new e.ShaderMaterial({
        ...S,
        depthTest: !1,
        depthWrite: !1,
        fragmentShader: m,
        toneMapped: !1,
        transparent: !0,
        uniforms: {
          uAccretionRatio: { value: c.accretionRatio },
          uAmbientPulse: { value: 1 },
          uCoreIntensity: { value: c.coreIntensity },
          uDensityFalloff: {
            value: e.MathUtils.clamp(u.densityFalloff, 0, 0.98),
          },
          uDispersedMotion: { value: 0 },
          uFlowSpeed: { value: e.MathUtils.clamp(u.flowSpeed, 0, 3) },
          uExhaleStrength: { value: c.exhaleStrength },
          uFormationEnabled: { value: 0 },
          uFormationProgress: { value: 1 },
          uBackgroundStarsEnabled: { value: 0 },
          uBackgroundModelMatrix: { value: new e.Matrix4() },
          uIntroProgress: {
            value: Number(
              !t.animationPlaying || "converge-tilt" !== t.animationPreset,
            ),
          },
          uGrowthEnabled: { value: 0 },
          uGrowthDirection: { value: 1 },
          uGrowthProgress: { value: 1 },
          uGrowthRadius: { value: 8.2 },
          uGrowthSoftness: { value: h.softness },
          uInwardStrength: { value: c.inwardStrength },
          uIntensity: { value: e.MathUtils.clamp(u.intensity, 0.1, 3) },
          uPathMotion: { value: Number(null !== r) },
          uPathOffset: { value: 0 },
          uPathSampleCount: { value: 512 },
          uPathSpeed: { value: o },
          uPathTexture: { value: r },
          uPathShapeCenter: { value: new e.Vector2() },
          uPathShapeBrightRetention: { value: e.MathUtils.clamp(n, 0, 1) },
          uPathShapeDepth: { value: e.MathUtils.clamp(i, -1.8, 1.8) },
          uPathShapeDepthPhase: { value: s },
          uPathShapeMotion: { value: 0 },
          uPathShapeProgress: { value: 0 },
          uPathShapePositionProgress: { value: 0 },
          uPathShapeRotation: { value: new e.Vector2() },
          uPathShapeScatter: { value: 1 },
          uPathShapePointScale: { value: 1 },
          uPathShapeSampleCount: { value: 1024 },
          uPathShapeSize: { value: new e.Vector2() },
          uPathShapeTrackedScatter: {
            value: new e.Vector2(l?.acrossScatter ?? 0, l?.depthScatter ?? 0),
          },
          uTrackedClearanceSeed: { value: l?.clearanceSeed ?? 0 },
          uTrackedScatter: { value: l?.scatter.clone() ?? new e.Vector3() },
          uPathShapeTrackedSeed: { value: l?.seed ?? 0 },
          uPathShapeTrackingEnabled: { value: Number(void 0 !== l) },
          uPathShapeTexture: { value: null },
          uLensActive: { value: 0 },
          uLensDepth: { value: p.depthDisplacement },
          uLensIllumination: { value: p.illumination },
          uLensMagnification: { value: p.magnification },
          uLensPointer: { value: new e.Vector2() },
          uLensRadius: { value: 0.2 },
          uParticleMotionEnabled: { value: 0 },
          uPointerRepelRadius: { value: 0.2 },
          uPixelRatio: { value: a },
          uSizeFalloff: { value: e.MathUtils.clamp(u.sizeFalloff, 0, 1) },
          uPropagationSoftness: { value: c.propagationSoftness },
          uScatterSize: { value: new e.Vector2(12, 12) },
          uScrollDrift: { value: 0 },
          uScrollScatter: { value: 0 },
          uScrollPositionProgress: { value: 0 },
          uScrollSizeScale: { value: 1 },
          uSettleRatio: { value: 0.15 },
          uTextBounds: { value: new e.Vector2(-3, 3) },
          uTime: { value: 0 },
          uTwinkleSpeed: { value: e.MathUtils.clamp(u.twinkleSpeed, 0, 2) },
          uViewportAspect: { value: 1 },
        },
        vertexShader: d,
      });
    }
    function A(t, e) {
      let a = t.reduce((t, e) => t + e, 0);
      if (e >= a) return t;
      if (e <= 0) return t.map(() => 0);
      let r = t.map((t) => (t / a) * e),
        o = r.map(Math.floor),
        i = e - o.reduce((t, e) => t + e, 0),
        s = r.map((t, e) => ({ index: e, fraction: t - o[e] }));
      for (let { index: t } of (s.sort(
        (t, e) => e.fraction - t.fraction || t.index - e.index,
      ),
      s)) {
        if (i <= 0) break;
        ((o[t] += 1), (i -= 1));
      }
      for (let t = 0; t < P.length; t += 1) {
        let e = 2 * t,
          a = e + 1;
        0 === o[e] && o[a] > 0 && ((o[e] = 1), (o[a] -= 1));
      }
      return o;
    }
    function M(t) {
      return Math.sin(e.MathUtils.clamp(t, 0, 1) * Math.PI);
    }
    function C(t) {
      return (
        e.MathUtils.smoothstep(t, 0, 0.055) *
        (1 - e.MathUtils.smoothstep(t, 0.945, 1))
      );
    }
    function T(t, a) {
      return e.MathUtils.lerp(
        1,
        0.14 + 0.86 * M(t) ** 0.68,
        e.MathUtils.clamp(a, 0, 1),
      );
    }
    function D(t, a) {
      let r = R(t, 1);
      return (
        r +
        (e.MathUtils.clamp(a, 0, 0.98) * Math.sin(r * Math.PI * 2)) /
          (2 * Math.PI)
      );
    }
    function F(t, e, a) {
      let r = t.getPointAt(0).lengthSq(),
        o = t.getPointAt(1).lengthSq() < r;
      return Math.abs(e) * ((a ? o : !o) ? 1 : -1);
    }
    function R(t, e) {
      return ((t % e) + e) % e;
    }
    t.s(
      [
        "createPathShapeTexture",
        0,
        function () {
          return b(
            new e.DataTexture(
              new Float32Array(4096),
              1024,
              1,
              e.RGBAFormat,
              e.FloatType,
            ),
            !1,
          );
        },
        "densityProgress",
        0,
        D,
        "easeOutExpo",
        0,
        function (t) {
          return t >= 1 ? 1 : 1 - 2 ** (-10 * t);
        },
        "generateAstraField",
        0,
        function (t, o = {}) {
          let i = o.tier ?? 3,
            s = o.trackOpticalSources ?? !0,
            n = i <= 1 ? 2 : 4,
            l = e.MathUtils.clamp(t.stars.density, 0.25, n),
            u = e.MathUtils.clamp(t.orbitalDust.density, 0.1, n),
            c = P.flatMap((e) => [
              Math.max(8, Math.round((e.strong ? 220 : 170) * l)),
              t.orbitalDust.enabled
                ? Math.max(1, Math.round((e.strong ? 150 : 90) * u))
                : 0,
            ]);
          c.push(t.showCenterCluster ? Math.max(18, Math.round(24 * l)) : 0);
          let h = c.map((e, a) =>
              "converge-tilt" === t.animationPreset &&
              a < 2 * P.length &&
              a % 2 == 0
                ? Math.ceil((0.12 * e) / 0.88)
                : 0,
            ),
            d = [...c, ...h].reduce((t, e) => t + e, 0),
            m = o.maxParticleCount ?? d,
            L =
              0 === i
                ? 0
                : Number.isFinite(m)
                  ? Math.max(0, Math.floor(m))
                  : m === 1 / 0
                    ? d
                    : 0,
            k = A(c, L),
            E = k.reduce((t, e) => t + e, 0),
            B = A(h, Math.max(0, L - E)),
            I = Number.isFinite(o.pixelRatio)
              ? e.MathUtils.clamp(
                  o.pixelRatio ?? 1,
                  0.1,
                  i <= 1 ? 1 : 2 === i ? 1.5 : 2,
                )
              : 1,
            O = new e.Group(),
            z = new e.Object3D();
          (z.scale.setScalar(0), O.add(z));
          let V = [],
            _ = [],
            U = [],
            N = [],
            G = null,
            X = E + B.reduce((t, e) => t + e, 0);
          if (X > 0) {
            new a.SVGLoader()
              .parse(g)
              .paths.map((t) => t.subPaths[0])
              .forEach((a, o) => {
                let i = P[o],
                  n = k[2 * o],
                  l = k[2 * o + 1];
                if (!a || !i || 0 === n) return;
                let u = new y(
                    a,
                    i.depth,
                    e.MathUtils.clamp(t.rotationDepth, 0, 2),
                    0.82 * o,
                  ),
                  c = F(u, i.speed, t.stars.flowInward),
                  h = F(u, i.speed, !1),
                  d = (function (t, a, o, i, s, n, l, u) {
                    let {
                        stars: c,
                        colorMode: h,
                        colorPalette: p,
                        colorPaletteColors: f,
                        rotationDepth: d,
                      } = s,
                      m = n + l,
                      S = new Float32Array(3 * m),
                      g = new Float32Array(m),
                      P = new Float32Array(m),
                      y = new Float32Array(3 * m),
                      A = new Float32Array(m),
                      C = new Float32Array(m),
                      T = new Float32Array(m),
                      F = new Float32Array(m),
                      L = new Float32Array(m),
                      k = new Float32Array(m),
                      E = new Float32Array(m),
                      B = v(0x243f6a88 ^ ((i + 1) * 0x9e3779b9)),
                      I = v(0xa4093822 ^ ((i + 1) * 0x299f31d0)),
                      O = new e.Vector3(),
                      z = new e.Vector3(),
                      V = new e.Vector3(),
                      _ = new e.Vector3(),
                      U = e.MathUtils.clamp(c.densityFalloff, 0, 1),
                      N = e.MathUtils.clamp(c.scatter, 0, 0.45),
                      { samples: G, texture: X } = (function (t) {
                        let a = new Float32Array(2048),
                          r = new e.Vector3();
                        for (let e = 0; e < 512; e += 1) {
                          t.getPointAt(e / 511, r);
                          let o = 4 * e;
                          ((a[o] = r.x),
                            (a[o + 1] = r.y),
                            (a[o + 2] = r.z),
                            (a[o + 3] = 1));
                        }
                        return {
                          samples: a,
                          texture: b(
                            new e.DataTexture(
                              a,
                              512,
                              1,
                              e.RGBAFormat,
                              e.FloatType,
                            ),
                            !1,
                          ),
                        };
                      })(t),
                      W = -1 / 0,
                      Y = 0,
                      q = 0,
                      $ = 0.5,
                      Z = 0;
                    for (let o = 0; o < m; o += 1) {
                      let i = B(),
                        s = D(i, U),
                        l = M(s);
                      (t.getPointAt(s, O),
                        t.getTangentAt(s, z).normalize(),
                        V.set(-z.y, z.x, 0).normalize());
                      let u =
                          N * e.MathUtils.lerp(0.3, 1, l) * (0.22 + 0.78 * B()),
                        d = (B() + B() - 1) * u,
                        m = (B() + B() - 1) * u * 0.65;
                      (O.addScaledVector(V, d), (O.z += m));
                      let v = e.MathUtils.lerp(
                          (a.strong ? 0.085 : 0.055) * 0.22,
                          a.strong ? 0.085 : 0.055,
                          l,
                        ),
                        x = B() < v,
                        b =
                          (x ? 0.85 + 1.25 * B() : 0.12 + B() ** 2.4 * 0.68) *
                          e.MathUtils.clamp(c.size, 0.25, 3),
                        w =
                          (x ? 2 + 1.5 * B() : 0.56 + 0.78 * B()) *
                          (a.strong ? 1 : 0.82),
                        C = 3 * o;
                      ((S[C] = O.x),
                        (S[C + 1] = O.y),
                        (S[C + 2] = O.z),
                        (g[o] = d),
                        (P[o] = w),
                        (0, r.writeStarColor)(y, C, h, I(), p, f),
                        (A[o] = m),
                        (T[o] = 0.82 + 0.16 * B()),
                        (F[o] = i),
                        (L[o] = b),
                        (k[o] = B() * Math.PI * 2),
                        (E[o] = 0.65 + 0.7 * B()),
                        o < n &&
                          b > W &&
                          ((W = b),
                          (Y = d),
                          (q = m),
                          ($ = i),
                          (Z = o),
                          _.copy(O)));
                    }
                    (($ = F[Z] ?? $), (Y = g[Z] ?? Y), (q = A[Z] ?? q));
                    let H =
                      (a.strong ? 2.2 : 2.05) *
                      e.MathUtils.clamp(c.size, 0.25, 3);
                    ((L[Z] = Math.max(L[Z], H)),
                      (P[Z] = Math.max(P[Z], a.strong ? 3.35 : 2.85)),
                      (C[Z] = 1));
                    let j = a.depth * e.MathUtils.clamp(d, 0, 2),
                      K = 0.82 * i,
                      J = Math.fround(
                        R(
                          (F[Z] ?? 0) * 0.754877666 +
                            (k[Z] ?? 0) * 0.159154943 +
                            (L[Z] ?? 0) * 0.117,
                          1,
                        ),
                      ),
                      Q = x(F[Z] ?? 0, k[Z] ?? 0, 127.1, 311.7),
                      tt = x(k[Z] ?? 0, L[Z] ?? 0, 269.5, 183.3),
                      te = x(F[Z] ?? 0, P[Z] ?? 0, 419.2, 371.9),
                      ta = x(T[Z] ?? 0, E[Z] ?? 0, 157.3, 283.9),
                      tr = new e.Vector3(Q, tt, te),
                      to = Math.fround((Q + tt - 1) * 0.12),
                      ti = Math.fround((te - 0.5) * 0.22);
                    (0, r.writeStarColor)(
                      y,
                      3 * Z,
                      h,
                      r.SECONDARY_COLOR_SEEDS[i] ?? 0.08,
                      p,
                      f,
                    );
                    let ts = new e.BufferGeometry();
                    (ts.setAttribute(
                      "position",
                      new e.Float32BufferAttribute(S, 3),
                    ),
                      ts.setAttribute(
                        "orbitProgress",
                        new e.Float32BufferAttribute(F, 1),
                      ),
                      ts.setAttribute(
                        "starAcrossOffset",
                        new e.Float32BufferAttribute(g, 1),
                      ),
                      ts.setAttribute(
                        "starDepthOffset",
                        new e.Float32BufferAttribute(A, 1),
                      ),
                      ts.setAttribute(
                        "starHero",
                        new e.Float32BufferAttribute(C, 1),
                      ),
                      ts.setAttribute(
                        "starBackground",
                        new e.Float32BufferAttribute(
                          new Float32Array(m).fill(1, n),
                          1,
                        ),
                      ),
                      ts.setAttribute(
                        "starBrightness",
                        new e.Float32BufferAttribute(P, 1),
                      ),
                      ts.setAttribute(
                        "starColor",
                        new e.Float32BufferAttribute(y, 3),
                      ),
                      ts.setAttribute(
                        "starOpacity",
                        new e.Float32BufferAttribute(T, 1),
                      ),
                      ts.setAttribute(
                        "starScale",
                        new e.Float32BufferAttribute(L, 1),
                      ),
                      ts.setAttribute(
                        "twinklePhase",
                        new e.Float32BufferAttribute(k, 1),
                      ),
                      ts.setAttribute(
                        "twinkleRate",
                        new e.Float32BufferAttribute(E, 1),
                      ));
                    let tn = w(s, u, X, o, j, K, 0.5, {
                        acrossScatter: to,
                        clearanceSeed: ta,
                        depthScatter: ti,
                        scatter: tr,
                        seed: J,
                      }),
                      tl = new e.Points(ts, tn);
                    return (
                      (tl.frustumCulled = !1),
                      (tl.renderOrder = 40 + i),
                      {
                        flareAcrossOffset: Y,
                        flareBasePosition: _.clone(),
                        flareClearanceSeed: ta,
                        flareDepthOffset: q,
                        flarePathSamples: G,
                        flarePosition: _,
                        flareProgress: $,
                        flareScatter: tr,
                        flareShapeAcrossScatter: to,
                        flareShapeDepthScatter: ti,
                        flareShapeSeed: J,
                        geometry: ts,
                        material: tn,
                        pathShapeDepth: j,
                        pathShapeDepthPhase: K,
                        pathTexture: X,
                        points: tl,
                      }
                    );
                  })(u, i, c, o, t, n, B[2 * o], I),
                  m =
                    l > 0
                      ? (function (t, a, r, o, i, s, n) {
                          let {
                              orbitalDust: l,
                              stars: u,
                              accretionExhale: c,
                              grow: h,
                              interaction: d,
                            } = i,
                            m = new Float32Array(3 * s),
                            g = new Float32Array(s),
                            P = new Float32Array(3 * s),
                            y = new Float32Array(s),
                            x = new Float32Array(s),
                            b = new Float32Array(s),
                            w = v(0x9e3779b9 ^ ((o + 1) * 0x85ebca6b)),
                            A = new e.Vector3(),
                            C = new e.Vector3(),
                            T = new e.Vector3(),
                            D = e.MathUtils.clamp(l.spread, 0, 0.65),
                            F = Math.min(
                              e.MathUtils.clamp(l.tightSpread, 0, 0.3),
                              D,
                            ),
                            R = e.MathUtils.clamp(u.densityFalloff, 0, 1),
                            L = e.MathUtils.clamp(u.sizeFalloff, 0, 1);
                          for (let a = 0; a < s; a += 1) {
                            var k;
                            let r = (a + 0.92 * w()) / s,
                              o = (w() + w() + w()) / 3,
                              i = w() < R ? o : r,
                              n = M(i),
                              l = e.MathUtils.lerp(
                                1,
                                0.18 + 0.82 * n ** 0.68,
                                L,
                              );
                            (t.getPointAt(i, A),
                              t.getTangentAt(i, C).normalize(),
                              T.set(-C.y, C.x, 0).normalize());
                            let u = 0.68 > w(),
                              c = (u ? F : D) * l;
                            (A.addScaledVector(T, (w() + w() - 1) * c),
                              (A.z += (w() + w() - 1) * c * 0.7));
                            let h = 3 * a;
                            ((m[h] = A.x),
                              (m[h + 1] = A.y),
                              (m[h + 2] = A.z),
                              (y[a] = i),
                              (g[a] = w()),
                              (P[h] = C.x),
                              (P[h + 1] = C.y),
                              (P[h + 2] = C.z),
                              (b[a] = w() * (u ? 1 : 0.72) * l),
                              (x[a] =
                                ((k = i),
                                e.MathUtils.smoothstep(k, 0, 0.07) *
                                  (1 - e.MathUtils.smoothstep(k, 0.84, 1)) *
                                  (u ? 1 : 0.72) *
                                  (0.38 + 0.58 * w()) *
                                  e.MathUtils.lerp(1, 0.3 + 0.7 * n, L))));
                          }
                          let E = new e.BufferGeometry();
                          (E.setAttribute(
                            "position",
                            new e.Float32BufferAttribute(m, 3),
                          ),
                            E.setAttribute(
                              "driftPhase",
                              new e.Float32BufferAttribute(g, 1),
                            ),
                            E.setAttribute(
                              "driftTangent",
                              new e.Float32BufferAttribute(P, 3),
                            ),
                            E.setAttribute(
                              "orbitProgress",
                              new e.Float32BufferAttribute(y, 1),
                            ),
                            E.setAttribute(
                              "particleOpacity",
                              new e.Float32BufferAttribute(x, 1),
                            ),
                            E.setAttribute(
                              "particleScale",
                              new e.Float32BufferAttribute(b, 1),
                            ));
                          let B = new e.ShaderMaterial({
                              ...S,
                              depthTest: !1,
                              depthWrite: !1,
                              fragmentShader: f,
                              toneMapped: !1,
                              transparent: !0,
                              uniforms: {
                                uAccretionRatio: { value: c.accretionRatio },
                                uAmbientPulse: { value: 1 },
                                uCoreIntensity: { value: c.coreIntensity },
                                uDirection: { value: r < 0 ? -1 : 1 },
                                uDispersedMotion: { value: 0 },
                                uDriftDistance: { value: 0.16 },
                                uDriftSpeed: {
                                  value: e.MathUtils.clamp(
                                    l.driftSpeed,
                                    0,
                                    1.5,
                                  ),
                                },
                                uExhaleStrength: { value: c.exhaleStrength },
                                uFormationEnabled: { value: 0 },
                                uFormationProgress: { value: 1 },
                                uIntroProgress: {
                                  value: Number(
                                    !i.animationPlaying ||
                                      "converge-tilt" !== i.animationPreset,
                                  ),
                                },
                                uGrowthEnabled: { value: 0 },
                                uGrowthProgress: { value: 1 },
                                uGrowthRadius: { value: 8.2 },
                                uGrowthSoftness: { value: h.softness },
                                uHeadProgress: { value: a.phase },
                                uInwardStrength: { value: c.inwardStrength },
                                uIntensity: {
                                  value: e.MathUtils.clamp(l.intensity, 0, 3),
                                },
                                uLightReach: {
                                  value:
                                    e.MathUtils.clamp(l.reach, 0.02, 0.4) *
                                    (a.strong ? 1.15 : 1),
                                },
                                uPixelRatio: { value: n },
                                uStarBrightness: { value: a.strong ? 1 : 0.62 },
                                uStarVisibility: { value: 1 },
                                uLensActive: { value: 0 },
                                uLensDepth: { value: d.depthDisplacement },
                                uLensIllumination: { value: d.illumination },
                                uLensMagnification: { value: d.magnification },
                                uLensPointer: { value: new e.Vector2() },
                                uLensRadius: { value: 0.2 },
                                uParticleMotionEnabled: { value: 0 },
                                uPointerRepelRadius: { value: 0.2 },
                                uPropagationSoftness: {
                                  value: c.propagationSoftness,
                                },
                                uScatterSize: { value: new e.Vector2(12, 12) },
                                uScrollDrift: { value: 0 },
                                uScrollScatter: { value: 0 },
                                uScrollPositionProgress: { value: 0 },
                                uSettleRatio: { value: 0.15 },
                                uTrailEnabled: { value: 1 },
                                uTrailLength: { value: 0.18 },
                                uTime: { value: 0 },
                                uViewportAspect: { value: 1 },
                              },
                              vertexShader: p,
                            }),
                            I = new e.Points(E, B);
                          return (
                            (I.frustumCulled = !1),
                            (I.renderOrder = 70 + o),
                            { geometry: E, material: B, points: I }
                          );
                        })(u, i, c, o, t, l, I)
                      : null,
                  g = new e.Group();
                (g.add(d.points),
                  m && (g.add(m.points), V.push(m.geometry, m.material)));
                let A = null;
                if (s) {
                  ((A = new e.Object3D()).position.copy(d.flarePosition),
                    (A.userData.astraFlareScatter = d.flareScatter));
                  let a = D(d.flareProgress, t.stars.densityFalloff);
                  (A.scale.setScalar(C(a) * T(a, t.stars.sizeFalloff)),
                    g.add(A),
                    N.push(A));
                }
                (O.add(g),
                  _.push({
                    group: g,
                    lag: 0.18 + 0.17 * o,
                    spin: new e.Vector2(),
                  }),
                  U.push({
                    curve: u,
                    dustMaterial: m?.material ?? null,
                    flareAcrossOffset: d.flareAcrossOffset,
                    flareBasePosition: d.flareBasePosition,
                    flareClearanceSeed: d.flareClearanceSeed,
                    flareDepthOffset: d.flareDepthOffset,
                    flarePathSamples: d.flarePathSamples,
                    flareProgress: d.flareProgress,
                    flareScatter: d.flareScatter,
                    flareShapeAcrossScatter: d.flareShapeAcrossScatter,
                    flareShapeDepthScatter: d.flareShapeDepthScatter,
                    flareShapeSeed: d.flareShapeSeed,
                    flareSource: A,
                    isCore: !1,
                    outwardSpeed: h,
                    phase: i.phase,
                    motionOffset: 0,
                    speed: c,
                    starMaterial: d.material,
                    strong: i.strong,
                    pathShapeDepth: d.pathShapeDepth,
                    pathShapeDepthPhase: d.pathShapeDepthPhase,
                    pathShapeTravel: 0,
                    travel: i.phase,
                  }),
                  V.push(d.geometry, d.material, d.pathTexture));
              });
            let o = k[2 * P.length];
            if (o > 0) {
              let a = (function (t, a, o) {
                let {
                    stars: i,
                    colorMode: s,
                    colorPalette: n,
                    colorPaletteColors: l,
                  } = t,
                  u = new Float32Array(3 * a),
                  c = new Float32Array(a),
                  h = new Float32Array(3 * a),
                  p = new Float32Array(a),
                  f = new Float32Array(a),
                  d = new Float32Array(a),
                  m = new Float32Array(a),
                  S = new Float32Array(a),
                  g = v(0xb7e15162),
                  P = v(0xc0ac29b7),
                  y = 0,
                  b = -1 / 0;
                for (let t = 0; t < a; t += 1) {
                  let a = g() ** 2.4 * 0.42,
                    o = g() * Math.PI * 2,
                    p = 3 * t;
                  ((u[p] = Math.cos(o) * a),
                    (u[p + 1] = Math.sin(o) * a * 0.72),
                    (u[p + 2] = (g() - 0.5) * 0.16));
                  let v = 1 - a / 0.42;
                  ((c[t] = 1.2 + 2.8 * v + 0.6 * g()),
                    (0, r.writeStarColor)(h, p, s, v > 0.74 ? 0.99 : P(), n, l),
                    (f[t] = 0.62 + 0.38 * v),
                    (d[t] =
                      (0.28 + 1.45 * v + 0.45 * g()) *
                      e.MathUtils.clamp(i.size, 0.25, 3) *
                      0.8));
                  let x = c[t] * d[t];
                  (x > b && ((y = t), (b = x)),
                    (m[t] = g() * Math.PI * 2),
                    (S[t] = 0.55 + 0.45 * g()));
                }
                p[y] = 1;
                let A = 3 * y,
                  M = new e.Vector3(u[A] ?? 0, u[A + 1] ?? 0, u[A + 2] ?? 0),
                  C = new e.Vector3(
                    x(0, m[y] ?? 0, 127.1, 311.7),
                    x(m[y] ?? 0, d[y] ?? 0, 269.5, 183.3),
                    x(0, c[y] ?? 0, 419.2, 371.9),
                  ),
                  T = x(f[y] ?? 0, S[y] ?? 0, 157.3, 283.9),
                  D = Math.fround(
                    R(0 + (m[y] ?? 0) * 0.159154943 + (d[y] ?? 0) * 0.117, 1),
                  ),
                  F = Math.fround((C.x + C.y - 1) * 0.12),
                  L = Math.fround((C.z - 0.5) * 0.22),
                  k = new e.BufferGeometry();
                (k.setAttribute("position", new e.Float32BufferAttribute(u, 3)),
                  k.setAttribute(
                    "orbitProgress",
                    new e.Float32BufferAttribute(new Float32Array(a), 1),
                  ),
                  k.setAttribute(
                    "starAcrossOffset",
                    new e.Float32BufferAttribute(new Float32Array(a), 1),
                  ),
                  k.setAttribute(
                    "starDepthOffset",
                    new e.Float32BufferAttribute(new Float32Array(a), 1),
                  ),
                  k.setAttribute(
                    "starHero",
                    new e.Float32BufferAttribute(p, 1),
                  ),
                  k.setAttribute(
                    "starBackground",
                    new e.Float32BufferAttribute(new Float32Array(a), 1),
                  ),
                  k.setAttribute(
                    "starBrightness",
                    new e.Float32BufferAttribute(c, 1),
                  ),
                  k.setAttribute(
                    "starColor",
                    new e.Float32BufferAttribute(h, 3),
                  ),
                  k.setAttribute(
                    "starOpacity",
                    new e.Float32BufferAttribute(f, 1),
                  ),
                  k.setAttribute(
                    "starScale",
                    new e.Float32BufferAttribute(d, 1),
                  ),
                  k.setAttribute(
                    "twinklePhase",
                    new e.Float32BufferAttribute(m, 1),
                  ),
                  k.setAttribute(
                    "twinkleRate",
                    new e.Float32BufferAttribute(S, 1),
                  ));
                let E = w(
                    { ...t, stars: { ...i, intensity: 1.22 * i.intensity } },
                    o,
                    null,
                    0,
                    0.18,
                    2.4,
                    0.5,
                    {
                      acrossScatter: F,
                      clearanceSeed: T,
                      depthScatter: L,
                      scatter: C,
                      seed: D,
                    },
                  ),
                  B = new e.Points(k, E);
                return (
                  (B.frustumCulled = !1),
                  (B.renderOrder = 100),
                  {
                    flareBasePosition: M,
                    flareClearanceSeed: T,
                    flareProgress: 0,
                    flareScatter: C,
                    flareShapeAcrossScatter: F,
                    flareShapeDepthScatter: L,
                    flareShapeSeed: D,
                    geometry: k,
                    material: E,
                    points: B,
                  }
                );
              })(t, o, I);
              (O.add(a.points),
                s &&
                  (z.position.copy(a.flareBasePosition),
                  z.scale.setScalar(1),
                  (z.userData.astraFlareScatter = a.flareScatter),
                  a.points.add(z)),
                (G = a.points),
                V.push(a.geometry, a.material),
                U.push({
                  curve: null,
                  dustMaterial: null,
                  flareAcrossOffset: 0,
                  flareBasePosition: a.flareBasePosition,
                  flareClearanceSeed: a.flareClearanceSeed,
                  flareDepthOffset: 0,
                  flarePathSamples: null,
                  flareProgress: a.flareProgress,
                  flareScatter: a.flareScatter,
                  flareShapeAcrossScatter: a.flareShapeAcrossScatter,
                  flareShapeDepthScatter: a.flareShapeDepthScatter,
                  flareShapeSeed: a.flareShapeSeed,
                  flareSource: s ? z : null,
                  isCore: !0,
                  outwardSpeed: 0,
                  phase: 0,
                  motionOffset: 0,
                  speed: 0,
                  starMaterial: a.material,
                  strong: !0,
                  pathShapeDepth: 0.18,
                  pathShapeDepthPhase: 2.4,
                  pathShapeTravel: 0,
                  travel: 0,
                }));
            }
          }
          let W = !1;
          return {
            coreCluster: G,
            coreSource: z,
            disposables: V,
            group: O,
            orbits: _,
            pathLayers: U,
            secondarySources: N,
            particleCount: X,
            dispose: () => {
              W || ((W = !0), V.forEach((t) => t.dispose()), O.clear());
            },
          };
        },
        "positiveModulo",
        0,
        R,
        "samplePath",
        0,
        function (t, a, r) {
          let o = Math.max(Math.floor(t.length / 4), 1),
            i = e.MathUtils.clamp(a, 0, 1) * (o - 1),
            s = Math.floor(i),
            n = Math.min(s + 1, o - 1),
            l = i - s,
            u = 4 * s,
            c = 4 * n;
          return r.set(
            e.MathUtils.lerp(t[u] ?? 0, t[c] ?? 0, l),
            e.MathUtils.lerp(t[u + 1] ?? 0, t[c + 1] ?? 0, l),
            e.MathUtils.lerp(t[u + 2] ?? 0, t[c + 2] ?? 0, l),
          );
        },
        "samplePathRange",
        0,
        function (t, a, r) {
          let o = Math.max(Math.floor(t.length / 4), 1),
            i =
              4 *
              Math.min(
                Math.floor(e.MathUtils.clamp(a, 0, 0.999999) * o),
                o - 1,
              );
          return r.set(t[i + 2] ?? 0, t[i + 3] ?? 1);
        },
        "sizeFalloff",
        0,
        T,
        "tipFade",
        0,
        C,
      ],
      861045,
    );
  };
