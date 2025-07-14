import React from "react";
import { AddressResult } from "../../API/addressSearch";

interface AddressSearchResultsProps {
  results: AddressResult[];
  isLoading: boolean;
  query: string;
  onSelect: (address: AddressResult) => void;
}

const AddressSearchResults: React.FC<AddressSearchResultsProps> = ({
  results,
  isLoading,
  query,
  onSelect,
}) => {
  if (isLoading) {
    return (
      <div className="address-search-loading">
        <div className="loader"></div>
        <span>Поиск адресов...</span>
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="address-search-empty">
        <span>Адреса не найдены</span>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="address-search-results">
      <div className="address-results-header">
        <span>Найдено адресов: {results.length}</span>
      </div>
      <div className="address-results-list">
        {results.map((address) => (
          <button
            key={address.id}
            className="address-result-item"
            onClick={() => onSelect(address)}
          >
            <div className="address-main">{address.address}</div>
            {(address.city || address.district) && (
              <div className="address-details">
                {address.city && (
                  <span className="address-city">{address.city}</span>
                )}
                {address.district && (
                  <span className="address-district">{address.district}</span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AddressSearchResults;
