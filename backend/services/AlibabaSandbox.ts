// AlibabaSandbox.ts — Alibaba Cloud FC Sandbox implementation
// Uses E2B SDK pointed at Alibaba Cloud FC endpoint
// Only this file knows about Alibaba Cloud specifics

import { Sandbox } from "@e2b/code-interpreter";
import type { SandboxService, SandboxState } from "./SandboxService";

// In-memory store for sandbox states
const sandboxStore = new Map<string, SandboxState>();
const e2bSandboxes = new Map<string, Sandbox>();

export class AlibabaSandbox implements SandboxService {
  async create(patientId: string, traceId: string): Promise<SandboxState> {
    console.log(`[AlibabaSandbox] Creating sandbox for patient: ${patientId}`);

    const sbx = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY,
      domain: process.env.E2B_DOMAIN,
      timeoutMs: 300_000,
    });

    const state: SandboxState = {
      sandboxId: sbx.sandboxId,
      patientId,
      traceId,
      status: "RUNNING",
      checkpoint: {},
      createdAt: new Date(),
    };

    // Store both state and E2B sandbox reference
    sandboxStore.set(sbx.sandboxId, state);
    e2bSandboxes.set(sbx.sandboxId, sbx);

    console.log(`[AlibabaSandbox] Created: ${sbx.sandboxId}`);
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

    // Save checkpoint before hibernating
    state.status = "HIBERNATING";
    state.checkpoint = checkpoint;
    sandboxStore.set(sandboxId, state);

    // Pause the real FC Sandbox — billing drops to $0
    const sbx = e2bSandboxes.get(sandboxId);
    if (sbx) {
      await sbx.pause();
      console.log(`[AlibabaSandbox] Hibernating: ${sandboxId} — billing paused`);
    }

    return state;
  }

  async resume(sandboxId: string): Promise<SandboxState> {
    const state = sandboxStore.get(sandboxId);

    if (!state) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }

    // Resume the real FC Sandbox — connect auto-resumes paused sandboxes
    const resumedSbx = await Sandbox.connect(sandboxId, {
    apiKey: process.env.E2B_API_KEY,
    domain: process.env.E2B_DOMAIN,
    requestTimeoutMs: 300_000,
    });

    // Update state
    state.status = "RESUMED";
    sandboxStore.set(sandboxId, state);
    e2bSandboxes.set(sandboxId, resumedSbx);

    console.log(`[AlibabaSandbox] Resumed: ${sandboxId}`);
    console.log(`[AlibabaSandbox] Checkpoint restored:`, state.checkpoint);

    return state;
  }

  async destroy(sandboxId: string): Promise<void> {
    const sbx = e2bSandboxes.get(sandboxId);
    if (sbx) {
      await sbx.kill();
      e2bSandboxes.delete(sandboxId);
    }
    sandboxStore.delete(sandboxId);
    console.log(`[AlibabaSandbox] Destroyed: ${sandboxId}`);
  }
}
