# 🚨 Issue Log: App Crash on Startup (v0.1.0 - v0.1.1)

**Date:** 2026-02-27
**Status:** 🟡 Investigating (K8s Disabled for Isolation)
**Affected Version:** v0.1.0, v0.1.1 (macOS arm64)

---

## 1. Symptoms (증상)
- **Immediate Termination:** The app closes immediately after launching from Spotlight or Finder.
- **No GUI:** No window appears.
- **No Logs:** Even with `ELECTRON_ENABLE_LOGGING=true`, no output is printed to the terminal.
- **System Logs:** OS-level logs (Console.app) likely show a segmentation fault or unhandled exception.

## 2. Root Cause Analysis (Hypothesis)

### A. Native Module Mismatch (Most Likely) 🔴
- **Library:** `@kubernetes/client-node`
- **Reason:** Electron includes its own Node.js runtime (different ABI version). Native modules or libraries with heavy Node.js bindings installed locally via `pnpm` (Node v25) may not be compatible with the Electron runtime (Node v18.x/v20.x bundled inside).
- **Evidence:** The app crashed before the JavaScript `uncaughtException` handler could even catch an error. This usually indicates a low-level (C++/System) crash during module loading.

### B. Packaging Configuration
- **Issue:** Initially, `package.json` -> `files` excluded the `out/` directory.
- **Fix:** Fixed in `v0.1.1`, but the crash persisted. This rules out "missing files" as the *current* cause.

## 3. Actions Taken (Timeline)

### Step 1: Add Visibility (v0.1.1)
- **Action:** Installed `electron-log` and added `dialog.showErrorBox` on global errors.
- **Result:** Failed. App died before these tools could initialize.

### Step 2: Isolation Test (v0.1.2 - Current)
- **Action:** Commented out **ALL** Kubernetes-related imports and initialization logic in `main/index.ts`.
  - `@kubernetes/client-node`
  - `K8sBridge`
  - `K8sLens`
- **Goal:** Determine if the crash is caused by the K8s library or the base Electron setup.

## 4. Next Steps (Plan)

1.  **If v0.1.2 Runs:**
    - The cause is confirmed as `@kubernetes/client-node`.
    - **Fix:** Configure `electron-builder` to automatically run `electron-rebuild` during packaging to compile native modules for the Electron target.

2.  **If v0.1.2 Crashes:**
    - The cause is in the base Electron configuration (e.g., `main` entry point path in `package.json` vs `electron-builder` config).
    - **Fix:** Debug `package.json` entry points and `vite` output structure.
