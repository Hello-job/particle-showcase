/** Original RendererProfile mapping from the public site's module 215453. */
export function createAstraProfile(tier = 3, reducedMotion = false) {
  const level = [0, 1, 2, 3].includes(tier) ? tier : 1;
  const available = level > 0;
  return {
    tier: level,
    canUseWebGL: () => available,
    getAntialias: () => false,
    getDpr: () => [[1, 1], [1, 1], [1, 1.5], [1, 2]][level],
    getMaxParticleCount: () => [0, 12000, 28000, 40000][level],
    getMaxShaderSamples: () => [0, 4, 8, 16][level],
    getPostprocessing: () => {
      const mode = ['none', 'none', 'selective', 'full'][level];
      return reducedMotion && mode === 'full' ? 'selective' : mode;
    },
    getShaderQuality: () => ['none', 'low', 'medium', 'high'][level],
    getShaderQualityLevel: () => level,
    shouldUseContinuousMotion: () => available && !reducedMotion,
  };
}
