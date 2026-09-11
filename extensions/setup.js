import { lstatSync, mkdirSync, readFileSync, symlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getAgentDir, SettingsManager } from "@earendil-works/pi-coding-agent";

const setters = {
  enableInstallTelemetry: "setEnableInstallTelemetry",
  theme: "setTheme",
  hideThinkingBlock: "setHideThinkingBlock",
};

function packageName(pkg) {
  const source = typeof pkg === "string" ? pkg : pkg?.source;

  if (typeof source !== "string") {
    throw new Error("Invalid package entry in Pi settings. Fix it and retry.");
  }

  if (!source.startsWith("npm:")) {
    return source;
  }

  const versionIndex = source.indexOf("@", "npm:@".length);

  return versionIndex === -1 ? source : source.slice(0, versionIndex);
}

function checkSettingsErrors(settings) {
  const errors = settings.drainErrors();

  if (errors.length) {
    throw new AggregateError(
      errors.map(({ error }) => error),
      "Could not read or save Pi settings. Check settings.json and its permissions, then retry.",
    );
  }
}

async function setup(ctx) {
  const defaultsPath = new URL("../settings.json", import.meta.url);
  const defaults = JSON.parse(readFileSync(defaultsPath, "utf8"));
  const settings = SettingsManager.create(ctx.cwd, getAgentDir(), {
    projectTrusted: false,
  });

  checkSettingsErrors(settings);

  const before = settings.getGlobalSettings();
  const packages = before.packages ?? [];

  if (!Array.isArray(packages)) {
    throw new Error("Pi's packages setting must be a list. Fix it and retry.");
  }

  const installed = new Set(packages.map(packageName));
  const missing = defaults.packages.filter((pkg) => !installed.has(packageName(pkg)));
  const preferences = Object.keys(setters).filter((key) => before[key] !== defaults[key]);
  const promptFiles = [
    { name: "SYSTEM.md", destination: join(getAgentDir(), "SYSTEM.md") },
    { name: "SOUL.md", destination: join(homedir(), ".pi", "agent", "SOUL.md") },
  ];
  const missingPrompts = promptFiles.filter(({ destination }) =>
    !lstatSync(destination, { throwIfNoEntry: false }),
  );

  if (!preferences.length && !missing.length && !missingPrompts.length) {
    ctx.ui.notify("Pumpkin Pi defaults are already applied. Existing prompt files kept.", "info");
    return;
  }

  const preview = [];

  for (const key of preferences) {
    const previous = JSON.stringify(before[key]) ?? "unset";
    const next = JSON.stringify(defaults[key]);

    preview.push(`${key}: ${previous} → ${next}`);
  }

  for (const pkg of missing) {
    preview.push(`Add package: ${pkg}`);
  }

  for (const { name, destination } of missingPrompts) {
    preview.push(`Link ${destination} to Pumpkin Pi's ${name}`);
  }

  preview.push("", "Unrelated settings and existing package versions and filters stay unchanged.");
  preview.push("Existing prompt files stay unchanged. Linked prompts follow package updates.");

  if (missing.length) {
    preview.push("Pi will download missing packages on restart. Extensions run with your permissions.");
  }

  const confirmed = await ctx.ui.confirm("Apply Pumpkin Pi defaults?", preview.join("\n"));

  if (!confirmed) {
    return;
  }

  await settings.reload();
  checkSettingsErrors(settings);

  const current = settings.getGlobalSettings();

  for (const key of [...Object.keys(setters), "packages"]) {
    if (JSON.stringify(current[key]) !== JSON.stringify(before[key])) {
      throw new Error("Pi settings changed during confirmation. Run /pumpkin-setup again to review them.");
    }
  }

  for (const key of preferences) {
    settings[setters[key]](defaults[key]);
  }

  if (missing.length) {
    settings.setPackages([...packages, ...missing]);
  }

  await settings.flush();
  checkSettingsErrors(settings);

  for (const { name, destination } of missingPrompts) {
    mkdirSync(dirname(destination), { recursive: true });

    try {
      symlinkSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), destination, "file");
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
    }
  }

  ctx.ui.notify("Pumpkin Pi defaults saved. Existing prompt files kept. Restart Pi to apply changes. Project overrides still take precedence.", "info");
}

export default function pumpkinPi(pi) {
  pi.registerCommand("pumpkin-setup", {
    description: "Review and apply Pumpkin Pi's preferences, packages, and prompts",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("Run /pumpkin-setup in interactive Pi to review the changes.", "warning");
        return;
      }

      try {
        await setup(ctx);
      } catch (error) {
        ctx.ui.notify(error.message, "error");
      }
    },
  });
}
