const formatDateTime = (timestamp: number) => {
    // Умножаем на 1000, так как timestamp в секундах
    const date = new Date(timestamp * 1000);
  
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
  
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };



export default formatDateTime