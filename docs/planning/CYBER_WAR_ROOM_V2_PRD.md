# Product Requirements Document (V2): Cyber War Room - LangGraph Integration

**Status:** Draft
**Owner:** Product Engineering
**Date:** 2026-02-27
**Version:** 2.0.0-alpha

---

## 1. Executive Summary

The current iteration of the Cyber War Room relies on deterministic, linear scripts to simulate cyber conflict. While functional for basic scenarios, this "script-kiddie" approach lacks the adaptive reasoning required to simulate realistic, high-fidelity threat environments.

**Cyber War Room V2** introduces **LangGraph.js** to transform our agents from rigid automata into dynamic, reasoning entities. By implementing stateful graphs, Red and Blue teams will no longer just follow instructions—they will observe, plan, act, and react to changing battlefield conditions in real-time. This shift moves us from *simulation* to *emulation*.

## 2. Why LangGraph? The Strategic Pivot

### Current State (V1)
- **Linear Execution:** Scripts run A -> B -> C. If B fails, the script errors out or blindly continues.
- **Stateless:** Agents have no memory of previous attempts or the evolving network topology.
- **Brittle:** Adding new tactics requires rewriting the entire control flow.

### Future State (V2 with LangGraph)
- **Cyclic Reasoning:** Agents operate in loops (Observe -> Reason -> Act). They can retry failed actions with different parameters or pivot strategies entirely.
- **State Management:** A persistent `State` object tracks the "world view" (e.g., discovered vulnerabilities, patched servers, remaining budget/resources).
- **Dynamic Tool Usage:** Instead of hardcoded function calls, LLMs select tools based on the current context, allowing for emergent behavior.
- **Human-in-the-Loop (HITL):** LangGraph's checkpointing allows us to pause execution for human authorization before critical actions (e.g., "Launch DDoS" or "Shutdown Core Switch").

## 3. Architecture

To maintain performance and security, the LangGraph runtime will be hosted within the **Electron Main Process**.

- **Main Process (Node.js):**
  - Hosts the `LangGraph` runtime.
  - Manages API keys and secure environment variables.
  - Executes sensitive system tools (nmap, netstat) via Node's `child_process`.
  - Exposes graph events (node start, tool call, output) to the Renderer via IPC.

- **Renderer Process (React/UI):**
  - Visualizes the graph state in real-time.
  - Displays the "Thought Chain" (streaming tokens from the LLM).
  - Provides controls for HITL interactions (Approve/Reject actions).

- **Communication:**
  - `ipcMain`/`ipcRenderer` channels will stream partial JSON chunks to update the UI without blocking the reasoning loop.

## 4. Agent Design

We will implement two distinct graph architectures representing the opposing forces.

### 🔴 Red Team Graph (The Attacker)
**Goal:** Compromise target flags/assets.
**Loop:** `Recon -> Plan -> Attack -> Evaluate -> Loop`

1. **Recon Node:** Scans the network, identifies open ports and services. Updates the `TargetList` in state.
2. **Plan Node:** Analyzes `TargetList` to select the most vulnerable target. Formulates an attack vector (e.g., SQLi vs. Brute Force).
3. **Attack Node:** Executes the selected tool.
4. **Evaluate Node:** Checks the tool output.
   - *Success?* Mark target as PWNED, move to next target or exfiltrate.
   - *Failure?* Update state with "Defense Detected," return to Plan Node to try a different vector.

### 🔵 Blue Team Graph (The Defender)
**Goal:** Maintain service availability and patch vulnerabilities.
**Loop:** `Monitor -> Analyze -> Patch -> Verify -> Loop`

1. **Monitor Node:** Polls system logs and network traffic. Detects anomalies (high CPU, unknown IPs).
2. **Analyze Node:** Correlates anomalies to identify the attack type.
3. **Patch Node:** Selects defensive tools (Firewall rule, Service restart, Patch application).
4. **Verify Node:** Checks if the anomaly has ceased.
   - *Success?* Log incident, return to Monitor.
   - *Failure?* Escalate response (e.g., quarantine subnet), return to Analyze.

## 5. Tool Definitions (Abstract)

Tools will be defined using `zod` schemas for strict typing and validation.

### Shared / System Tools
- `CheckConnectivity`: Pings a target IP to verify reachability.
- `ReadSystemLogs`: Retrieves the last N lines of system logs.

### Red Team Tools
- `ScanNetwork(subnet: string)`: Returns list of active IPs and open ports.
- `ExploitService(ip: string, port: number, exploit_type: string)`: Attempts to compromise a specific service.
- `DeployPayload(target_id: string)`: Installs a persistence mechanism.

### Blue Team Tools
- `ApplyFirewallRule(ip: string, action: "ALLOW" | "DENY")`: Modifies iptables/firewall settings.
- `RestartService(service_name: string)`: Restarts a compromised or failing service.
- `RotateCredentials(user_id: string)`: Forces a password reset for a compromised account.

## 6. Tech Stack

- **Core Framework:** `@langchain/langgraph`
- **LLM Integration:** `@langchain/openai` (GPT-4o or similar high-reasoning model recommended)
- **Schema Validation:** `zod` (for structured tool inputs/outputs)
- **State Persistence:** `In-Memory` (Phase 1), `SQLite` (Phase 2 for session resumption)
- **Runtime:** Node.js (Electron Main Process)

---

**Next Steps:**
1. Initialize the `Holonet/src/agents` directory.
2. Implement the base `State` interface using TypeScript.
3. Prototype the Red Team `Recon` node.
