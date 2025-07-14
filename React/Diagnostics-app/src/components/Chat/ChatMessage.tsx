import React from "react";
import { Message } from "../../hooks/useChatState";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`message ${message.isUser ? "user" : "bot"}`}>
      {message.isUser ? (
        <div className="message-text">{message.text}</div>
      ) : (
        <div
          className="message-text"
          dangerouslySetInnerHTML={{ __html: message.text }}
        />
      )}
    </div>
  );
};

export default ChatMessage;
