/**
 * Утилита для копирования текста в буфер обмена с fallback для старых браузеров
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Проверяем поддержку современного Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback для старых браузеров или небезопасного контекста (HTTP)
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error("Ошибка при копировании:", err);
    return false;
  }
};
