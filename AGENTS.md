# 🤖 AGENTS.md — Codex Agent Instructions for `Omnissiah`

This file provides OpenAI Codex (or any AI agent) with canonical instructions for generating and modifying code within the `Omnissiah` framework. It ensures consistent structure, safe patterns, and proper adherence to shared tool architecture.

---

## 📐 What Is This?

* A declarative instruction set for Codex, treated like a dev-readable spec.
* Detected automatically by Codex agents if placed in the root folder of your project (or subfolders for overrides).
* Guides Codex in **how to behave** across all levels of generation—naming, wrapping, structuring, validating, and testing.

---

## 📁 Project Layout & File Roles

| File            | Purpose                                          |
| --------------- | ------------------------------------------------ |
| `Setup.gs`      | Adds tool menus, resolves entry runners          |
| `Runner.gs`     | Wraps execution in locks, logger UI, memory init |
| `Memory.gs`     | `toolContext` state: config, memory, snapshot    |
| `Logger.gs`     | Buffered phase logging for UI                    |
| `Ui.gs`         | Sidebar + modal + toast builder                  |
| `Files.gs`      | File IO and Drive handling                       |
| `Export.gs`     | CSV, JSON, Excel download functions              |
| `Config.gs`     | Loads + saves user config                        |
| `Validation.gs` | Validates `toolSpec` and config structure        |
| `Registry.gs`   | Tracks usage history and tool run logs           |
| `Testing.gs`    | Phase isolation, dry-run support                 |
| `Errors.gs`     | Fatal + recoverable error handling               |

All shared functionality is exposed under:

```js
  globalThis.Defaults
```

---

## 🧠 Golden Rule

> **"Read once → Normalize → Operate in memory → Write once"**

Applied across all pipelines. No tool may operate on raw sheet or Drive data outside of its intake phase.

---

## 🧠 Runtime Conventions

### ✅ Pipeline Execution

* Entry point must be wrapped by: `runWithDefaults_<mainFn>()`
* Each phase named: `phaseNN_description()`
* Use `logPhaseStart()` → `bufferPhaseLog()` → `flushPhaseLog()` → `logPhaseDone()`
* Use `runWithPools()` if tool uses pooled data (e.g., per-developer)

### ✅ Memory Model

* All working data stored in `globalThis.toolContext.memory`
* Use `takeMemorySnapshot(key)` and `restoreMemorySnapshot(key)` for rollbacks
* Access config through: `globalThis.config`

### ✅ Logging

* Buffered logs only inside pooled phases: `bufferPhaseLog({ step, value })`
* Use `logPhaseUpdate()` in setup/standalone/unpooled contexts
* UI logs shown via `Defaults.Ui.buildLogger()` sidebar

---

## 🛠 Config and Spec Handling

### Tool Config

* All user-editable fields must be declared in `getToolConfigFields()`
* Must save to `PropertiesService.getDocumentProperties()` under `"toolConfig"`
* Sidebar is built using: `Defaults.Ui.buildConfigSidebar()`
* Common fields: `debugMode`, `dataSourceLink`

### Tool Spec

* Must declare `globalThis.toolSpec`
* Validate using `validateToolSpec()` inside debug mode or `runSpecCheck()`

Sample:

```js
  globalThis.toolSpec = {
    toolName: "KPIProcessor",
    phases: {
      entry: "runPipeline",
      structure: ["phase00_scaffold", "phase01_enrich", "phase02_write"]
    },
    globals: {
      memoryKey: globalThis.kpi,
      configKey: globalThis.config,
      logFn: "logPhaseUpdate({ phase, step })",
      snapshot: {
        take: "takeMemorySnapshot(key)",
        restore: "restoreMemorySnapshot(key)"
      },
      flags: {
        debugMode: "isDebugMode()"
      }
    },
    logger: {
      view: "DefaultLogger.html",
      categories: ["info", "warn", "error", "done"]
    },
    goldenRule: "Read once → Normalize → Operate in memory → Write once"
  };
```

---

## 🧪 Testing & Simulation

* Use `Defaults.Testing.runPhaseStandalone(phaseFn)` for testable phases
* Respect `config.dryRun` or debug flag for write guards
* No file renaming or Drive mutations allowed in dry-run mode

---

## 🪟 UI Guidelines

* Sidebar built via `Defaults.Ui.buildConfigSidebar()` and `Defaults.Ui.buildLogger()`
* Use `getUiTheme()` to apply visual theming
* Use `renderModal()` for blocking steps or alerts

---

## 🧾 Naming & Structure

* `phaseNN_label()` = phase function (e.g., `phase01_importData()`)
* Runner function: `runWithDefaults_pipelineFn()`
* Tool root = one of:

  * `runMainPipeline()`
  * `runPipeline()`
  * `runToolFn()`

File naming must follow these conventions:

* Phase: `phaseNN_label.gs`
* Sidebar: `ToolConfig.html`
* Logger: `DefaultLogger.html`

---

## 🧩 File IO Standards

* Input must use: `readLatestDataFile(folderId)`
* Rename with: `markFileAsProcessed(file)`
* Normalize with: `normalize(value, type)`
* Supported import patterns:

  * `importOverwriteSheetData()`
  * `importAppendByWeek()`

---

## 📤 Exports

* Use `Defaults.Export.downloadToolOutput({ type, name, data })`
* Export formats: CSV, Excel, JSON
* Never directly create/export blobs outside of Export module

---

## ❌ Error Handling

* Log via: `Defaults.Errors.handleToolError({ phase, message, fatal })`
* Phase errors should be pushed to: `toolContext.errors[]`
* Display blocking failures with modals in pooled execution

---

## ✅ Pull Request Requirements (if Codex commits)

PRs must:

* Include a meaningful title: `fix: handle missing pool state in phase03`
* Contain testing and validation notes
* Declare affected tool(s) and phases in description

---

## ✅ Summary

✔ Use `Defaults.*` for all shared operations
✔ Wrap entrypoints with `runWithDefaults_*()`
✔ Structure phases clearly, log properly
✔ Load config and memory safely
✔ Validate `toolSpec` on every debug run
✔ Always follow the golden rule:

> **"Read once → Normalize → Operate in memory → Write once"**

