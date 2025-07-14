import React from "react";
import Loader from "../Pages/Default/Loading";

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  children,
  emptyMessage = "Нет данных",
  isEmpty = false,
}) => {
  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (isEmpty) {
    return <div className="no-services-message fade-in">{emptyMessage}</div>;
  }

  return <>{children}</>;
};

export default LoadingState;
