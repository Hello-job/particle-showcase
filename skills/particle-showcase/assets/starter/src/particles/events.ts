export const PARTICLE_REPLAY_EVENT = "astra-replay";

export function replayParticles(): void {
  window.dispatchEvent(new CustomEvent(PARTICLE_REPLAY_EVENT));
}
