import { useState, KeyboardEvent, useRef, useEffect } from "react";
import "../../CSS/Chat.css";
import { useDataContext } from "../../../DataContext/FridaContext";
import { GetFridaAnswer } from "../../../API/frida";
import { useAddressSearch } from "../../../hooks/useAddressSearch";
import { AddressResult } from "../../../API/addressSearch";

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
  const { messages, setMessages } = useDataContext();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messageId, setMessageId] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState<string>(
    "mistral-large-latest"
  );
  const [isInlineMode, setIsInlineMode] = useState<boolean>(false);
  const [inlineQuery, setInlineQuery] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    results: addressResults,
    isLoading: isAddressLoading,
    clearResults,
  } = useAddressSearch(inlineQuery, isInlineMode);

  const exampleQuestions: string[] = [
    "Что делать, если горит LOS?",
    "Что такое приостановка услуг?",
  ];

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

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuestionClick = (question: string): void => {
    setInputText(question);
    if (chatContainerRef.current) {
      chatContainerRef.current.focus();
    }
  };

  const toggleInlineMode = (): void => {
    setIsInlineMode(!isInlineMode);
    if (!isInlineMode) {
      setInlineQuery("");
      clearResults();
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

  const handleAddressSelect = (address: AddressResult): void => {
    setInputText(address.address);
    setIsInlineMode(false);
    setInlineQuery("");
    clearResults();
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!inputText.trim()) return;

    // Если отправили ровно "/tariff", включаем инлайн-режим
    if (inputText.trim() === "/tariff") {
      setIsInlineMode(true);
      setInlineQuery("");
      setInputText("");
      return;
    }

    // Если инлайн-режим был активен, выключаем его при отправке обычного сообщения
    if (isInlineMode) {
      setIsInlineMode(false);
      setInlineQuery("");
      clearResults();
    }

    const userMessage: Message = {
      id: messageId,
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    setMessageId((prev) => prev + 1);

    const messageCount = messages.length / 2;
    const historyCount = messageCount < 3 ? messageCount : 3;

    try {
      const apiResult = await GetFridaAnswer(
        inputText,
        historyCount,
        selectedModel
      );

      if (!apiResult || "detail" in apiResult) {
        const errorMsg: Message = {
          id: messageId + 1,
          text: apiResult?.detail || "Ошибка получения ответа от сервера",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } else {
        const botMsg: Message = {
          id: messageId + 1,
          text: apiResult.response,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: messageId + 1,
          text: "Что-то пошло не так при запросе к серверу.",
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
    }
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
          <div className="chat-modal-header">
            <h3>Фрида Wiki ИИ</h3>
            <button className="chat-modal-close" onClick={toggleModal}>
              ×
            </button>
          </div>

          <div className="chat-content" ref={chatContainerRef}>
            <div className="chat-description">
              <p>
                Привет! Я Фрида — ваш корпоративный помощник. Работаю с
                внутренней Wiki. Ответы могут содержать неточности - проверяйте
                важную информацию.
              </p>
            </div>

            <div className="chat-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.isUser ? "user" : "bot"}`}
                >
                  {msg.isUser ? (
                    <div className="message-text">{msg.text}</div>
                  ) : (
                    <div
                      className="message-text"
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="message bot loading">
                  <div className="loader"></div>
                  <span>Ищу ответ...</span>
                </div>
              )}

              {/* Описание инлайн-режима */}
              {isInlineMode && !inlineQuery && messages.length === 0 && (
                <div className="inline-mode-description">
                  <div className="inline-mode-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="11"
                        cy="11"
                        r="8"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <line
                        x1="21"
                        y1="21"
                        x2="16.65"
                        y2="16.65"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle
                        cx="11"
                        cy="11"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>
                  <h3>Режим поиска по адресу</h3>
                  <div className="description-content">
                    <p>
                      Введите адрес в поле ниже для быстрого поиска. Система
                      найдет подходящие адреса и предложит их для выбора.
                    </p>
                    <p>
                      После выбора адреса будут найдены доступные тарифы и
                      услуги для этого местоположения. Вы сможете задавать
                      вопросы по конкретному адресу и получать точную
                      информацию.
                    </p>
                    <div className="description-steps">
                      <div className="step">
                        <span className="step-number">1</span>
                        <span className="step-text">Введите адрес</span>
                      </div>
                      <div className="step">
                        <span className="step-number">2</span>
                        <span className="step-text">Выберите из списка</span>
                      </div>
                      <div className="step">
                        <span className="step-number">3</span>
                        <span className="step-text">
                          Получите тарифы и задайте вопрос
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Примеры вопросов показываем только если НЕ инлайн режим */}
            {messages.length === 0 && !isInlineMode && (
              <div className="chat-examples">
                <h4>Примеры вопросов:</h4>
                <div className="example-buttons">
                  {exampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="example-button"
                      onClick={() => handleQuestionClick(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Результаты поиска адресов */}
            {isInlineMode && (
              <div className="inline-search-container">
                {isAddressLoading ? (
                  <div className="address-search-loading">
                    <div className="loader"></div>
                    <span>Поиск адресов...</span>
                  </div>
                ) : addressResults.length > 0 ? (
                  <div className="address-search-results">
                    <div className="address-results-header">
                      <span>Найдено адресов: {addressResults.length}</span>
                    </div>
                    <div className="address-results-list">
                      {addressResults.map((address) => (
                        <button
                          key={address.id}
                          className="address-result-item"
                          onClick={() => handleAddressSelect(address)}
                        >
                          <div className="address-main">{address.address}</div>
                          {(address.city || address.district) && (
                            <div className="address-details">
                              {address.city && (
                                <span className="address-city">
                                  {address.city}
                                </span>
                              )}
                              {address.district && (
                                <span className="address-district">
                                  {address.district}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  inlineQuery && (
                    <div className="address-search-empty">
                      <span>Адреса не найдены</span>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="chat-input-container">
              <div className="mobile-input-wrapper">
                <button
                  className={`inline-mode-button ${
                    isInlineMode ? "active" : ""
                  }`}
                  onClick={toggleInlineMode}
                  title="Поиск адресов"
                  disabled={isLoading}
                  aria-pressed={isInlineMode}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle
                      cx="10"
                      cy="10"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <line
                      x1="16"
                      y1="16"
                      x2="21"
                      y2="21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="inline-mode-label">
                    {isInlineMode ? "Поиск ВКЛ" : "Поиск адреса"}
                  </span>
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isInlineMode
                      ? "Введите адрес для поиска тарифа"
                      : "Спроси меня о чем-нибудь..."
                  }
                  disabled={isLoading}
                  className={isInlineMode ? "inline-mode" : ""}
                />

                {inputText.trim() && (
                  <button
                    className="send-button"
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    title="Отправить"
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 11L12 6L17 11M12 18V7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        transform="rotate(90 12 12)"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <select
                className="model-select"
                onChange={(e) => setSelectedModel(e.target.value)}
                value={selectedModel}
                disabled={isLoading}
                title="Выберите AI модель"
              >
                <option value="mistral-large-latest">Mistral Large</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="deepseek/deepseek-chat-v3-0324:free">
                  DeepSeek V3
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatIcon;
