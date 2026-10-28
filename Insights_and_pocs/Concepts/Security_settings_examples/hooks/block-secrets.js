#!/usr/bin/env node
// PreToolUse hook: blocks Bash/PowerShell commands that touch secret files,
// credential stores or enumerate environment variables.
// Heuristic string matching: it raises the bar, it is not a sandbox.
// Exit code 2 = block (stderr is shown to Claude); exit 0 = allow.

// Fail closed: any unexpected error blocks the command instead of letting it through.
for (const event of ["uncaughtException", "unhandledRejection"]) {
  process.on(event, (err) => {
    process.stderr.write(`Blocked by block-secrets hook: internal error (${err?.message ?? err}).\n`);
    process.exit(2);
  });
}

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let command = "";
  try {
    command = JSON.parse(raw).tool_input?.command ?? "";
  } catch {
    // fail closed: unreadable input must not mean "allowed"
    process.stderr.write("Blocked by block-secrets hook: could not parse hook input.\n");
    process.exit(2);
  }

  // Lowercase and use forward slashes so one pattern covers Windows and POSIX paths.
  const cmd = command.toLowerCase().replace(/\\/g, "/");
  const start = String.raw`(?:^|[\s/"'=:(,;|&<>])`;

  const rules = [
    {
      name: ".env file",
      re: new RegExp(`${start}\\.env(\\.[a-z0-9_.-]+)?(?![\\w-])`, "g"),
      // .env.example is the only allowed variant
      allow: (m) => m.trim().replace(/^[^.]*/, "").endsWith(".env.example"),
    },
    { name: "key/certificate file", re: /\.(pem|key|p12|pfx|pkcs12|jks|ppk|kdbx|crt|cer|tfstate)(?![\w-])/ },
    { name: "private SSH key", re: /id_(rsa|ed25519|ecdsa|dsa)/ },
    {
      name: "credential store",
      re: new RegExp(
        `${start}(~|\\$home|%userprofile%|\\$env:userprofile)?/?\\.(ssh|aws|azure|gnupg|kube)(/|\\s|$|"|')|` +
          `\\.(npmrc|pypirc|netrc|git-credentials)(?![\\w-])|` +
          `\\.docker/config\\.json|\\.config/gh(/|\\s|$)|` +
          `appdata/(roaming|local)/(microsoft/(credentials|vault|protect)|google/chrome|microsoft/edge)|` +
          `\\.claude\\.json|\\.claude/\\.credentials\\.json|\\.credentials\\.json`
      ),
    },
    {
      name: "environment dump",
      re: new RegExp(
        `${start}(printenv|env\\s*(\\||>|$)|set\\s*(\\||>|$))|` +
          `(get-childitem|gci|ls|dir|get-item|gi)\\s+(-path\\s+)?env:|` +
          `getenvironmentvariables|os\\.environ\\s*(\\)|\\||>|$)|` +
          `\\$env:\\w*(key|token|secret|password|passwd|credential)`
      ),
    },
  ];

  // curl may only talk http/https: reject other URL schemes, and scheme-less hosts
  // that curl would guess as another protocol (e.g. ftp.example.com).
  if (/(?:^|[\s;|&(])curl(?:\.exe)?(?=\s|$)/.test(cmd)) {
    const badScheme = [...cmd.matchAll(/(?<![a-z0-9+.-])([a-z][a-z0-9+.-]*):\/\//g)].find(
      (m) => m[1] !== "http" && m[1] !== "https"
    );
    const guessed = cmd.match(
      /(?:^|\s)(?:ftp|ftps|sftp|scp|tftp|smtp|imap|pop3|ldap|dict|telnet|smb|gopher|mqtt|rtsp)\./
    );
    if (badScheme || guessed) {
      const found = (badScheme ? badScheme[0] : guessed[0]).trim();
      process.stderr.write(
        `Blocked by block-secrets hook: curl is limited to http and https (found ${found}).\n`
      );
      process.exit(2);
    }
  }

  // Remote shell/copy tools, matched only where a command starts (so commit messages
  // that merely mention ssh are not blocked).
  const sshTool = cmd.match(
    /(?:^|[;&|(\n]|\s-c\s+["']|\s\/c\s|\bsudo\s|\bxargs\s)\s*(ssh|scp|sftp|sshfs|ssh-add|ssh-keygen|ssh-keyscan|ssh-agent)(?:\.exe)?(?=\s|$|["'])/
  );
  if (sshTool) {
    process.stderr.write(`Blocked by block-secrets hook: ${sshTool[1]} is not allowed.\n`);
    process.exit(2);
  }

  for (const rule of rules) {
    const flags = rule.re.flags.includes("g") ? rule.re.flags : rule.re.flags + "g";
    const re = new RegExp(rule.re.source, flags);
    for (const match of cmd.matchAll(re)) {
      if (rule.allow?.(match[0])) continue;
      process.stderr.write(
        `Blocked by block-secrets hook: command references a protected ${rule.name} (${match[0].trim()}). ` +
          `Do not try to read secrets through the shell; ask the user instead.\n`
      );
      process.exit(2);
    }
  }
  process.exit(0);
});
