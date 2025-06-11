import React, { createContext, useContext, useState } from 'react';
import { IntercomResponse } from '../API/Intercom';

interface DataContextType {
    data: IntercomResponse | null;
    setData: (data: IntercomResponse | null) => void; 
    login: string | null;
    setLogin: (login: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProviderIntercom: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [data, setData] = useState<IntercomResponse | null>(null);
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
