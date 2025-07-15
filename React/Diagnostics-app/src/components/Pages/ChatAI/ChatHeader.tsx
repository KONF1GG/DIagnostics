import React from "react";
import "./ChatHeader.css";

interface ChatHeaderProps {
  selectedAddress: any;
  isLoadingTariffs: boolean;
  tariffsError: string | null;
  chatMode: "wiki" | "tariffSearch" | "tariffChat";
  onClearAddress: () => void;
  onClearChat: () => void;
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedAddress,
  isLoadingTariffs,
  tariffsError,
  chatMode,
  onClearAddress,
  onClearChat,
  onClose,
}) => {
  const getModeText = () => {
    switch (chatMode) {
      case "wiki":
        return "Поиск по Wiki";
      case "tariffSearch":
        return "Поиск тарифов";
      case "tariffChat":
        return "Чат по тарифам";
      default:
        return "Поиск по Wiki";
    }
  };

  const getModeColor = () => {
    switch (chatMode) {
      case "wiki":
        return "#10b981";
      case "tariffSearch":
        return "#3b82f6";
      case "tariffChat":
        return "#8b5cf6";
      default:
        return "#10b981";
    }
  };

  return (
    <div className="chat-modal-header">
      <div className="header-content">
        <div className="header-main">
          <h3>Фрида</h3>
          <div
            className="mode-indicator"
            style={{
              backgroundColor: getModeColor(),
              color: "white",
              padding: "2px 8px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: "600",
              marginLeft: "8px",
            }}
          >
            {getModeText()}
          </div>
        </div>
        {selectedAddress && (
          <div className="selected-address-info">
            <span className="address-label">Выбранная территория</span>
            <span className="address-value">
              {selectedAddress.territory_name}
            </span>
            {isLoadingTariffs && (
              <div className="tariffs-loading">
                <div className="loader-small"></div>
                <span>Загрузка тарифов...</span>
              </div>
            )}
            {tariffsError && (
              <div className="tariffs-error">
                <span>⚠️ {tariffsError}</span>
              </div>
            )}
            <button
              className="clear-address-btn"
              onClick={onClearAddress}
              title="Очистить выбранную территорию"
            >
              ×
            </button>
          </div>
        )}
      </div>
      <div className="header-actions">
        <a
          href="https://t.me/freedomwhisbot"
          target="_blank"
          rel="noopener noreferrer"
          className="telegram-btn"
          title="Открыть бота в Telegram"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
              fill="currentColor"
            />
          </svg>
        </a>
        <button
          className="clear-chat-btn"
          onClick={onClearChat}
          title="Очистить чат"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button className="chat-modal-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
