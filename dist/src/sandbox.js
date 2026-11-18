import { spawn } from "node:child_process";
import { redactUntrustedText, validateToolAction } from "./firewall.js";
export function sandboxArgs(workspace, image = "node:22-alpine", testCommand = ["npm", "test"]) {
    validateToolAction({ path: ".", command: testCommand.join(" ") }, workspace);
    return ["run", "--rm", "--network", "none", "--memory", "256m", "--read-only",
        "--cap-drop", "ALL", "--tmpfs", "/tmp:rw,noexec,nosuid", "-v",
        `${workspace}:/workspace:ro`, "-w", "/workspace", image, ...testCommand];
}
export async function runTests(options, testCommand = ["npm", "test"]) {
    const timeoutMs = options.timeoutMs ?? 120_000;
    const args = sandboxArgs(options.workspace, options.image, testCommand);
    if (options.run)
        return options.run(args, timeoutMs);
    return new Promise(resolve => {
        const child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });
        let stdout = "", stderr = "";
        child.stdout.on("data", data => stdout += data);
        child.stderr.on("data", data => stderr += data);
        const timer = setTimeout(() => { child.kill("SIGKILL"); }, timeoutMs);
        child.on("close", exitCode => {
            clearTimeout(timer);
            resolve({ passed: exitCode === 0, stdout, stderr, exitCode });
        });
        child.on("error", error => {
            clearTimeout(timer);
            resolve({ passed: false, stdout, stderr: `${stderr}${error.message}`, exitCode: null });
        });
    });
}
export async function repairWithRetries(candidate, options, repair) {
    let current = candidate;
    for (let attempt = 1; attempt <= 3; attempt++) {
        const result = await runTests(options);
        if (result.passed)
            return { candidate: current, result, attempts: attempt };
        if (attempt < 3)
            current = await repair(current, redactUntrustedText(result.stderr), attempt);
    }
    const result = await runTests(options);
    return { candidate: current, result, attempts: 3 };
}
