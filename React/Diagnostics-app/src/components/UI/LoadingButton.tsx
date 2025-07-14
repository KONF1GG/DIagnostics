import React from "react";

interface LoadingButtonProps {
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  loadingText?: string;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  onClick,
  disabled = false,
  className = "",
  style,
  children,
  loadingText = "Загрузка...",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={className}
      style={style}
    >
      {isLoading ? (
        <>
          <span
            className="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
