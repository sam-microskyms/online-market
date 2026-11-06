const clips = new Map<string, string>();

export function setSessionClip(productId: string, url: string): void {
  const previous = clips.get(productId);
  if (previous && previous !== url) URL.revokeObjectURL(previous);
  clips.set(productId, url);
}

export function getSessionClip(productId: string): string | null {
  return clips.get(productId) ?? null;
}

export function clearSessionClips(): void {
  for (const url of clips.values()) URL.revokeObjectURL(url);
  clips.clear();
}
