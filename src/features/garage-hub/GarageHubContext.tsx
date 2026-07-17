"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type GarageTab =
  | "overview"
  | "vehicles"
  | "builds"
  | "gallery"
  | "journal";

export type VehicleEditorMode = "closed" | "new" | string;

type GarageHubContextValue = {
  tab: GarageTab;
  setTab: (tab: GarageTab) => void;
  editor: VehicleEditorMode;
  openEditor: (mode: VehicleEditorMode) => void;
  closeEditor: () => void;
  dirty: boolean;
  setDirty: (dirty: boolean) => void;
  draftSnapshot: Record<string, string> | null;
  setDraftSnapshot: (draft: Record<string, string> | null) => void;
};

const GarageHubContext = createContext<GarageHubContextValue | null>(null);

export function tabFromPath(
  pathname: string,
  searchTab?: string | null,
): GarageTab {
  if (
    searchTab === "vehicles" ||
    searchTab === "builds" ||
    searchTab === "gallery" ||
    searchTab === "journal" ||
    searchTab === "overview"
  ) {
    return searchTab;
  }
  if (pathname.startsWith("/garage/vehicles")) return "vehicles";
  if (pathname.startsWith("/garage/builds")) return "builds";
  if (pathname.startsWith("/garage/gallery")) return "gallery";
  if (pathname.startsWith("/garage/journal")) return "journal";
  return "overview";
}

export function hrefForTab(tab: GarageTab, edit?: string | null) {
  const sp = new URLSearchParams();
  if (tab !== "overview") sp.set("tab", tab);
  if (tab === "vehicles" && edit && edit !== "closed") {
    sp.set("edit", edit === "new" ? "new" : edit);
  }
  const qs = sp.toString();
  return qs ? `/garage?${qs}` : "/garage";
}

export function GarageHubProvider({
  children,
  initialTab = "overview",
}: {
  children: ReactNode;
  initialTab?: GarageTab;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTabState] = useState<GarageTab>(initialTab);
  const [editor, setEditor] = useState<VehicleEditorMode>(() => {
    const edit = searchParams.get("edit");
    return edit || "closed";
  });
  const [dirty, setDirty] = useState(false);
  const [draftSnapshot, setDraftSnapshot] = useState<Record<
    string,
    string
  > | null>(null);

  useEffect(() => {
    const nextTab = tabFromPath(pathname, searchParams.get("tab"));
    setTabState(nextTab);
    if (nextTab === "vehicles") {
      const edit = searchParams.get("edit");
      if (edit) setEditor(edit);
      // Keep in-memory editor when returning without ?edit — draft preservation
    } else if (searchParams.get("edit")) {
      // Ignore edit param on other tabs
    }
  }, [pathname, searchParams]);

  const setTab = useCallback(
    (next: GarageTab) => {
      if (dirty && tab === "vehicles" && editor !== "closed") {
        const leave = window.confirm(
          "You have unsaved vehicle changes. Switch sections anyway? Your draft stays in this session.",
        );
        if (!leave) return;
      }
      setTabState(next);
      const keepEdit =
        editor !== "closed" && next === "vehicles"
          ? editor === "new"
            ? "new"
            : editor
          : null;
      router.replace(hrefForTab(next, keepEdit), { scroll: false });
    },
    [dirty, editor, router, tab],
  );

  const openEditor = useCallback(
    (mode: VehicleEditorMode) => {
      setEditor(mode);
      setTabState("vehicles");
      router.replace(
        hrefForTab("vehicles", mode === "closed" ? null : mode === "new" ? "new" : mode),
        { scroll: false },
      );
    },
    [router],
  );

  const closeEditor = useCallback(() => {
    setEditor("closed");
    setDirty(false);
    setDraftSnapshot(null);
    router.replace(hrefForTab("vehicles"), { scroll: false });
  }, [router]);

  const value = useMemo(
    () => ({
      tab,
      setTab,
      editor,
      openEditor,
      closeEditor,
      dirty,
      setDirty,
      draftSnapshot,
      setDraftSnapshot,
    }),
    [tab, setTab, editor, openEditor, closeEditor, dirty, draftSnapshot],
  );

  return (
    <GarageHubContext.Provider value={value}>{children}</GarageHubContext.Provider>
  );
}

export function useGarageHub() {
  const ctx = useContext(GarageHubContext);
  if (!ctx) {
    throw new Error("useGarageHub must be used within GarageHubProvider");
  }
  return ctx;
}

export function useGarageHubOptional() {
  return useContext(GarageHubContext);
}
