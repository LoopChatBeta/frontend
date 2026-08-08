import { AlibabaSandbox } from "./AlibabaSandbox";
import { LocalSandbox } from "./LocalSandbox";
import type { SandboxService } from "./SandboxService";

const provider = (process.env.SANDBOX_PROVIDER ?? "alibaba").toLowerCase();

export function getSandboxService(): SandboxService {
  if (provider === "local") {
    return new LocalSandbox();
  }

  return new AlibabaSandbox();
}
