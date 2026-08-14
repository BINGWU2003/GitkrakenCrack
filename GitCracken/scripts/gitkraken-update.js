#!/usr/bin/env node

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const HOST = "release.gitkraken.com";
const START_MARKER = "# GitCracken: disable GitKraken auto update - start";
const END_MARKER = "# GitCracken: disable GitKraken auto update - end";

function defaultHostsPath() {
  if (process.platform === "win32") {
    const systemRoot = process.env.SystemRoot || process.env.WINDIR;
    if (!systemRoot) {
      throw new Error("无法确定 Windows 系统目录（SystemRoot/WINDIR）。");
    }
    return path.join(systemRoot, "System32", "drivers", "etc", "hosts");
  }

  return "/etc/hosts";
}

function defaultUpdaterPath() {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    throw new Error("无法确定 GitKraken 更新器路径（LOCALAPPDATA）。");
  }

  return path.join(localAppData, "gitkraken", "Update.exe");
}

function parseArgs(argv) {
  let action = "disable";
  let hostsPath;
  let updaterPath;
  let skipExecutionBlock = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "disable" || argument === "enable") {
      action = argument;
    } else if (argument === "--hosts") {
      hostsPath = argv[index + 1];
      index += 1;
      if (!hostsPath) {
        throw new Error("--hosts 后需要指定文件路径。");
      }
    } else if (argument === "--updater") {
      updaterPath = argv[index + 1];
      index += 1;
      if (!updaterPath) {
        throw new Error("--updater 后需要指定文件路径。");
      }
    } else if (argument === "--skip-execution-block") {
      skipExecutionBlock = true;
    } else if (argument === "-h" || argument === "--help") {
      return { help: true };
    } else {
      throw new Error(`未知参数：${argument}`);
    }
  }

  return {
    action,
    hostsPath: hostsPath || defaultHostsPath(),
    updaterPath,
    skipExecutionBlock
  };
}

function currentUserSid() {
  const result = spawnSync(
    "whoami.exe",
    ["/user", "/fo", "csv", "/nh"],
    { encoding: "utf8", windowsHide: true }
  );

  if (result.error) {
    throw result.error;
  }

  const match = `${result.stdout || ""}`.match(/S-\d+(?:-\d+)+/i);
  if (result.status !== 0 || !match) {
    throw new Error("无法确定当前 Windows 用户 SID。");
  }

  return match[0];
}

function runIcacls(args) {
  const result = spawnSync("icacls.exe", args, {
    encoding: "utf8",
    windowsHide: true
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const detail = `${result.stderr || result.stdout || ""}`.trim();
    throw new Error(
      `配置 GitKraken 更新器执行权限失败${detail ? `：${detail}` : "。"}`
    );
  }
}

function removeUpdaterExecutionBlock(updaterPath) {
  if (!fs.existsSync(updaterPath)) {
    return;
  }

  runIcacls([updaterPath, "/remove:d", `*${currentUserSid()}`]);
}

function disableUpdaterExecution(updaterPath) {
  if (!fs.existsSync(updaterPath)) {
    throw new Error(`找不到 GitKraken 更新器：${updaterPath}`);
  }

  const trustee = `*${currentUserSid()}`;
  runIcacls([updaterPath, "/remove:d", trustee]);
  runIcacls([updaterPath, "/deny", `${trustee}:(X)`]);
}

function configureUpdaterExecution(action, updaterPath) {
  if (process.platform !== "win32") {
    return;
  }

  const resolvedUpdaterPath = updaterPath || defaultUpdaterPath();
  if (action === "enable") {
    removeUpdaterExecutionBlock(resolvedUpdaterPath);
    return;
  }

  disableUpdaterExecution(resolvedUpdaterPath);
}

function stripManagedBlock(content) {
  const escapedStart = START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedEnd = END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockPattern = new RegExp(
    `(?:\\r?\\n)?${escapedStart}\\r?\\n[\\s\\S]*?${escapedEnd}(?:\\r?\\n)?`,
    "g"
  );

  return content.replace(blockPattern, "\n");
}

function hasConflictingEntry(content) {
  return content.split(/\r?\n/).some(line => {
    const activePart = line.split("#", 1)[0].trim();
    if (!activePart) {
      return false;
    }

    const fields = activePart.split(/\s+/);
    const address = fields.shift();
    return (
      fields.includes(HOST) &&
      address !== "127.0.0.1" &&
      address !== "0.0.0.0" &&
      address !== "::1"
    );
  });
}

function detectEol(content) {
  if (content.includes("\r\n")) {
    return "\r\n";
  }
  if (content.includes("\n")) {
    return "\n";
  }
  return os.EOL;
}

function disableUpdate(content) {
  const cleanContent = stripManagedBlock(content).trimEnd();
  if (hasConflictingEntry(cleanContent)) {
    throw new Error(
      `hosts 文件中已存在 ${HOST} 的非屏蔽映射，请先手动处理该条目。`
    );
  }

  const eol = detectEol(content);
  const block = [
    START_MARKER,
    `127.0.0.1 ${HOST}`,
    `::1 ${HOST}`,
    END_MARKER
  ].join(eol);

  return `${cleanContent}${cleanContent ? eol + eol : ""}${block}${eol}`;
}

function enableUpdate(content) {
  const eol = detectEol(content);
  const cleanContent = stripManagedBlock(content).trimEnd();
  return `${cleanContent}${cleanContent ? eol : ""}`;
}

function printHelp() {
  console.log(
    "用法：node scripts/gitkraken-update.js <disable|enable> [--hosts <path>] [--updater <path>] [--skip-execution-block]"
  );
  console.log("  disable          屏蔽 GitKraken 自动更新（默认）");
  console.log("  enable           移除本脚本添加的屏蔽配置");
  console.log("  --updater        指定 Windows GitKraken Update.exe 路径");
  console.log("  --skip-execution-block  不修改 Windows 更新器执行权限");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const hostsPath = path.resolve(options.hostsPath);
  const originalContent = fs.readFileSync(hostsPath, "utf8");
  const nextContent =
    options.action === "enable"
      ? enableUpdate(originalContent)
      : disableUpdate(originalContent);

  let executionBlockError;
  if (!options.skipExecutionBlock) {
    try {
      configureUpdaterExecution(options.action, options.updaterPath);
      if (process.platform === "win32") {
        console.log(
          `GitKraken 更新器执行权限阻止已${
            options.action === "enable" ? "移除" : "启用"
          }。`
        );
      }
    } catch (error) {
      executionBlockError = error;
    }
  }

  if (nextContent === originalContent) {
    console.log("hosts 文件无需修改。");
  } else {
    fs.writeFileSync(hostsPath, nextContent, "utf8");
    console.log(`已更新 hosts 文件：${hostsPath}`);
  }

  if (executionBlockError) {
    throw executionBlockError;
  }

  console.log(
    `GitKraken 自动更新已${options.action === "enable" ? "恢复" : "关闭"}。`
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    if (error && (error.code === "EACCES" || error.code === "EPERM")) {
      console.error(
        "操作失败：权限不足，请使用管理员/root 权限重新运行命令。"
      );
    } else if (
      process.platform === "win32" &&
      error &&
      /需要提升|elevation|access is denied/i.test(error.message || "")
    ) {
      console.error("操作失败：请在管理员 PowerShell 或终端中重新运行命令。");
    } else {
      console.error(
        `操作失败：${error && error.message ? error.message : error}`
      );
    }
    process.exitCode = 1;
  }
}

module.exports = {
  configureUpdaterExecution,
  disableUpdate,
  disableUpdaterExecution,
  enableUpdate,
  removeUpdaterExecutionBlock
};
