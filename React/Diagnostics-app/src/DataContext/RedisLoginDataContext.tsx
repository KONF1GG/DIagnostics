import React, { createContext, useContext, useState } from "react";

interface DataContextProps {
  loginData: any | null;
  setLoginData: React.Dispatch<React.SetStateAction<any | null>>; 
}

const RedisDataContext = createContext<DataContextProps | undefined>(undefined);

export const RedisDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [loginData, setLoginData] = useState<any | null>(null); 

  return (
    <RedisDataContext.Provider value={{ loginData, setLoginData }}>
      {" "}
      {/* Обновлено здесь */}
      {children}
    </RedisDataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(RedisDataContext);
  if (!context) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
};
