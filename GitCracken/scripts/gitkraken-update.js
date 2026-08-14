#!/usr/bin/env node

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

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

function parseArgs(argv) {
  let action = "disable";
  let hostsPath;

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
    } else if (argument === "-h" || argument === "--help") {
      return { help: true };
    } else {
      throw new Error(`未知参数：${argument}`);
    }
  }

  return { action, hostsPath: hostsPath || defaultHostsPath() };
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
    "用法：node scripts/gitkraken-update.js <disable|enable> [--hosts <path>]"
  );
  console.log("  disable  屏蔽 GitKraken 自动更新（默认）");
  console.log("  enable   移除本脚本添加的屏蔽配置");
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

  if (nextContent === originalContent) {
    console.log(
      `无需修改：GitKraken 自动更新已${
        options.action === "enable" ? "恢复" : "关闭"
      }。`
    );
    return;
  }

  fs.writeFileSync(hostsPath, nextContent, "utf8");
  console.log(
    `GitKraken 自动更新已${options.action === "enable" ? "恢复" : "关闭"}。`
  );
  console.log(`已更新 hosts 文件：${hostsPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    if (error && (error.code === "EACCES" || error.code === "EPERM")) {
      console.error(
        "修改 hosts 文件失败：权限不足，请使用管理员权限重新运行命令。"
      );
    } else {
      console.error(
        `操作失败：${error && error.message ? error.message : error}`
      );
    }
    process.exitCode = 1;
  }
}

module.exports = { disableUpdate, enableUpdate };
