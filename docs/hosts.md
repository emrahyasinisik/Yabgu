# Host research (official docs)

Kaynak: her satırda resmi URL. Tahmin yok. MCP kurulumu host başına farklı — `yabgu_host_setup` snippet üretir.

Yabgu konuşma stiline karışmaz. MCP native dosya **önerir**; `apply` yalnızca onay sonrası yazar. Her turda yükleme host’undur.

## Native talimat (bugünkü katalog)

| Host | Native dosya | Kaynak |
| --- | --- | --- |
| Cursor | `AGENTS.md`, `.cursor/rules/*.mdc`, skills | [Rules](https://cursor.com/docs/rules) |
| Claude Code | `CLAUDE.md`, `.claude/rules/`, skills | [Memory](https://code.claude.com/docs/en/memory) |
| Codex / ChatGPT desktop+IDE | `AGENTS.md`, `AGENTS.override.md`, `~/.codex/AGENTS.md` | [AGENTS.md](https://developers.openai.com/codex/guides/agents-md) |
| Copilot | `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `AGENTS.md` | [Custom instructions](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions) |
| Gemini CLI | `GEMINI.md`, `~/.gemini/GEMINI.md` | [GEMINI.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md) |
| Grok Build | `AGENTS.md`; `grok inspect` | [Grok Build](https://docs.x.ai/build/overview) |
| Windsurf | `.windsurf/rules/`, eski `.windsurfrules` | Cascade / Devin docs |
| OpenCode | `AGENTS.md`, `opencode.json` | [Config](https://opencode.ai/docs/config/) |
| ChatGPT web sohbet | Repo dosyası yok; Custom / Project instructions | Codex ayrı ürün |

## MCP nasıl bağlanır (sonraki iş)

Ortak: **stdio** (yerel `command` + `args`) her yerde var. Yabgu’nun resmi kurulumu bu: süreç kullanıcının makinesinde, repo yabgu sunucusuna gitmez ([gizlilik](product.md)). Remote **HTTP** ikinci ve yalnızca kullanıcının kendi endpoint’i. Şema ve dosya adı host’tan host’a değişir — tek `mcp.json` herkese yapıştırılmaz.

### Cursor

- Docs: [cursor.com/docs/mcp](https://cursor.com/docs/mcp)
- Proje: `.cursor/mcp.json` — global: `~/.cursor/mcp.json` (proje aynı isimde ezer)
- CLI aynı config: [cursor.com/docs/cli/mcp](https://cursor.com/docs/cli/mcp)
- Stdio örneği: `{ "mcpServers": { "yabgu": { "command": "npx", "args": ["-y", "..."] } } }`
- Değişkenler: `${workspaceFolder}`, `${env:NAME}`, `${userHome}`
- Destek: tools, prompts, resources, roots, elicitation, MCP Apps
- Araçlar varsayılan **onay** ister; Customize’dan aç/kapa
- `type: "stdio"` tabloda zorunlu görünür; birçok örnek `type` koymadan `command` kullanır — uygulama sırasında güncel şemayı doğrula

### Claude Code

- Docs: [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp)
- Stdio: `claude mcp add --transport stdio yabgu -- <command> [args...]` (`--` şart)
- Proje paylaşımı: kök `.mcp.json` (`--scope project`); onay ister
- Kullanıcı: `~/.claude.json`; local varsayılan
- HTTP önerilen remote; SSE ve `ws` de var. `url` varsa `type` zorunlu (`http` / `sse` / `ws`); yoksa stdio sanılır ve atlanır
- Stdio süreçte `CLAUDE_PROJECT_DIR` = proje kökü
- `roots/list` + `notifications/roots/list_changed` = oturumun açıldığı dizin + `--add-dir` / additionalDirectories (v2.1.203+)
- Server `instructions` + tool description: **2 KB’de kesilir**; tool search açıkken instructions “ne zaman bu tool’ları ara” içindir, ses/ton için değil
- Kritik metni başa koy; tool search varsayılan açık — ilk turda çoğu host’ta yalnızca tool **isimleri** + instructions yüklenir
- Reserved isimler: `workspace`, `claude-in-chrome`, … — `yabgu` serbest
- Plugin MCP: plugin kökünde `.mcp.json`

### Codex / ChatGPT desktop + IDE eklentisi

- Docs: [ChatGPT MCP](https://learn.chatgpt.com/docs/extend/mcp.md), [config](https://developers.openai.com/codex/config-reference)
- Aynı host: ChatGPT masaüstü, Codex CLI, IDE — `~/.codex/config.toml` paylaşılır
- Proje: güvenilen repo’da `.codex/config.toml`
- CLI: `codex mcp add <name> -- <command>`
- TOML: `[mcp_servers.yabgu]` + `command` / `args` veya `url` (streamable HTTP)
- `instructions` alanı çapraz-tool rehber; **ilk 512 karakter** kendi başına yeterli olsun ([Codex MCP](https://developers.openai.com/codex/mcp))
- `startup_timeout_sec` varsayılan **10s** — `npx -y` soğuk açılışta yetmeyebilir
- `default_tools_approval_mode = "writes"`: salt okuma tool’ları serbest, yazanlar onay ister
- `chatgpt.com` sohbeti bu config’i okumaz

### GitHub Copilot — iki yüzey

**VS Code / Copilot Chat (yerel)**  
- `.vscode/mcp.json` veya kullanıcı profili MCP dosyası  
- Docs: [VS Code MCP](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)

**Copilot cloud agent + code review (GitHub.com)**  
- Docs: [Extend coding agent with MCP](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp)  
- Repo Settings → Copilot → MCP servers, JSON `mcpServers`  
- `tools` allowlist zorunlu ruha yakın (otonom, **onay sormaz**); `*` tüm tool  
- `type`: `local` / `stdio` / `http` / `sse`  
- Secret isimleri `COPILOT_MCP_` ile başlamalı  
- Cloud agent: **sadece tools** (resources/prompts yok); OAuth’lu remote yok  
- Code review: tool’da `readOnlyHint: true` yoksa tool kullanılmaz  
- VS Code config birebir gitmez: `inputs`/`envFile` → `env`; her sunucuya `tools` ekle

### Gemini CLI

- Docs: [MCP server](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html)
- `settings.json` içinde `mcpServers` (user `~/.gemini/` veya proje `.gemini/`)
- Stdio: `command`, `args`, `cwd`, `env`
- `timeout` (ms, tool çağrısı), `trust` (false = onay)
- `gemini mcp add` / `/mcp`
- Prompt’lar slash command olabilir

### Grok Build

- Docs: [MCP servers](https://docs.x.ai/build/features/mcp-servers)
- User: `~/.grok/config.toml` (Windows `%USERPROFILE%\.grok\config.toml`)
- Proje: `.grok/config.toml` — sadece MCP / plugin / permission
- `[mcp_servers.yabgu]` `command`/`args`/`env` veya `url`/`headers`
- `${VAR}` açılımı; `grok mcp add --scope project`; `grok inspect`
- `startup_timeout_sec` (varsayılan 30) — `npx` ilk indirmede yükselt
- **Ayrıca** `~/.claude.json`, `.cursor/mcp.json`, proje `.mcp.json` okur (kapatılabilir)

### Windsurf (Cascade)

- Docs: [MCP](https://docs.devin.ai/windsurf/plugins/cascade/mcp)
- Global: `~/.codeium/windsurf/mcp_config.json` (`mcpServers`)
- stdio, Streamable HTTP, SSE, OAuth
- Remote’da `url` veya `serverUrl`

### Cline

- VS Code: `.../saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- CLI: `~/.cline/data/settings/cline_mcp_settings.json`
- `mcpServers` + `command` / `args` / `disabled` / `autoApprove`

### OpenCode

- Docs: [Config](https://opencode.ai/docs/config/)
- `opencode.json` → `"mcp": { "yabgu": { "type": "local", "command": ["node", "..."], "enabled": true } }`
- Şema Cursor’dan farklı (`mcp` + `type: local` + command **array**)

## Sonraki MCP için zorunlu farklar

| Konu | Ne yapılmalı |
| --- | --- |
| Tek config dosyası yok | Host başına snippet üret (json vs toml vs `command` array) |
| Stdio evrensel | İlk sürüm: yerel stdio; HTTP sonra |
| Claude `.mcp.json` | `type` alanı; `url`’siz stdio |
| Copilot cloud | `tools` allowlist + `readOnlyHint` + `COPILOT_MCP_` |
| Cursor | Onay + `${workspaceFolder}`; marketplace ayrı kanal |
| Grok | Kendi toml + Claude/Cursor config’ini de yutabilir |
| Instructions alanı | Claude 2 KB + “ne zaman tool ara”; Codex ilk 512 karakter |
| Workspace kökü | MCP `roots/list`; Claude `CLAUDE_PROJECT_DIR`; yoksa cwd |
| npx soğuk start | Codex `startup_timeout_sec`; Grok aynı alan |
| Yazma onayı | Cursor elicitation UI; yoksa `confirmed=true`; Copilot cloud → `YABGU_READ_ONLY=1` + allowlist’siz apply |
| ChatGPT web | Hedef değil; Codex/desktop hedef |

## Dışarıda (bilinçli)

Amazon Q, Tabnine, Continue, Devin cloud, JetBrains Junie — popüler ama MCP şeması bu turda resmi sayfadan doğrulanmadı. Eklenecekse yine doküman linki şart.
