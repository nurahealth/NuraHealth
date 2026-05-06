interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
  minChunkSize?: number;
}

export function chunkText(
  text: string,
  { chunkSize = 1000, overlap = 200, minChunkSize = 100 }: ChunkOptions = {}
): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length <= chunkSize) return cleaned.length >= minChunkSize ? [cleaned] : [];

  const chunks: string[] = [];
  let pos = 0;

  while (pos < cleaned.length) {
    const end = Math.min(pos + chunkSize, cleaned.length);
    let chunkEnd = end;

    if (end < cleaned.length) {
      // Prefer paragraph boundary
      const paraBreak = cleaned.lastIndexOf("\n\n", end);
      if (paraBreak > pos + chunkSize * 0.5) {
        chunkEnd = paraBreak + 2;
      } else {
        // Prefer sentence boundary
        const sentenceEnd = cleaned.slice(pos, end).search(/[.!?]\s+[A-Z]/);
        if (sentenceEnd > chunkSize * 0.5) {
          chunkEnd = pos + sentenceEnd + 2;
        } else {
          // Fall back to word boundary
          const wordBreak = cleaned.lastIndexOf(" ", end);
          if (wordBreak > pos + chunkSize * 0.5) {
            chunkEnd = wordBreak + 1;
          }
        }
      }
    }

    const chunk = cleaned.slice(pos, chunkEnd).trim();
    if (chunk.length >= minChunkSize) {
      chunks.push(chunk);
    } else if (chunks.length > 0) {
      // Merge tiny chunk with previous
      chunks[chunks.length - 1] = chunks[chunks.length - 1] + "\n" + chunk;
    }

    pos = Math.max(chunkEnd - overlap, pos + 1);
    if (pos >= cleaned.length) break;
  }

  return chunks;
}
