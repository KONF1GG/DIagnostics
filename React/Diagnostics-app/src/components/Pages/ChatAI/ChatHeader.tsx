import React from "react";
import "./ChatHeader.css";

interface ChatHeaderProps {
  selectedAddress: any;
  isLoadingTariffs: boolean;
  tariffsError: string | null;
  onClearAddress: () => void;
  onClearChat: () => void;
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  selectedAddress,
  isLoadingTariffs,
  tariffsError,
  onClearAddress,
  onClearChat,
  onClose,
}) => (
  <div className="chat-modal-header">
    <div className="header-content">
      <h3>Фрида</h3>
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

export default ChatHeader;
