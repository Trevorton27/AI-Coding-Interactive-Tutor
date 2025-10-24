// apps/web/app/lib/sse.ts
export function sseHeaders() {
  return new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
  });
}
export function writeSSE(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  event: string,
  data: any
) {
  const enc = new TextEncoder();
  const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return writer.write(enc.encode(chunk));
}
