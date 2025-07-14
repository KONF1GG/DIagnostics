import { useState, useEffect, useRef } from 'react';
import { useDataContext } from '../DataContext/FridaContext';

export interface Message {
  id: number;
  text: string;
  isUser: boolean;
  links?: SourceLink[];
  timestamp?: Date;
}

interface SourceLink {
  source: string;
  section: string;
  description: string;
  url?: string;
}

export const useChatState = () => {
  const { messages, setMessages } = useDataContext();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messageId, setMessageId] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState<string>("mistral-large-latest");
  const [isInlineMode, setIsInlineMode] = useState<boolean>(false);
  const [inlineQuery, setInlineQuery] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    const savedModel = localStorage.getItem("selectedModel");

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
      setMessageId(JSON.parse(savedMessages).length);
    }

    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, [setMessages]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleModal = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setInputText("");
      setIsInlineMode(false);
      setInlineQuery("");
    }
  };

  return {
    // State
    messages,
    setMessages,
    isOpen,
    inputText,
    setInputText,
    isLoading,
    setIsLoading,
    messageId,
    setMessageId,
    selectedModel,
    setSelectedModel,
    isInlineMode,
    setIsInlineMode,
    inlineQuery,
    setInlineQuery,
    // Refs
    messagesEndRef,
    chatContainerRef,
    // Methods
    scrollToBottom,
    toggleModal
  };
};
