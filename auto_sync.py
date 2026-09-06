import os
import sys
import time
import subprocess
from datetime import datetime

# Root workspace directory
WORKSPACE_DIR = os.path.dirname(os.path.abspath(__file__))

# Ignore list
IGNORE_PATTERNS = [
    ".git",
    "node_modules",
    "dist",
    "dist-ssr",
    ".vscode",
    ".idea",
    "__pycache__",
    ".env.local",
    "*.log",
    "*.tmp"
]

def run_cmd(cmd, cwd=WORKSPACE_DIR):
    try:
        res = subprocess.run(
            cmd,
            cwd=cwd,
            shell=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        return 1, "", str(e)

def has_git_changes():
    code, out, _ = run_cmd("git status --porcelain")
    if code == 0 and out:
        return True, out
    return False, ""

def push_changes():
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now_str}] 🚀 Detected changes. Staging and committing...")
    
    # Git add
    code, out, err = run_cmd("git add -A")
    if code != 0:
        print(f"[{now_str}] ⚠️ Error during git add: {err}")
        return False
        
    # Check if anything to commit
    has_changes, changes = has_git_changes()
    if not has_changes:
        return True
        
    # Count changed files
    file_count = len(changes.splitlines())
    commit_msg = f"Auto-sync: {now_str} ({file_count} file(s) changed)"
    
    code, out, err = run_cmd(f'git commit -m "{commit_msg}"')
    if code != 0:
        print(f"[{now_str}] ⚠️ Commit failed: {err}")
        return False
        
    print(f"[{now_str}] 💾 Committed: {commit_msg}")
    
    # Git push
    print(f"[{now_str}] ⬆️ Pushing to GitHub (origin/main)...")
    code, out, err = run_cmd("git push origin main")
    if code == 0:
        print(f"[{now_str}] ✅ Successfully pushed to GitHub!")
        return True
    else:
        print(f"[{now_str}] ⚠️ Push failed or remote not configured yet: {err or out}")
        return False

def main():
    print("==================================================")
    print(" 🔄 Auto GitHub Synchronizer Active")
    print(f" 📁 Watching: {WORKSPACE_DIR}")
    print(" ⏱️  Auto-sync interval: 5 seconds")
    print("==================================================")
    
    # Ensure git is in PATH
    os.environ["PATH"] = (
        f"{os.path.expandvars('%LOCALAPPDATA%')}\\Programs\\Git\\cmd;"
        f"{os.path.expandvars('%LOCALAPPDATA%')}\\Programs\\gh\\bin;"
        f"{os.environ.get('PATH', '')}"
    )

    last_sync = time.time()
    
    while True:
        try:
            has_changes, _ = has_git_changes()
            if has_changes:
                # Wait 4 seconds debounce in case multiple files are being saved
                time.sleep(4)
                push_changes()
                last_sync = time.time()
            time.sleep(3)
        except KeyboardInterrupt:
            print("\n👋 Auto GitHub Synchronizer stopped.")
            break
        except Exception as e:
            print(f"Error in sync loop: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
