# claude-mods

Claude Code 的小插件（mod）合集。

## usage-footer：在界面上看用量

在 Claude Code（桌面 App 和终端都可以）输入框下方的状态行，一直显示订阅账号的用量：

```
用量 5小时 16% · 本周 7% · 4时56分后重置
```

- 显示 5 小时额度和每周额度的已用百分比，以及 5 小时额度的重置倒计时
- 每轮回复后更新数字，倒计时每分钟刷新一次
- 用量到 90% 以上时，前面会加 ⚠
- 只有订阅账号（Pro / Max）有这些额度；用 API Key 的账号不显示

## 安装

在终端版 Claude Code 的输入框里输入：

```
/plugin install usage-footer --marketplace sunwenpng/claude-mods
```

出现添加插件源的提示时按 `y`，然后选择安装范围（推荐 user）。

也可以在命令行里运行：

```
claude plugin marketplace add sunwenpng/claude-mods
claude plugin install usage-footer@wen-local
```

桌面 App 里：点输入框旁边的 +，选择 Plugins，然后 Add marketplace，填 `sunwenpng/claude-mods`，再点 Add plugin。

已经打开的对话需要重启 App，或者运行 `/reload-plugins`，插件才会生效。

## usage-band（旧版）

旧版本：在输入框上方用两行进度条显示用量。安装命令是 `claude plugin install usage-band@wen-local`。
