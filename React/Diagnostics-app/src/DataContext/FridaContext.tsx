import React, { createContext, useContext, useState } from "react";

interface Data {
  id: number;
  name: string;
  description: string;
}

interface SourceLink {
  source: string;
  section: string;
  description: string;
  url?: string;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  links?: SourceLink[];
  timestamp?: Date;
}

type ChatMode = "wiki" | "tariffSearch" | "tariffChat";

interface DataContextType {
  data: Data | null;
  setData: (data: Data | null) => void;
  login: string | null;
  setLogin: (login: string) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  // Режимы чата
  chatMode: ChatMode;
  setChatMode: (mode: ChatMode) => void;
  // История сообщений для каждого режима (только для wiki и tariffChat)
  wikiMessages: Message[];
  setWikiMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  tariffChatMessages: Message[];
  setTariffChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProviderFrida: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<Data | null>(null);
  const [login, setLogin] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Состояние режимов чата
  const [chatMode, setChatMode] = useState<ChatMode>("wiki");
  const [wikiMessages, setWikiMessages] = useState<Message[]>([]);
  const [tariffChatMessages, setTariffChatMessages] = useState<Message[]>([]);

  return (
    <DataContext.Provider
      value={{
        data,
        setData,
        login,
        setLogin,
        messages,
        setMessages,
        chatMode,
        setChatMode,
        wikiMessages,
        setWikiMessages,
        tariffChatMessages,
        setTariffChatMessages,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
};
