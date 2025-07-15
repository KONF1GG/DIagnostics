import React from "react";
import "./ChatMessages.css";
import { copyToClipboard } from "../../../utils/copyUtils";

interface ChatMessagesProps {
  messages: any[];
  isLoading: boolean;
  selectedAddress: any;
  addressTariffs: any;
  isLoadingTariffs: boolean;
  tariffsError: string | null;
  inlineQuery: string;
  addressResults: any[];
  addressError: string | null;
  chatMode: "wiki" | "tariffSearch" | "tariffChat";
  onAddressSelect: (address: any) => void;
  onCopyCommand: (command: string) => void;
  onShowCopyNotification: (text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  searchResultsRef?: React.RefObject<HTMLDivElement>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  selectedAddress,
  addressTariffs,
  isLoadingTariffs,
  tariffsError,
  inlineQuery,
  addressResults,
  addressError,
  chatMode,
  onAddressSelect,
  onCopyCommand,
  onShowCopyNotification,
  messagesEndRef,
  searchResultsRef,
}) => (
  <div className="chat-messages adaptive-scroll">
    {/* Описание тарифов */}
    {messages.length === 0 &&
      chatMode === "tariffChat" &&
      selectedAddress &&
      addressTariffs && (
        <div className="info-panel fixed">
          <div className="info-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
          <h3>Режим поиска по тарифам активен</h3>
          <div className="description-content">
            <p>
              Ваши вопросы будут обрабатываться с учетом доступных тарифов для
              территории <strong>{selectedAddress.territory_name}</strong>.
              Спрашивайте о конкретных услугах, их стоимости, подключении или
              других тарифных вопросах.
            </p>
            <p className="note">
              💡 Поиск по Wiki временно недоступен в этом режиме. Для возврата к
              обычному поиску очистите территорию.
            </p>
            <div className="description-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span className="step-text">Задайте вопрос</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span className="step-text">Получите ответ по тарифам</span>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <span className="step-text">Уточните детали</span>
              </div>
            </div>
          </div>
        </div>
      )}
    {selectedAddress && isLoadingTariffs && (
      <div className="loading-tariffs-description fixed">
        <div className="loading-header">
          <div className="loading-spinner">
            <div className="loader-small"></div>
          </div>
          <h4>Загрузка тарифов</h4>
        </div>
        <p>
          Загружаются тарифы для территории{" "}
          <strong>{selectedAddress.territory_name}</strong>...
        </p>
        <p>Пожалуйста, подождите.</p>
      </div>
    )}
    {selectedAddress && tariffsError && (
      <div className="tariffs-error-compact">
        <div className="error-content">
          <div className="error-icon-small">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="12"
                y1="8"
                x2="12"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="12"
                y1="16"
                x2="12.01"
                y2="16"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="error-text">
            <span className="error-title">
              Ошибка загрузки тарифов для {selectedAddress.territory_name}
            </span>
            <span className="error-subtitle">
              Можете задавать общие вопросы
            </span>
          </div>
        </div>
        <button
          className="retry-button-small"
          onClick={() => window.location.reload()}
          title="Попробовать еще раз"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 3v5h-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 21v-5h5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    )}
    {/* Описание обычного режима поиска по Wiki */}
    {messages.length === 0 && chatMode === "wiki" && (
      <div className="info-panel fixed">
        <div className="info-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="8"
              r="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M9 14h6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h3>Поиск по корпоративной Wiki</h3>
        <div className="description-content">
          <p>
            Задавайте вопросы о технической поддержке, процедурах и внутренних
            инструкциях. Система найдет информацию в корпоративной базе знаний.
          </p>
          <p>
            Для поиска тарифов по конкретной территории используйте кнопку внизу
            "Поиск территорий" или введите команду{" "}
            <span
              className="copyable-command"
              onClick={() => onCopyCommand("/tariff")}
              title="Нажмите для копирования"
            >
              /tariff
            </span>
          </p>
          <div className="description-steps">
            <div className="step">
              <span className="step-number">1</span>
              <span className="step-text">Задайте вопрос</span>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <span className="step-text">Получите ответ из Wiki</span>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <span className="step-text">Уточните детали</span>
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Описание инлайн-режима */}
    {messages.length === 0 && chatMode === "tariffSearch" && (
      <div className="info-panel fixed">
        <div className="info-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="10"
              r="3"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>
        <h3>Режим поиска по территории</h3>
        <div className="description-content">
          <p>
            Введите территорию в поле ниже для быстрого поиска. Система найдет
            подходящие территории и предложит их для выбора.
          </p>
          <p>
            После выбора территории автоматически загрузятся доступные тарифы и
            услуги для этого местоположения. Вы сможете задавать вопросы по
            конкретным тарифам и получать точную информацию о стоимости и
            условий подключения.
          </p>
          <div className="description-steps">
            <div className="step">
              <span className="step-number">1</span>
              <span className="step-text">Введите территорию</span>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <span className="step-text">Выберите из списка</span>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <span className="step-text">Задавайте вопросы о тарифах</span>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Результаты поиска адресов в режиме поиска тарифов */}
    {chatMode === "tariffSearch" && (
      <div className="search-results-panel" ref={searchResultsRef}>
        <div className="search-results-header">
          <h4>
            {inlineQuery
              ? `Результаты поиска: "${inlineQuery}"`
              : "Режим поиска территорий активен"}
          </h4>
        </div>

        {!inlineQuery && (
          <div className="search-hint">
            <p>💡 Начните вводить территорию (минимум 3 символа) для поиска</p>
          </div>
        )}

        {inlineQuery && inlineQuery.length < 3 && (
          <div className="search-hint">
            <p>
              ⌨️ Введите еще {3 - inlineQuery.length} символ(а) для начала
              поиска
            </p>
          </div>
        )}

        {addressError && (
          <div className="search-error">
            <div className="error-header">
              <div className="error-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="12"
                    y1="8"
                    x2="12"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="12"
                    y1="16"
                    x2="12.01"
                    y2="16"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h5>Ошибка поиска</h5>
            </div>
            <p>Территории не найдены. Попробуйте изменить запрос.</p>
          </div>
        )}

        {inlineQuery &&
          inlineQuery.length >= 3 &&
          addressResults.length > 0 && (
            <div className="address-results">
              {addressResults.map((address, index) => (
                <div
                  key={index}
                  className="address-result-item"
                  onClick={() => onAddressSelect(address)}
                >
                  <div className="address-main">
                    <span className="territory-name-main">
                      {address.territory_name}
                    </span>
                    <span className="address-text">{address.address}</span>
                  </div>
                  <div className="address-details">
                    {address.territory_id && (
                      <span className="territory-id">
                        ID: {address.territory_id}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        {inlineQuery &&
          inlineQuery.length >= 3 &&
          addressResults.length === 0 &&
          !addressError && (
            <div className="no-results">
              <p>🔍 Территории не найдены по запросу "{inlineQuery}"</p>
              <p>
                Попробуйте изменить запрос или введите более точное название.
              </p>
            </div>
          )}
      </div>
    )}

    {/* Сообщения */}
    {messages.map((msg) => (
      <div
        key={msg.id}
        className={`message-container ${msg.isUser ? "user" : "bot"}`}
      >
        <div className={`message ${msg.isUser ? "user" : "bot"}`}>
          {msg.isUser ? (
            <div className="message-text">{msg.text}</div>
          ) : (
            <div
              className="message-text"
              dangerouslySetInnerHTML={{ __html: msg.text }}
            />
          )}
        </div>
        {!msg.isUser && (
          <button
            className="copy-message-btn"
            onClick={async () => {
              const textContent = msg.text.replace(/<[^>]*>/g, ""); // Remove HTML tags
              const success = await copyToClipboard(textContent);
              if (success) {
                onShowCopyNotification("Ответ скопирован! 📋");
              } else {
                onShowCopyNotification(
                  "Не удалось скопировать. Попробуйте выделить текст вручную."
                );
              }
            }}
            title="Скопировать ответ"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect
                x="9"
                y="9"
                width="13"
                height="13"
                rx="2"
                ry="2"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </button>
        )}
      </div>
    ))}
    {isLoading && (
      <div className="message-container bot">
        <div className="message bot loading">
          <div className="loader"></div>
          <span>Ищу ответ...</span>
        </div>
      </div>
    )}
    <div ref={messagesEndRef} />
  </div>
);

export default ChatMessages;
