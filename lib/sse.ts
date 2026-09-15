export type SSEEvent = { event: string; data: string };

/** Decode SSE incrementally, including frames split across network chunks. */
export async function* parseSSE(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<SSEEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let ended = false;
  let line = "";
  let skipLF = false;
  let event = "message";
  let data: string[] = [];

  function consumeLine(): SSEEvent | null {
    const current = line;
    line = "";
    if (current === "") {
      const frame = data.length ? { event, data: data.join("\n") } : null;
      event = "message";
      data = [];
      return frame;
    }
    if (current.startsWith(":")) return null;
    const colon = current.indexOf(":");
    const field = colon < 0 ? current : current.slice(0, colon);
    let value = colon < 0 ? "" : current.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value || "message";
    if (field === "data") data.push(value);
    return null;
  }

  try {
    while (!ended) {
      const result = await reader.read();
      ended = result.done;
      const text = ended ? decoder.decode() : decoder.decode(result.value, { stream: true });
      for (const char of text) {
        if (skipLF) {
          skipLF = false;
          if (char === "\n") continue;
        }
        if (char === "\r" || char === "\n") {
          skipLF = char === "\r";
          const frame = consumeLine();
          if (frame) yield frame;
        } else {
          line += char;
        }
      }
    }
    // Some providers close immediately after the last data line.
    if (line) consumeLine();
    if (data.length) yield { event, data: data.join("\n") };
  } finally {
    try {
      if (!ended) await reader.cancel();
    } catch {
      // A disconnected/errored source may reject cancellation.
    } finally {
      reader.releaseLock();
    }
  }
}
