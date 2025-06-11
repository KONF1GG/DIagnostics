import { useState, KeyboardEvent, useRef, useEffect } from "react";
import "../../CSS/Chat.css";

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
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messageId, setMessageId] = useState<number>(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const exampleQuestions: string[] = [
    "Что делать, если горит LOS?",
    "Что такое приостановка услуг?",
  ];

  // Автоматическая прокрутка вниз при новых сообщениях
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

  const generateResponse = (question: string): Message => {
    const responses: Record<string, Message> = {
      "Что делать, если горит LOS?": {
        id: messageId + 1,
        text: "При горении индикатора LOS:\n\n1. Проверьте целостность кабеля\n2. Убедитесь в правильности подключения\n3. Перезагрузите оборудование\n\nЭти шаги описаны в **документации по устранению неисправностей**.",
        isUser: false,
        links: [
          {
            source: "Внутренняя Wiki",
            section: "Устранение неисправностей",
            description: "Индикатор LOS",
          },
          {
            source: "База знаний",
            section: "Световые индикаторы",
            description: "Диагностика проблем",
          },
        ],
      },
      "Что такое приостановка услуг?": {
        id: messageId + 1,
        text: "Приостановка услуг — это временное отключение сервиса по инициативе клиента или провайдера. Основные причины:\n\n- Неоплата\n- Технические работы\n- По запросу клиента\n\nПодробнее в **регламенте приостановки услуг**.",
        isUser: false,
        links: [
          {
            source: "Корпоративные стандарты",
            section: "Регламенты",
            description: "Приостановка услуг",
          },
        ],
      },
    };

    return (
      responses[question] || {
        id: messageId + 1,
        text: `Ответ на вопрос: ${question}\n\nЭта информация описана в соответствующей документации.`,
        isUser: false,
        links: [
          {
            source: "Внутренняя Wiki",
            section: "Общая информация",
            description: "Основные разделы",
          },
        ],
      }
    );
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

    // Имитация задержки API
    await new Promise((resolve) => setTimeout(resolve, 500));

    const botMessage = generateResponse(inputText);
    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
    setMessageId((prev) => prev + 1);
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
      setMessages([]);
      setInputText("");
    }
  };

  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text);
  };

  const clearChat = (): void => {
    setMessages([]);
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
                  <div className="message-text">{msg.text}</div>

                  {msg.links && (
                    <div className="message-footer">
                      <div className="message-actions">
                        <button onClick={() => copyToClipboard(msg.text)}>
                          Копировать
                        </button>
                        <button onClick={clearChat}>Очистить чат</button>
                      </div>
                    </div>
                  )}
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
