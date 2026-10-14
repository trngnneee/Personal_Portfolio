// Incremental parser for text/event-stream. Chunk boundaries can fall anywhere (mid-line, mid-UTF-8 sequence
// is handled by TextDecoder in the caller). Comments (": ping") are dropped.
export interface SseEvent {
  event: string;
  data: string;
}

export function createSseParser() {
  let buf = "";
  let carry = ""; // a trailing "\r" may be the first half of "\r\n" in the next chunk
  return {
    push(chunk: string): SseEvent[] {
      let s = carry + chunk;
      carry = s.endsWith("\r") ? "\r" : "";
      if (carry) s = s.slice(0, -1);
      buf += s.replace(/\r\n?/g, "\n");
      const out: SseEvent[] = [];
      let sep: number;
      while ((sep = buf.indexOf("\n\n")) !== -1) {
        const block = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        let event = "message";
        const data: string[] = [];
        for (const line of block.split("\n")) {
          if (line.startsWith(":")) continue;
          const i = line.indexOf(":");
          const field = i === -1 ? line : line.slice(0, i);
          const value = i === -1 ? "" : line.slice(i + 1).replace(/^ /, "");
          if (field === "event") event = value;
          else if (field === "data") data.push(value);
        }
        if (data.length > 0) out.push({ event, data: data.join("\n") });
      }
      return out;
    },
  };
}
