
export const getQueryParams = () => {
    const params = new URLSearchParams(location.search);
    return params.get("login") || "";
  };

  