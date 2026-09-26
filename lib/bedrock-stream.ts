/** Amazon event-stream framing: https://smithy.io/2.0/aws/amazon-eventstream.html */
const MAX_FRAME_BYTES = 1024 * 1024;
const decoder = new TextDecoder('utf-8', { fatal: true });
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) value = (value >>> 8) ^ crcTable[(value ^ byte) & 255];
  return (value ^ 0xffffffff) >>> 0;
}

function malformed(): never {
  throw new Error('The AI stream was malformed or incomplete.');
}

function headers(bytes: Uint8Array): Map<string, unknown> {
  const result = new Map<string, unknown>();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  const take = (length: number) => {
    if (offset + length > bytes.length) malformed();
    const value = bytes.subarray(offset, offset + length);
    offset += length;
    return value;
  };
  while (offset < bytes.length) {
    const nameLength = take(1)[0];
    if (!nameLength) malformed();
    const name = decoder.decode(take(nameLength));
    if (result.has(name)) malformed();
    const type = take(1)[0];
    let value: unknown;
    if (type === 0 || type === 1) value = type === 0;
    else if (type === 6 || type === 7) {
      take(2);
      const length = view.getUint16(offset - 2);
      const data = take(length);
      value = type === 7 ? decoder.decode(data) : data;
    } else {
      const lengths: Record<number, number> = { 2: 1, 3: 2, 4: 4, 5: 8, 8: 8, 9: 16 };
      const length = lengths[type];
      if (!length) malformed();
      value = take(length);
    }
    result.set(name, value);
  }
  return result;
}

export async function* parseBedrockStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<{ type: string; data: unknown }> {
  const reader = stream.getReader();
  // Copy into one bounded frame buffer rather than repeatedly concatenating split chunks.
  let frame: Uint8Array = new Uint8Array(12);
  let filled = 0;
  let finished = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        finished = true;
        if (filled) malformed();
        return;
      }
      let offset = 0;
      while (offset < value.length) {
        const count = Math.min(frame.length - filled, value.length - offset);
        frame.set(value.subarray(offset, offset + count), filled);
        filled += count;
        offset += count;
        if (filled !== frame.length) continue;
        const view = new DataView(frame.buffer, frame.byteOffset, frame.byteLength);
        if (frame.length === 12) {
          const totalLength = view.getUint32(0);
          const headerLength = view.getUint32(4);
          if (crc32(frame.subarray(0, 8)) !== view.getUint32(8)
            || totalLength < 16 || totalLength > MAX_FRAME_BYTES
            || headerLength > totalLength - 16) malformed();
          const expanded = new Uint8Array(totalLength);
          expanded.set(frame);
          frame = expanded;
          continue;
        }
        if (crc32(frame.subarray(0, -4)) !== view.getUint32(frame.length - 4)) malformed();
        let metadata: Map<string, unknown>;
        let data: unknown;
        try {
          const headerEnd = 12 + view.getUint32(4);
          metadata = headers(frame.subarray(12, headerEnd));
          const payload = decoder.decode(frame.subarray(headerEnd, -4));
          data = payload ? JSON.parse(payload) : {};
        } catch { malformed(); }
        const messageType = metadata.get(':message-type');
        if (messageType === 'error' || messageType === 'exception') {
          throw new Error('The AI stream reported an error.');
        }
        const type = metadata.get(':event-type');
        if (messageType !== 'event' || typeof type !== 'string' || !type) malformed();
        frame = new Uint8Array(12);
        filled = 0;
        yield { type, data };
      }
    }
  } finally {
    try {
      if (!finished) await reader.cancel();
    } catch { /* Preserve the original parsing or consumer error. */ }
    reader.releaseLock();
  }
}
