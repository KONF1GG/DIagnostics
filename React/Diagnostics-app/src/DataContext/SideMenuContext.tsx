import React, { createContext, useContext, useState } from "react";

interface SidebarContextType {
  openSections: { [key: number]: boolean };
  toggleSection: (index: number) => void;
}

const SideMenuContext = createContext<SidebarContextType | undefined>(
  undefined
);

export const SideMenuProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>(
    {}
  );

  const toggleSection = (index: number) => {
    setOpenSections((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  return (
    <SideMenuContext.Provider value={{ openSections, toggleSection }}>
      {children}
    </SideMenuContext.Provider>
  );
};

export const useSidebarContext = (): SidebarContextType => {
  const context = useContext(SideMenuContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
};
