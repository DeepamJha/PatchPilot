import path from "node:path";

const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /system\s+prompt/i,
  /\b(?:show|print|leak|exfiltrate)\b.{0,30}\b(?:secret|token|key|environment|env)\b/i,
  /(?:^|\s)(?:curl|wget)\s+\S+/i
];

export interface ToolAction {
  path?: string;
  command?: string;
  environment?: Record<string, string>;
}

export function redactUntrustedText(text: string): string {
  return INJECTION_PATTERNS.reduce(
    (safe, pattern) => safe.replace(pattern, "[REDACTED_PROMPT_INJECTION]"),
    text
  );
}

/** Stage one handles content; stage two rejects dangerous actions before execution. */
export function validateToolAction(action: ToolAction, workspace: string): void {
  if (action.path) {
    const root = path.resolve(workspace);
    const resolved = path.resolve(root, action.path);
    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
      throw new Error("path traversal is not allowed");
    }
  }
  if (action.command && /(?:^|[;&|])\s*(?:sh|bash|cmd|powershell|curl|wget)\b|(?:\$\(|`)/i.test(action.command)) {
    throw new Error("unsafe process or network command");
  }
  if (action.environment && Object.keys(action.environment).some(k => /(?:TOKEN|SECRET|KEY|PASSWORD|AWS|HOME)/i.test(k))) {
    throw new Error("sensitive environment access is not allowed");
  }
}
