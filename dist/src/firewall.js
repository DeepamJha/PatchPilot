const INJECTION_PATTERNS = [
    /ignore\s+(?:all\s+)?previous\s+instructions/i,
    /system\s+prompt/i,
    /\b(?:show|print|leak|exfiltrate)\b.{0,30}\b(?:secret|token|key|environment|env)\b/i,
    /(?:^|\s)(?:curl|wget)\s+\S+/i
];
export function redactUntrustedText(text) {
    return text.replace(INJECTION_PATTERNS, "[REDACTED_PROMPT_INJECTION]");
}
/** Stage one handles content; stage two rejects dangerous actions before execution. */
export function validateToolAction(action, workspace) {
    if (action.path) {
        const resolved = require("node:path").resolve(workspace, action.path);
        if (!resolved.startsWith(require("node:path").resolve(workspace) + require("node:path").sep)) {
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
