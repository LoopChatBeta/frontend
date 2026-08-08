// LocalSandbox.ts — local mock implementation
// Simulates FC Sandbox hibernation using in-memory state
// Replace with AlibabaSandbox.ts for production

import type { SandboxService, SandboxState } from "./SandboxService";

// In-memory store for sandbox states
const sandboxStore = new Map<string, SandboxState>();

export class LocalSandbox implements SandboxService {
  async create(patientId: string, traceId: string): Promise<SandboxState> {
    const sandboxId = `local-sbx-${Date.now()}`;

    const state: SandboxState = {
      sandboxId,
      patientId,
      traceId,
      status: "RUNNING",
      checkpoint: {},
      createdAt: new Date(),
    };

    sandboxStore.set(sandboxId, state);
    console.log(`[TraceID: ${traceId}] [LocalSandbox] Created: ${sandboxId} for patient: ${patientId}`);

    return state;
  }

  async pause(
    sandboxId: string,
    checkpoint: Record<string, unknown>
  ): Promise<SandboxState> {
    const state = sandboxStore.get(sandboxId);

    if (!state) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }

    // Save checkpoint and hibernate
    state.status = "HIBERNATING";
    state.checkpoint = checkpoint;
    sandboxStore.set(sandboxId, state);

    console.log(`[LocalSandbox] Hibernating: ${sandboxId}`);
    console.log(`[LocalSandbox] Checkpoint saved:`, checkpoint);

    // Simulate hibernation delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return state;
  }

  async resume(sandboxId: string): Promise<SandboxState> {
    const state = sandboxStore.get(sandboxId);

    if (!state) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }

    // Restore from checkpoint
    state.status = "RESUMED";
    sandboxStore.set(sandboxId, state);

    console.log(`[LocalSandbox] Resumed: ${sandboxId}`);
    console.log(`[LocalSandbox] Restored checkpoint:`, state.checkpoint);

    // Simulate wake-up delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return state;
  }

  async destroy(sandboxId: string): Promise<void> {
    sandboxStore.delete(sandboxId);
    console.log(`[LocalSandbox] Destroyed: ${sandboxId}`);
  }
}
