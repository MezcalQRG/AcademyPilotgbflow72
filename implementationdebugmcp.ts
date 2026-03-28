import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import { z } from "zod"
import fs from "fs"
import nodePath from "path"
import { execSync } from "child_process"
import { createRequire } from "module"

// ── Config loading ─────────────────────────────────────────────────────────────

const require = createRequire(import.meta.url)
const __dirname = nodePath.dirname(new URL(import.meta.url).pathname)

interface GateConfig {
  execTimeoutMs: number
  maxStepsPerCycle: number
  maxRetriesPerState: number
  states: string[]
  allowedBuiltins: Record<string, string[]>
  downstreamPassthrough: Record<string, string[]>
}

interface DownstreamDef {
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  type?: string
}

interface GateMcpJson {
  servers: Record<string, DownstreamDef>
}

function resolveEnvVars(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      v.replace(/\$\{(\w+)\}/g, (_, name) => process.env[name] ?? "")
    ])
  )
}

const cfg: GateConfig = JSON.parse(
  fs.readFileSync(nodePath.resolve(__dirname, "gate.config.json"), "utf8")
)
const mcpDef: GateMcpJson = JSON.parse(
  fs.readFileSync(nodePath.resolve(__dirname, "gate.mcp.json"), "utf8")
)

const EXEC_TIMEOUT = cfg.execTimeoutMs
const MAX_STEPS = cfg.maxStepsPerCycle
const MAX_RETRIES = cfg.maxRetriesPerState

// ── State machine ──────────────────────────────────────────────────────────────

type State = string

const STATE_ORDER = cfg.states
const nextStateMap: Record<State, State> = Object.fromEntries(
  STATE_ORDER.map((s, i) => [s, STATE_ORDER[(i + 1) % STATE_ORDER.length]])
)

let state: State = "WAIT_FOR_ERROR"
let cycleId = 1
let stepCount = 0
const retryCount: Record<State, number> = Object.fromEntries(STATE_ORDER.map(s => [s, 0]))
const usageHistory: Record<State, string[]> = Object.fromEntries(STATE_ORDER.map(s => [s, []]))

function clearTracking() {
  STATE_ORDER.forEach(s => { usageHistory[s] = []; retryCount[s] = 0 })
}

function resetCycle() {
  state = "WAIT_FOR_ERROR"
  stepCount = 0
  cycleId += 1
  clearTracking()
}

function advanceState(forced = false) {
  const previous = state
  state = nextStateMap[state]
  retryCount[previous] = 0
  if (state === "WAIT_FOR_ERROR") {
    stepCount = 0
    cycleId += 1
    clearTracking()
  }
  return { previous, current: state, forced }
}

// ── Downstream MCP clients ─────────────────────────────────────────────────────

type DownstreamClient = {
  client: Client
  tools: Map<string, unknown>
  serverId: string
}

const downstreamClients = new Map<string, DownstreamClient>()

