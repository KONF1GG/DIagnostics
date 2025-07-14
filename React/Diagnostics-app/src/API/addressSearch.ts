export interface AddressResult {
  id: string;
  address: string;
  city?: string;
  district?: string;
  building?: string;
}

export interface AddressSearchResponse {
  results: AddressResult[];
  total: number;
}

export const searchAddresses = async (query: string): Promise<AddressSearchResponse> => {
  try {
    const response = await fetch(`/api/addresses/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error searching addresses:', error);
    return { results: [], total: 0 };
  }
};