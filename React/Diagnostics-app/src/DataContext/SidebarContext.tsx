import React, { createContext, useContext, useState } from "react";
import { LoginData } from "../API/getSearchLogins";

interface SidebarContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchedLogin: LoginData | undefined;
  setSearchedLogin: React.Dispatch<React.SetStateAction<LoginData | undefined>>;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchedLogin, setSearchedLogin] = useState<LoginData | undefined>(
    undefined
  );

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        setIsSidebarOpen,
        searchedLogin,
        setSearchedLogin,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};
