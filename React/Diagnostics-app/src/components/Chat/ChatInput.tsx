import React from "react";

interface ChatInputProps {
  inputText: string;
  isLoading: boolean;
  isInlineMode: boolean;
  selectedModel: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onToggleInlineMode: () => void;
  onModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  isLoading,
  isInlineMode,
  selectedModel,
  onInputChange,
  onKeyPress,
  onSendMessage,
  onToggleInlineMode,
  onModelChange,
}) => {
  return (
    <div className="chat-input-container">
      <div className="mobile-input-wrapper">
        <button
          className={`inline-mode-button ${isInlineMode ? "active" : ""}`}
          onClick={onToggleInlineMode}
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
          onChange={onInputChange}
          onKeyPress={onKeyPress}
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
            onClick={onSendMessage}
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
        onChange={onModelChange}
        value={selectedModel}
        disabled={isLoading}
        title="Выберите AI модель"
      >
        <option value="mistral-large-latest">Mistral Large</option>
        <option value="gpt-4o-mini">GPT-4o Mini</option>
        <option value="deepseek/deepseek-chat-v3-0324:free">DeepSeek V3</option>
      </select>
    </div>
  );
};

export default ChatInput;
