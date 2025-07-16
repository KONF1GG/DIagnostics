import { useState, KeyboardEvent, useRef, useEffect } from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import "./ChatModal.css";
import "../../CSS/Chat.css";
import { useDataContext } from "../../../DataContext/FridaContext";
import { GetFridaAnswer } from "../../../API/frida";
import { useRedisAddressSearch } from "../../../hooks/useRedisAddressSearch";
import { RedisAddressModel } from "../../../API/redisAddresses";
import { GetRedisTariff } from "../../../API/redisTariff";

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

const ChatIcon = () => {
  const {
    chatMode,
    setChatMode,
    wikiMessages,
    setWikiMessages,
    tariffChatMessages,
    setTariffChatMessages,
  } = useDataContext();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messageId, setMessageId] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState<string>(
    "mistral-large-latest"
  );
  const [isInlineMode, setIsInlineMode] = useState<boolean>(false);
  const [inlineQuery, setInlineQuery] = useState<string>("");
  const [selectedAddress, setSelectedAddress] =
    useState<RedisAddressModel | null>(null);
  const [addressTariffs, setAddressTariffs] = useState<any | null>(null);
  const [isLoadingTariffs, setIsLoadingTariffs] = useState<boolean>(false);
  const [tariffsError, setTariffsError] = useState<string | null>(null);
  const [copyNotification, setCopyNotification] = useState<string>("");
  const [showTerritoryResetDialog, setShowTerritoryResetDialog] =
    useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Получаем текущие сообщения в зависимости от режима
  const getCurrentMessages = (): Message[] => {
    switch (chatMode) {
      case "wiki":
        return wikiMessages;
      case "tariffSearch":
        return []; // Для режима поиска нет истории
      case "tariffChat":
        return tariffChatMessages;
      default:
        return wikiMessages;
    }
  };

  // Устанавливаем сообщения для текущего режима
  const setCurrentMessages = (
    messages: Message[] | ((prev: Message[]) => Message[])
  ): void => {
    switch (chatMode) {
      case "wiki":
        setWikiMessages(messages);
        break;
      case "tariffSearch":
        // Для режима поиска не сохраняем историю
        break;
      case "tariffChat":
        setTariffChatMessages(messages);
        break;
    }
  };

  const messages = getCurrentMessages();

  const {
    results: addressResults,
    error: addressError,
    clearResults,
  } = useRedisAddressSearch(inlineQuery, isInlineMode);

  useEffect(() => {
    const savedModel = localStorage.getItem("selectedModel");
    const savedAddress = localStorage.getItem("selectedAddress");
    const savedTariffs = localStorage.getItem("addressTariffs");

    // Загружаем сообщения для каждого режима
    const savedWikiMessages = localStorage.getItem("wikiMessages");
    const savedTariffChatMessages = localStorage.getItem("tariffChatMessages");
    const savedChatMode = localStorage.getItem("chatMode");

    if (savedWikiMessages) {
      setWikiMessages(JSON.parse(savedWikiMessages));
    }

    if (savedTariffChatMessages) {
      setTariffChatMessages(JSON.parse(savedTariffChatMessages));
    }

    if (savedModel) {
      setSelectedModel(savedModel);
    }

    if (savedAddress) {
      const address = JSON.parse(savedAddress);
      setSelectedAddress(address);

      // Если есть адрес, то всегда должен быть режим tariffChat
      setChatMode("tariffChat");
    } else {
      // Если нет адреса, устанавливаем режим по умолчанию
      if (savedChatMode) {
        setChatMode(savedChatMode as any);
      } else {
        setChatMode("wiki");
      }
    }

    if (savedTariffs) {
      setAddressTariffs(JSON.parse(savedTariffs));
    }
  }, [setWikiMessages, setTariffChatMessages, setChatMode]);

  // Сохраняем сообщения в localStorage для каждого режима
  useEffect(() => {
    localStorage.setItem("wikiMessages", JSON.stringify(wikiMessages));
  }, [wikiMessages]);

  useEffect(() => {
    localStorage.setItem(
      "tariffChatMessages",
      JSON.stringify(tariffChatMessages)
    );
  }, [tariffChatMessages]);

  useEffect(() => {
    localStorage.setItem("chatMode", chatMode);
  }, [chatMode]);

  useEffect(() => {
    localStorage.setItem("selectedModel", selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    if (selectedAddress) {
      localStorage.setItem("selectedAddress", JSON.stringify(selectedAddress));
    }
  }, [selectedAddress]);

  useEffect(() => {
    if (addressTariffs) {
      localStorage.setItem("addressTariffs", JSON.stringify(addressTariffs));
    }
  }, [addressTariffs]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Автопрокрутка к результатам поиска
  useEffect(() => {
    if (addressResults.length > 0 && chatMode === "tariffSearch") {
      setTimeout(() => {
        scrollToSearchResults();
      }, 100); // Небольшая задержка для рендеринга
    }
  }, [addressResults, chatMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSearchResults = () => {
    searchResultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCopyCommand = async (command: string): Promise<void> => {
    // Вместо копирования вставляем команду в поле ввода
    setInputText(command);
  };

  const handleClearChat = (): void => {
    // Если идет загрузка, отменяем запрос
    if (isLoading) {
      setIsLoading(false);
      setCopyNotification("Запрос отменен ❌");
      setTimeout(() => setCopyNotification(""), 2000);
      return;
    }

    setCurrentMessages([]);
    setMessageId(0);
    // Удаляем из localStorage только для текущего режима
    switch (chatMode) {
      case "wiki":
        localStorage.removeItem("wikiMessages");
        break;
      case "tariffSearch":
        // Для режима поиска нет истории для очистки
        break;
      case "tariffChat":
        localStorage.removeItem("tariffChatMessages");
        break;
    }
    setCopyNotification("Чат очищен ✨");
    setTimeout(() => setCopyNotification(""), 2000);
  };

  const toggleInlineMode = (): void => {
    // Если территория уже выбрана и мы включаем режим поиска, спрашиваем подтверждение
    if (!isInlineMode && selectedAddress) {
      setShowTerritoryResetDialog(true);
      return;
    }

    const newInlineMode = !isInlineMode;
    setIsInlineMode(newInlineMode);

    if (newInlineMode) {
      // Переходим в режим поиска тарифов
      setChatMode("tariffSearch");
      setInlineQuery("");
      clearResults();
    } else {
      // Возвращаемся в режим Wiki
      setChatMode("wiki");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setInputText(value);

    // Не включаем инлайн-режим при вводе /tariff
    if (isInlineMode) {
      setInlineQuery(value);
    }
  };

  const handleAddressSelect = async (
    address: RedisAddressModel
  ): Promise<void> => {
    setSelectedAddress(address);
    setIsInlineMode(false);
    setInlineQuery("");
    clearResults();

    // Очищаем поле ввода от поискового запроса
    setInputText("");

    // Сбрасываем историю чата при смене территории
    setTariffChatMessages([]);
    localStorage.removeItem("tariffChatMessages");

    // Переходим в режим чата с тарифами
    setChatMode("tariffChat");

    // Загружаем тарифы для выбранного адреса
    setIsLoadingTariffs(true);
    setTariffsError(null);

    try {
      const tariffsResult = await GetRedisTariff(address.territory_id);

      if (tariffsResult && "detail" in tariffsResult) {
        setTariffsError("Не удалось загрузить тарифы");
        setAddressTariffs(null);
      } else if (tariffsResult?.tariffs) {
        setAddressTariffs(tariffsResult.tariffs);
        setTariffsError(null);
      } else {
        setTariffsError("Тарифы для данного адреса не найдены");
        setAddressTariffs(null);
      }
    } catch (error) {
      console.error("Ошибка загрузки тарифов:", error);
      setTariffsError("Не удалось загрузить тарифы");
      setAddressTariffs(null);
    } finally {
      setIsLoadingTariffs(false);
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!inputText.trim()) return;

    // Если отправили ровно "/tariff", включаем инлайн-режим
    if (inputText.trim() === "/tariff") {
      // Если территория уже выбрана, спрашиваем подтверждение
      if (selectedAddress) {
        setShowTerritoryResetDialog(true);
        setInputText("");
        return;
      }

      setIsInlineMode(true);
      setChatMode("tariffSearch");
      setInlineQuery("");
      setInputText("");
      return;
    }

    // Если инлайн-режим был активен, выключаем его при отправке обычного сообщения
    if (isInlineMode) {
      setIsInlineMode(false);
      setInlineQuery("");
      clearResults();
      setChatMode("wiki");
    }

    const userMessage: Message = {
      id: messageId,
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setCurrentMessages((prev: Message[]) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    setMessageId((prev) => prev + 1);

    const messageCount = messages.length / 2;
    const historyCount = messageCount < 3 ? messageCount : 3;

    try {
      // Отправляем запрос с тарифами как отдельным параметром
      const apiResult = await GetFridaAnswer(
        inputText,
        historyCount,
        selectedModel,
        addressTariffs
      );

      if (!apiResult || "detail" in apiResult) {
        const errorMsg: Message = {
          id: messageId + 1,
          text: "Извините, не удалось получить ответ. Попробуйте переформулировать вопрос или повторите запрос позже.",
          isUser: false,
          timestamp: new Date(),
        };
        setCurrentMessages((prev: Message[]) => [...prev, errorMsg]);
      } else {
        const botMsg: Message = {
          id: messageId + 1,
          text: apiResult.response,
          isUser: false,
          timestamp: new Date(),
        };
        setCurrentMessages((prev: Message[]) => [...prev, botMsg]);
      }
    } catch (err) {
      setCurrentMessages((prev: Message[]) => [
        ...prev,
        {
          id: messageId + 1,
          text: "Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setMessageId((prev) => prev + 1);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatMode === "tariffSearch") {
        // В режиме поиска тарифов можем только выбрать адрес, если есть результаты
        if (addressResults.length > 0) {
          handleAddressSelect(addressResults[0]);
        }
        return;
      }

      if (isInlineMode && addressResults.length > 0) {
        // Выбираем первый результат
        handleAddressSelect(addressResults[0]);
      } else {
        handleSendMessage();
      }
    } else if (e.key === "Escape" && isInlineMode) {
      setIsInlineMode(false);
      setInlineQuery("");
      clearResults();
      setChatMode("wiki");
    }
  };

  const handleTerritoryReset = (): void => {
    // Сбрасываем территорию и включаем режим поиска
    setSelectedAddress(null);
    setAddressTariffs(null);
    setTariffsError(null);
    setIsInlineMode(true);
    setChatMode("tariffSearch");
    setInlineQuery("");
    clearResults();
    setShowTerritoryResetDialog(false);

    // Очищаем localStorage
    localStorage.removeItem("selectedAddress");
    localStorage.removeItem("addressTariffs");
  };

  const handleTerritoryKeep = (): void => {
    // Остаемся с текущей территорией
    setShowTerritoryResetDialog(false);
  };

  const toggleModal = (): void => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setInputText("");
      setIsInlineMode(false);
      setInlineQuery("");
      clearResults();
    }
  };

  return (
    <>
      <button
        className="chat-icon"
        onClick={toggleModal}
        aria-label="Открыть чат"
      >
        <div className="chat-icon-content">
          <img src="/frida.webp" alt="Chat Icon" className="chat-sticker" />
          <span className="chat-label">Фрида</span>
        </div>
      </button>

      <div
        className={`chat-modal-overlay ${isOpen ? "open" : ""}`}
        onClick={toggleModal}
      >
        <div
          className={`chat-modal ${isOpen ? "open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <ChatHeader
            selectedAddress={selectedAddress}
            isLoadingTariffs={isLoadingTariffs}
            tariffsError={tariffsError}
            chatMode={chatMode}
            onClearAddress={() => {
              setSelectedAddress(null);
              setAddressTariffs(null);
              setTariffsError(null);
              setChatMode("wiki");
              setIsInlineMode(false);
              setInlineQuery("");
              localStorage.removeItem("selectedAddress");
              localStorage.removeItem("addressTariffs");
            }}
            onClearChat={handleClearChat}
            onClose={toggleModal}
          />
          <div className="chat-content" ref={chatContainerRef}>
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              selectedAddress={selectedAddress}
              addressTariffs={addressTariffs}
              isLoadingTariffs={isLoadingTariffs}
              tariffsError={tariffsError}
              inlineQuery={inlineQuery}
              addressResults={addressResults}
              addressError={addressError}
              chatMode={chatMode}
              onAddressSelect={handleAddressSelect}
              onCopyCommand={handleCopyCommand}
              messagesEndRef={messagesEndRef}
              searchResultsRef={searchResultsRef}
            />
            <ChatInput
              inputText={inputText}
              isLoading={isLoading}
              isInlineMode={isInlineMode}
              chatMode={chatMode}
              onInputChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onSend={handleSendMessage}
              onToggleInline={toggleInlineMode}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />
          </div>
        </div>
      </div>
      {copyNotification && (
        <div className="copy-notification">{copyNotification}</div>
      )}

      {/* Диалог подтверждения сброса территории */}
      {showTerritoryResetDialog && (
        <div className="dialog-overlay" onClick={handleTerritoryKeep}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Смена территории</h3>
            </div>
            <div className="dialog-body">
              <p>
                У вас уже выбрана территория{" "}
                <strong>{selectedAddress?.territory_name}</strong>.
              </p>
              <p>Хотите сбросить текущую территорию и начать поиск новой?</p>
            </div>
            <div className="dialog-actions">
              <button
                className="dialog-button dialog-button-secondary"
                onClick={handleTerritoryKeep}
              >
                Остаться
              </button>
              <button
                className="dialog-button dialog-button-primary"
                onClick={handleTerritoryReset}
              >
                Сбросить и искать новую
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatIcon;
