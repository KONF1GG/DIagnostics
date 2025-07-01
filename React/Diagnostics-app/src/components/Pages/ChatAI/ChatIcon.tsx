import { useState, KeyboardEvent, useRef, useEffect } from "react";
import "../../CSS/Chat.css";
import { useDataContext } from "../../../DataContext/FridaContext";
import { GetFridaAnswer } from "../../../API/frida";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async (): Promise<void> => {
    if (!inputText.trim()) return;

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
      handleSendMessage();
    }
  };

  const toggleModal = (): void => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setInputText("");
    }
  };

  //   const copyToClipboard = (text: string): void => {
  //     navigator.clipboard.writeText(text);
  //   };

  //   const clearChat = (): void => {
  //     setMessages([]);
  //     localStorage.removeItem("chatMessages");
  //     setMessageId(0);
  //   };

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
                  {/* {!msg.isUser ? (
                    <div className="message-footer">
                      <div className="message-actions">
                        <button onClick={() => copyToClipboard(msg.text)}>
                          Копировать
                        </button>
                      </div>
                    </div>
                  ) : (
                    <></>
                  )} */}
                </div>
              ))}

              {isLoading && (
                <div className="message bot loading">
                  <div className="loader"></div>
                  <span>Ищу ответ...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 0 && (
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

            <div className="chat-input-container">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Спроси меня о чем-нибудь..."
                disabled={isLoading}
              />
              <select
                className="model-select"
                onChange={(e) => setSelectedModel(e.target.value)}
                value={selectedModel}
                disabled={isLoading}
                title="Выберите AI модель"
              >
                <option value="mistral-large-latest">Mistral Large</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="deepseek/deepseek-chat-v3-0324:free">DeepSeek V3</option>
              </select>
              <button
                className="send-button"
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim()}
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatIcon;
