# PatchPilot

PatchPilot is a small, security-first foundation for an autonomous bug-fixing
agent. It provides:

- TypeScript Compiler AST declaration chunks and a hybrid retrieval interface
  for a `pgvector` rank and a PostgreSQL `tsvector` rank, fused with RRF
  (`k = 60`).
- A Docker test runner with no network, a 256 MB memory limit, dropped Linux
  capabilities, read-only workspace, and SIGKILL timeout. Failed diagnostics
  can be fed through at most three repair attempts.
- A two-stage prompt-injection firewall: untrusted issue text is redacted,
  then paths, shell/network commands, and sensitive environment access are
  rejected before sandbox execution.

## Development

```sh
npm install
npm test
```

The public API is exported from `src/index.ts`. The database integration is
deliberately an adapter (`HybridStore`), so applications can provide
parameterized pgvector/tsvector queries without putting credentials or SQL
construction in the agent.

The sandbox requires Docker. It must not be replaced with a host-shell
executor: commands are passed as an argument array and the container is
network-disabled and capability-restricted.
