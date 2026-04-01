import { createContext, useContext, useState, ReactNode } from "react";

type ViewMode = "owner" | "applier";

interface ViewModeContextValue {
  viewMode: ViewMode;
  isApplierView: boolean;
  toggleViewMode: () => void;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextValue>({
  viewMode: "owner",
  isApplierView: false,
  toggleViewMode: () => {},
  setViewMode: () => {},
});

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("owner");

  const toggleViewMode = () =>
    setViewMode((prev) => (prev === "owner" ? "applier" : "owner"));

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        isApplierView: viewMode === "applier",
        toggleViewMode,
        setViewMode,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  return useContext(ViewModeContext);
}
