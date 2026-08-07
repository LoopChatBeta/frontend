// SandboxService.ts — abstract interface
// All sandbox implementations must follow this contract

export interface SandboxState {
  sandboxId: string;
  patientId: string;
  status: "RUNNING" | "HIBERNATING" | "RESUMED" | "DESTROYED";
  checkpoint: Record<string, unknown>;
  createdAt: Date;
}

export interface SandboxService {
  create(patientId: string): Promise<SandboxState>;
  pause(sandboxId: string, checkpoint: Record<string, unknown>): Promise<SandboxState>;
  resume(sandboxId: string): Promise<SandboxState>;
  destroy(sandboxId: string): Promise<void>;
}