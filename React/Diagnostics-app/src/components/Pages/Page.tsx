import React from "react";

const Page = (isLoading: boolean, children: React.ReactNode) => {
  return (
    <div>
      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      )}
      {children}
    </div>
  );
};

export default Page;