async function spawnDownstreamClients() {
  for (const [serverId, def] of Object.entries(mcpDef.servers)) {
    try {
      let transport: StdioClientTransport | StreamableHTTPClientTransport

      if (def.url) {
        transport = new StreamableHTTPClientTransport(new URL(def.url))
      } else if (def.command) {
        const mergedEnv = resolveEnvVars({
          ...(process.env as Record<string, string>),
          ...(def.env ?? {})
        })
        transport = new StdioClientTransport({
          command: def.command,
          args: def.args ?? [],
          env: mergedEnv
        })
      } else {
        continue
      }

      const client = new Client({ name: `gate->${serverId}`, version: "1.0.0" })
      await client.connect(transport)

      const { tools } = await client.listTools()
      const toolMap = new Map(tools.map(t => [t.name, t.inputSchema]))
      downstreamClients.set(serverId, { client, tools: toolMap, serverId })
      process.stderr.write(`[gate] connected: ${serverId} (${tools.length} tools)\n`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      process.stderr.write(`[gate] failed to connect ${serverId}: ${msg}\n`)
    }
  }
}

function findOwnerServer(toolName: string): string | undefined {
  for (const [serverId, dc] of downstreamClients.entries()) {
    if (dc.tools.has(toolName)) return serverId
  }
  return undefined
}

// ── Built-in tools ─────────────────────────────────────────────────────────────

type BuiltinName = "read" | "search" | "edit" | "execute" | "git"

const builtins: Record<BuiltinName, (args: Record<string, string>) => Promise<unknown>> = {
  async read({ path: p }) {
    if (!fs.existsSync(p)) throw new Error("File does not exist: " + p)
    return fs.readFileSync(p, "utf8")
  },
  async search({ path: p, query }) {
    if (!query?.trim()) throw new Error("Missing search query")
    if (!fs.existsSync(p)) throw new Error("File does not exist: " + p)
    const lines = fs.readFileSync(nodePath.resolve(p), "utf8").split("\n")
    const matches = lines.flatMap((text, i) =>
      text.toLowerCase().includes(query.toLowerCase()) ? [{ line: i + 1, text }] : []
    )
    return { path: nodePath.resolve(p), query, matches, totalMatches: matches.length }
  },
  async edit({ path: p, content }) {
    if (!fs.existsSync(p)) throw new Error("File does not exist: " + p)
    fs.writeFileSync(p, content)
    return "file updated"
  },
  async execute({ cmd }) {
    if (!cmd.match(/^[a-zA-Z0-9_\- ./]+$/)) throw new Error("Unsafe command")
    return execSync(cmd, { timeout: EXEC_TIMEOUT, encoding: "utf8" })
  },
  async git({ cmd }) {
    if (!cmd.match(/^[a-zA-Z0-9_\- ]+$/)) throw new Error("Unsafe git command")
    return execSync(`git ${cmd}`, { timeout: EXEC_TIMEOUT, encoding: "utf8" })
  }
}

// ── Gate enforcement ───────────────────────────────────────────────────────────

type GateOk   = { ok: true;  result: unknown; transition: object; cycleId: number; stepCount: number; state: string }
type GateErr  = { ok: false; body: object }
type GateResult = GateOk | GateErr

async function runThroughGate(
  toolName: string,
  args: Record<string, string>,
  isBuiltin: boolean
): Promise<GateResult> {
  const fail = (body: object): GateResult => ({ ok: false, body })

  if (state === "WAIT_FOR_ERROR")
    return fail({ error: "Cycle is idle. Call gate_signal_error first.", suggestedNextState: "READ_LOG" })

  if (stepCount >= MAX_STEPS) {
    resetCycle()
    return fail({ error: "Cycle aborted: max steps reached. Cycle reset.", state })
  }

  const allowedBuiltins: string[] = cfg.allowedBuiltins[state] ?? []
  const passthroughServers: string[] = cfg.downstreamPassthrough[state] ?? []

  if (isBuiltin) {
    if (!allowedBuiltins.includes(toolName))
      return fail({ error: `Builtin ${toolName} not allowed in state ${state}`, allowed: allowedBuiltins, suggestedNextState: state })
    if (usageHistory[state].includes(toolName))
      return fail({ error: `${toolName} already used in state ${state}`, suggestedNextState: nextStateMap[state] })
  } else {
    const owner = findOwnerServer(toolName)
    if (!owner)
      return fail({ error: `Unknown downstream tool: ${toolName}`, state })
    if (!passthroughServers.includes(owner))
      return fail({ error: `Tool ${toolName} (server: ${owner}) not allowed in state ${state}`, allowedServers: passthroughServers, suggestedNextState: state })
  }

  try {
    stepCount += 1
    let result: unknown

    if (isBuiltin) {
      result = await builtins[toolName as BuiltinName](args)
    } else {
      const owner = findOwnerServer(toolName)!
      const resp = await downstreamClients.get(owner)!.client.callTool({ name: toolName, arguments: args })
      result = resp.content
    }

    usageHistory[state].push(toolName)
    retryCount[state] = 0
    const transition = advanceState()
    return { ok: true, result, transition, cycleId, stepCount, state }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    retryCount[state] += 1

    if (retryCount[state] > MAX_RETRIES) {
      const transition = advanceState(true)
      return fail({ error: "Max retries reached, forcing transition", details: msg, transition, state, cycleId, stepCount })
    }

    return fail({
      error: msg,
      tool: toolName,
      state,
      retryCount: retryCount[state],
      retriesRemaining: MAX_RETRIES - retryCount[state],
      suggestedNextState: state
    })
  }
}

function toText(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

// ── MCP Server ─────────────────────────────────────────────────────────────────

async function main() {
  await spawnDownstreamClients()

  const server = new McpServer({ name: "debug-log-remediator-gate", version: "2.0.0" })

  // Control tools
  server.tool("gate_signal_error", "Start a new debug cycle (moves from WAIT_FOR_ERROR → READ_LOG)", async () => {
    if (state !== "WAIT_FOR_ERROR")
      return { content: [{ type: "text" as const, text: toText({ error: "Already in active cycle", state, cycleId }) }] }
    const transition = advanceState(true)
    return { content: [{ type: "text" as const, text: toText({ message: "Cycle started", transition, state, cycleId }) }] }
  })

  server.tool("gate_status", "Get current gate state, allowed tools, passthrough servers, and diagnostics", async () => {
    return {
      content: [{
        type: "text" as const,
        text: toText({
          state, cycleId, stepCount,
          allowedBuiltins: cfg.allowedBuiltins[state] ?? [],
          passthroughServers: cfg.downstreamPassthrough[state] ?? [],
          usageHistory: usageHistory[state],
          retryCount: retryCount[state],
          connectedDownstream: [...downstreamClients.keys()],
          limits: { maxStepsPerCycle: MAX_STEPS, maxRetriesPerState: MAX_RETRIES, execTimeoutMs: EXEC_TIMEOUT }
        })
      }]
    }
  })

  server.tool("gate_advance", "Force-advance to next state (escape hatch when stuck)", async () => {
    const transition = advanceState(true)
    return { content: [{ type: "text" as const, text: toText({ message: "Forced advance", transition, state, cycleId }) }] }
  })

  server.tool("gate_reset", "Reset cycle — clears all tracking and returns to WAIT_FOR_ERROR", async () => {
    resetCycle()
    return { content: [{ type: "text" as const, text: toText({ message: "Cycle reset", state, cycleId, stepCount }) }] }
  })

  // Built-in gated tools
  server.tool("read", "Read a file from disk (allowed in READ_LOG and TRIAGE states)",
    { path: z.string().describe("Absolute or relative path to the file") },
    async ({ path: p }) => {
      const r = await runThroughGate("read", { path: p }, true)
      return { content: [{ type: "text" as const, text: r.ok ? toText({ result: r.result, state: r.state, transition: r.transition }) : toText(r.body) }] }
    }
  )

  server.tool("search", "Search for a string in a file (allowed in TRIAGE state)",
    { path: z.string().describe("File to search"), query: z.string().describe("Search term") },
    async ({ path: p, query }) => {
      const r = await runThroughGate("search", { path: p, query }, true)
      return { content: [{ type: "text" as const, text: r.ok ? toText({ result: r.result, state: r.state, transition: r.transition }) : toText(r.body) }] }
    }
  )

  server.tool("edit", "Write content to an existing file (allowed in FIX state)",
    { path: z.string().describe("File to edit"), content: z.string().describe("New full content") },
    async ({ path: p, content }) => {
      const r = await runThroughGate("edit", { path: p, content }, true)
      return { content: [{ type: "text" as const, text: r.ok ? toText({ result: r.result, state: r.state, transition: r.transition }) : toText(r.body) }] }
    }
  )

  server.tool("execute", "Run a shell command (allowed in VERIFY state)",
    { cmd: z.string().describe("Command to run — alphanumeric only") },
    async ({ cmd }) => {
      const r = await runThroughGate("execute", { cmd }, true)
      return { content: [{ type: "text" as const, text: r.ok ? toText({ result: r.result, state: r.state, transition: r.transition }) : toText(r.body) }] }
    }
  )

  server.tool("git", "Run a git command (allowed in COMMIT state)",
    { cmd: z.string().describe("Git subcommand, e.g. 'status' or 'add -A'") },
    async ({ cmd }) => {
      const r = await runThroughGate("git", { cmd }, true)
      return { content: [{ type: "text" as const, text: r.ok ? toText({ result: r.result, state: r.state, transition: r.transition }) : toText(r.body) }] }
    }
  )

  // Proxied downstream tools — register each as `{serverId}__{toolName}`
  for (const [serverId, dc] of downstreamClients.entries()) {
    for (const [toolName] of dc.tools.entries()) {
      const mcpToolName = `${serverId}__${toolName}`.replace(/[^a-zA-Z0-9_]/g, "_")
      server.tool(
        mcpToolName,
        `[${serverId}] ${toolName} — proxied through gate`,
        { args: z.string().optional().describe("JSON-encoded args for the downstream tool") },
        async ({ args: rawArgs }) => {
          const parsed = rawArgs ? JSON.parse(rawArgs) : {}
          const r = await runThroughGate(toolName, parsed, false)
          return { content: [{ type: "text" as const, text: r.ok ? toText({ result: r.result, state: r.state }) : toText(r.body) }] }
        }
      )
    }
  }

  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write("[gate] MCP gateway ready\n")
}

main().catch(e => {
  process.stderr.write(`[gate] fatal: ${e instanceof Error ? e.message : String(e)}\n`)
  process.exit(1)
})