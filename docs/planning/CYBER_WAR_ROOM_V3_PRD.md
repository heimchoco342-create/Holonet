# Holonet Cyber War Room V3: DeepAgents Architecture PRD

## 1. Overview
This document defines the architecture for the **Cyber War Room V3** within Holonet. The goal is to simulate a high-fidelity cyber conflict scenario using a hierarchical multi-agent system.

**Core Philosophy:**
We adopt the **"DeepAgents"** pattern, treating agents not just as prompts, but as compiled state graphs that encapsulate skills, sub-agents, and tools. This allows for recursive composition of intelligence.

## 2. Agent Definitions

### 2.1 The Commander (Top-Level Agent)
*   **Role:** Strategic orchestration. The Commander does not touch keyboards; it issues orders.
*   **Responsibility:** Receives the high-level objective (e.g., "Conduct a stress test on Infrastructure A"), plans the campaign, and delegates execution to Red and Blue teams.
*   **Sub-Agents:** `RedTeam`, `BlueTeam`.
*   **Tools:** `CampaignPlanner`, `StatusDashboard`.

### 2.2 Red Team (Sub-Agent)
*   **Role:** Offensive Operations.
*   **Responsibility:** Execute attacks, probe for weaknesses, and report compromised assets.
*   **Skills (Toolsets):**
    *   `ScanSkill`: Port scanning, vulnerability enumeration.
    *   `AttackSkill`: Exploit delivery, brute force simulation.

### 2.3 Blue Team (Sub-Agent)
*   **Role:** Defensive Operations.
*   **Responsibility:** Monitor system health, detect intrusions, and apply mitigations.
*   **Skills (Toolsets):**
    *   `MonitorSkill`: Log analysis, traffic inspection.
    *   `PatchSkill`: Firewall rule updates, service restarts, patching.

---

## 3. Technical Mapping: DeepAgents -> LangGraph.js

Since Holonet runs on TypeScript/Electron, we map the abstract "DeepAgents" concepts to concrete **LangGraph.js** implementations.

### 3.1 Concept: `create_deep_agent`
In our architecture, an "Agent" is a factory function that returns a compiled `StateGraph`.

**Interface:**
```typescript
type AgentFactory = (config: AgentConfig) => CompiledStateGraph;

interface AgentConfig {
  skills: Skill[];       // Collections of Tools
  subagents?: Agent[];   // Child nodes in the graph
  tools?: Tool[];        // Direct tools
  systemPrompt: string;
}
```

**Implementation Strategy:**
*   **State Schema:** Every agent shares a standard `AgentState` interface (messages, scratchpad, sender).
*   **Graph Construction:**
    *   The `Commander` graph contains nodes for `call_red_team` and `call_blue_team`.
    *   The `RedTeam` and `BlueTeam` are themselves compiled graphs (sub-graphs) or specialized nodes invoked via the Commander's routing logic.
*   **Supervisors:** The Commander acts as a "Supervisor" node, using an LLM to decide which sub-agent to call next based on the conversation history.

### 3.2 Concept: The `Harness` -> `AgentRuntime`
The "Harness" is the runtime environment that bridges the Electron Main Process and the Agent Logic.

**Class: `AgentRuntime` (Electron Main Process)**
*   **Responsibility:**
    *   Initializes the `Commander` graph.
    *   Manages the persistent state (checkpointing) via a local SQLite/JSON database (LangGraph `checkpointer`).
    *   Handles the event stream loop.
    *   **Secure Configuration Loading:** Reads API keys (OpenAI/Anthropic) from secure local storage (configured via UI Settings) and injects them into the agent environment variables at runtime.

**Key Methods:**
*   `initialize(campaignId: string): Promise<void>` - Hydrates the graph.
*   `start(): void` - Kicks off the execution.
*   `streamEvents(): Observable<AgentEvent>` - Emits structured events (e.g., `Log`, `Action`, `ToolOutput`) to the React Renderer.

### 3.3 MCP Tool Integration
Holonet will support the **Model Context Protocol (MCP)** to allow agents to use external tools dynamically.

**Implementation:**
*   **`McpToolWrapper`**: A class that adapts MCP tool definitions (JSON-RPC) into LangChain `Tool` instances.
*   **Dynamic Loading**: The `AgentRuntime` scans for connected MCP servers and registers their tools at runtime.
*   **Security**: Agents only see tools they are authorized to use.

### 3.4 Skill Registry
A central registry manages reusable capabilities, decoupling tool implementation from agent definitions.

**Structure:**
*   **Registry**: A singleton or service that maps skill names (e.g., `"ScanSkill"`) to their concrete tool implementations.
*   **Usage**: `createDeepAgent` accepts an array of strings (`skills: string[]`). The factory looks up the actual tools from the registry during graph construction.
    *   *Example*: `createDeepAgent({ role: "RedTeam", skills: ["ScanSkill", "ExploitSkill"] })`

---

## 4. Execution Flow & Observability

### 4.1 Execution
1.  **User Interaction (Renderer):**
    *   User selects "Scenario: Brute Force Simulation".
    *   User clicks **"Start War"**.

2.  **Harness Initialization (Main):**
    *   `AgentRuntime` instantiates the `Commander` agent.
    *   `Commander` is injected with `RedTeam` and `BlueTeam` definitions.
    *   A new thread/checkpoint is created.

3.  **Agent Loop (LangGraph):**
    *   **Commander** receives user input: "Start simulation."
    *   **Commander** thinks: "I need to start the attack first." -> **Calls `RedTeam`**.
    *   **RedTeam** activates (enters sub-graph).
        *   Executes `ScanSkill` (Nmap simulation).
        *   Returns result: "Port 22 open."
    *   **Commander** receives output.
    *   **Commander** thinks: "Now alert defense." -> **Calls `BlueTeam`**.
    *   **BlueTeam** activates.
        *   Executes `MonitorSkill`.
        *   Detects high traffic.
    *   **Commander** concludes the cycle.

### 4.2 Observability (Trace View)
To debug and monitor agent reasoning, a "Trace View" will be implemented in the UI.

*   **Streaming Pipeline**:
    *   **Agent Thought**: The internal reasoning (Chain-of-Thought) is streamed as it generates.
    *   **Tool Call**: Display which tool (MCP or Local) is called and with what arguments.
    *   **Result**: Show the raw output from the tool.
    *   **Next Thought**: The agent's reaction to the tool output.
*   **UI Representation**: A timeline or tree view showing the execution stack (Commander -> RedTeam -> Tool).

## 5. File Structure Proposal

```text
src/
  agents/
    core/
      createDeepAgent.ts   # The factory pattern
      types.ts
      mcp/                 # NEW: MCP integration
        McpToolWrapper.ts
        McpClient.ts
      registry/            # NEW: Skill Registry
        SkillRegistry.ts
    definitions/
      commander.ts         # Top-level composition
      redTeam.ts           # Red team specific graph
      blueTeam.ts          # Blue team specific graph
    skills/
      attackSkill.ts
      defenseSkill.ts
  runtime/
    AgentRuntime.ts        # The "Harness"
```
