// backend/utils/trace.ts

import { randomUUID } from "crypto";

export function getTraceId(request: Request): string {
  return (
    request.headers.get("x-sls-trace-id") ??
    randomUUID()
  );
}

export function logTrace(
  traceId: string,
  message: string,
  data?: unknown
) {
  console.log(
    `[TraceID:${traceId}] ${message}`,
    data ?? ""
  );
}
