import React, { useState, useRef, useEffect } from "react";
import "./ChatInput.css";

interface ChatInputProps {
  inputText: string;
  isLoading: boolean;
  isInlineMode: boolean;
  chatMode: "wiki" | "tariffSearch" | "tariffChat";
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onToggleInline: () => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  isLoading,
  isInlineMode,
  chatMode,
  onInputChange,
  onKeyPress,
  onSend,
  onToggleInline,
  selectedModel,
  setSelectedModel,
}) => {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const modelOptions = [
    {
      value: "mistral-large-latest",
      label: "Mistral",
    },
    {
      value: "gpt-4o-mini",
      label: "GPT-4o",
    },
    {
      value: "deepseek/deepseek-chat-v3-0324:free",
      label: "DeepSeek",
    },
  ];

  const selectedOption = modelOptions.find(
    (option) => option.value === selectedModel
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsSelectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="chat-input-container">
      <div className="input-wrapper">
        <button
          className="attach-button disabled"
          disabled={true}
          title="Прикрепить файл (скоро)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <input
          type="text"
          value={inputText}
          onChange={onInputChange}
          onKeyPress={onKeyPress}
          placeholder={
            isInlineMode
              ? "Введите территорию для поиска тарифа..."
              : "Спроси меня о чем-нибудь..."
          }
          disabled={isLoading}
          className={`main-input ${isInlineMode ? "inline-mode" : ""}`}
        />
        <div className="input-controls">
          <button
            className={`search-button ${isInlineMode ? "active" : ""}`}
            onClick={onToggleInline}
            title="Поиск территорий"
            disabled={isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m21 21-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="model-selector-compact" ref={selectRef}>
            <button
              className={`model-button ${isSelectOpen ? "open" : ""}`}
              onClick={() => !isLoading && setIsSelectOpen(!isSelectOpen)}
              disabled={isLoading}
              title={selectedOption?.label}
            >
              <span className="model-name">{selectedOption?.label}</span>
              <svg
                className={`dropdown-icon ${isSelectOpen ? "rotated" : ""}`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isSelectOpen && !isLoading && (
              <div className="model-dropdown">
                {modelOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`model-option ${
                      option.value === selectedModel ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedModel(option.value);
                      setIsSelectOpen(false);
                    }}
                  >
                    <div className="model-info">
                      <span className="model-title">{option.label}</span>
                    </div>
                    {option.value === selectedModel && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            className="send-button"
            onClick={onSend}
            disabled={
              isLoading || !inputText.trim() || chatMode === "tariffSearch"
            }
            title={
              chatMode === "tariffSearch"
                ? "Выберите территорию для продолжения"
                : "Отправить сообщение"
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
