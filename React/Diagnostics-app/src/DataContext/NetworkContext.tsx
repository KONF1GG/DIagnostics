import React, { createContext, useContext, useState } from 'react';
import { NetworkData } from '../API/network';

interface DataContextType {
    data: NetworkData | null;
    setData: (data: NetworkData | null) => void; 
    login: string | null;
    setLogin: (login: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProviderNet: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [data, setData] = useState<NetworkData | null>(null);
    const [login, setLogin] = useState<string | null>(null);

    return (
        <DataContext.Provider value={{ data, setData, login, setLogin }}>
            {children}
        </DataContext.Provider>
    );
};

export const useDataContext = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
};
