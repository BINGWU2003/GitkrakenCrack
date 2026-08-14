### 免责声明

所有内容资源均来源于网络，仅供交流学习与研究使用，版权归属原版权方所有，版权争议与本人无关，用户本人下载后不能用作商业或非法用途，否则后果均由用户承担责任; 如果您访问和下载此文件，表示您同意只将此软件用于参考、学习而非其他用途，否则一切后果请您自行承担，请于下载后24小时内删除，不允许用于商业用途，否则法律问题自行承担。 如果您喜欢该软件，请支持正版软件，购买注册，得到更好的正版服务。

---

### 准备工作

```bash
npm install -g yarn
```

---

### 软件安装(11.10.0)

1. 下载地址：[11.10.0](https://release.gitkraken.dev/gkd/production/normal/windows/x64/11.10.0/3ARoelkZIW4JGU4MYcwhR3ycacr/GitKrakenSetup.exe?utm_source=chatgpt.com)
2. 安装汉化补丁：[11.10.0 汉化补丁](https://github.com/yk47g/gitkraken-chinese/releases?page=2#release-11.10.0)

注意：安装成功之后会默认打开GitKraken，如果此时不马上关闭，内部会自动更新到最新版本，导致无法破解。最好断网安装，安装完之后马上关闭，不要打开。

---

### 运行脚本

> 此工具 `GNU/Linux` (without `snap`), `Windows`和`macOS` 全平台可用

1.下载脚本，退出软件，执行以下命令

**⚠再次提醒：运行脚本之前先关闭 Gitkraken 软件，Mac平台确保在底部Dock栏中也彻底关闭该软件**

```

git clone https://github.com/mengyilingjian/GitkrakenCrack.git

cd GitkrakenCrack/GitkrakenCrack
yarn install
yarn build
yarn gitcracken patcher
```

2.执行过程&结果

```
D:\files\hjc-code\GitkrakenCrack\GitCracken>yarn gitcracken patcher
yarn run v1.22.22
(node:14704) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized and prone to errors that have security implications. Use the WHATWG URL API instead. CVEs are not issued for `url.parse()` vulnerabilities.
(Use `node --trace-deprecation ...` to show where the warning was created)
$ node dist/bin/gitcracken.js patcher

 ██████╗ ██╗████████╗ ██████╗██████╗  █████╗  ██████╗██╗  ██╗███████╗███╗   ██╗
██╔════╝ ██║╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔════╝████╗  ██║
██║  ███╗██║   ██║   ██║     ██████╔╝███████║██║     █████╔╝ █████╗  ██╔██╗ ██║
██║   ██║██║   ██║   ██║     ██╔══██╗██╔══██║██║     ██╔═██╗ ██╔══╝  ██║╚██╗██║
╚██████╔╝██║   ██║   ╚██████╗██║  ██║██║  ██║╚██████╗██║  ██╗███████╗██║ ╚████║
 ╚═════╝ ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝

• Description: GitKraken utils for non-commercial use
• Version: 8.4.0
• Author: PMExtra, KillWolfVlad
• License: MIT
• Home Page: https://blog.jubeat.net/

==> 📦 Backup C:\Users\LX\AppData\Local\gitkraken\app-11.10.0\resources\app.asar ➔ C:\Users\LX\AppData\Local\gitkraken\app-11.10.0\resources\app.asar.1786673382064.backup
==> 🔓 Unpack C:\Users\LX\AppData\Local\gitkraken\app-11.10.0\resources\app.asar ➔ C:\Users\LX\AppData\Local\gitkraken\app-11.10.0\resources\app
==> 🔨 Patch C:\Users\LX\AppData\Local\gitkraken\app-11.10.0\resources\app with pro features
==> 🔒 Pack C:\Users\LX\AppData\Local\gitkraken\app-11.10.0\resources\app ➔ C:\Users\LX\AppData\Local\gitkraken\app-11.10.0\resources\app.asar
==> 🔥 Remove C:\Users\LX\AppData\Local\gitkraken\app-11.10.0\resources\app
==> 👌 Patching done!
Done in 151.62s.

```

3.关闭&打开自动更新

```
yarn disable-update

yarn enable-update

```

Windows 下会禁止 `%LOCALAPPDATA%\gitkraken\Update.exe` 执行，同时写入
hosts。执行权限限制不依赖代理软件，因此切换 v2ray、Clash 或代理端口也
不会绕过。以上命令需要使用管理员权限运行。

4.重启gitkraken
