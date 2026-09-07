import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Snapshot-based undo/redo.
 * Watches a serializable snapshot; debounced pushes create history entries.
 * `apply` restores a snapshot back into your state setters.
 */
export function useUndoRedo<T>(
  snapshot: T,
  apply: (s: T) => void,
  opts: { delay?: number; limit?: number; enabled?: boolean; describe?: (prev: T, next: T) => string } = {}
) {
  const { delay = 450, limit = 60, enabled = true, describe } = opts;
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const current = useRef<string>(JSON.stringify(snapshot));
  const pendingBase = useRef<string | null>(null);
  const debounceTimer = useRef<any>(null);
  const log = useRef<{ label: string; at: number }[]>([]);
  const applying = useRef(false);
  const [, force] = useState(0);
  const sync = () => force(n => n + 1);

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  useEffect(() => {
    if (!enabled) return;
    const next = JSON.stringify(snapshot);
    if (applying.current) {
      applying.current = false;
      current.current = next;
      pendingBase.current = null;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      return;
    }
    if (next === current.current) return;

    if (pendingBase.current === null) {
      pendingBase.current = current.current;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      if (pendingBase.current !== null && pendingBase.current !== next) {
        past.current.push(pendingBase.current);
        if (past.current.length > limit) past.current.shift();
        const label = describe
          ? describe(JSON.parse(pendingBase.current) as T, JSON.parse(next) as T)
          : "Edit";
        log.current = [{ label, at: Date.now() }, ...log.current].slice(0, 20);
        future.current = [];
        current.current = next;
        pendingBase.current = null;
        sync();
      }
    }, delay);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [snapshot, delay, limit, enabled, describe]);

  const undo = useCallback(() => {
    // 1. Flush any active editable element
    if (typeof document !== "undefined" && document.activeElement) {
      const active = document.activeElement as HTMLElement;
      if (active && (active.isContentEditable || active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        active.blur();
      }
    }

    // 2. If there is a debounced edit sequence currently pending, revert to its base state
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    const currentStr = JSON.stringify(snapshotRef.current);
    if (pendingBase.current !== null && pendingBase.current !== currentStr) {
      const target = pendingBase.current;
      future.current.push(currentStr);
      current.current = target;
      pendingBase.current = null;
      applying.current = true;
      log.current = [{ label: "Undo", at: Date.now() }, ...log.current].slice(0, 20);
      apply(JSON.parse(target) as T);
      sync();
      return;
    }

    // 3. Otherwise pop from past history stack
    if (!past.current.length) return;
    const prev = past.current.pop()!;
    future.current.push(current.current);
    current.current = prev;
    pendingBase.current = null;
    applying.current = true;
    log.current = [{ label: "Undo", at: Date.now() }, ...log.current].slice(0, 20);
    apply(JSON.parse(prev) as T);
    sync();
  }, [apply]);

  const redo = useCallback(() => {
    if (typeof document !== "undefined" && document.activeElement) {
      const active = document.activeElement as HTMLElement;
      if (active && (active.isContentEditable || active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        active.blur();
      }
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    pendingBase.current = null;

    if (!future.current.length) return;
    const next = future.current.pop()!;
    past.current.push(current.current);
    current.current = next;
    applying.current = true;
    log.current = [{ label: "Redo", at: Date.now() }, ...log.current].slice(0, 20);
    apply(JSON.parse(next) as T);
    sync();
  }, [apply]);

  const reset = useCallback((s: T) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    pendingBase.current = null;
    past.current = [];
    future.current = [];
    current.current = JSON.stringify(s);
    log.current = [];
    sync();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, enabled]);

  return {
    undo, redo, reset,
    canUndo: past.current.length > 0 || (pendingBase.current !== null && pendingBase.current !== JSON.stringify(snapshot)),
    canRedo: future.current.length > 0,
    undoCount: past.current.length + (pendingBase.current !== null ? 1 : 0),
    redoCount: future.current.length,
    history: log.current,
  };
}

