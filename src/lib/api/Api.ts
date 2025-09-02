import type { Document, ExtractedData, Log, ProductWithDetails } from './../../interfaces/Types';

const MOCK_API_URL = "http://localhost:8000";
const API_URL = "https://069254027035.ngrok-free.app";

const fetchWithFallback = async (url: string, options: any = {}, showToast: any) => {
    try {
        const response = await fetch(url.replace(MOCK_API_URL, API_URL), options);
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response;
        } else {
            throw new Error("Received non-JSON response from API");
        }
    } catch (error) {
        console.error("API call failed, falling back to mock data:", error);
        showToast({ type: 'error', message: 'Could not connect to API, using mock data.' });
        const mockResponse = await fetch(url.replace(API_URL, MOCK_API_URL), options);
        if (!mockResponse.ok) {
            throw new Error(`Mock API request failed with status ${mockResponse.status}`);
        }
        return mockResponse;
    }
};

const getAuthToken = () => {
    return localStorage.getItem('token');
};

const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const login = async (credentials: {username: string, password: string}):Promise<{access_token: string} | null> => {
    try {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        // Try to login with the live API
        try {
            const response = await fetch(`${API_URL}/users/token`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error("Login API call failed, trying mock API:", error);
        }


        // Fallback to mock API
        const mockResponse = await fetch(`${MOCK_API_URL}/users`);
        const users = await mockResponse.json();
        const user = users.find((u: any) => u.username === credentials.username && u.password === 'password');

        if (user) {
            // In a real scenario, you'd generate a mock JWT token here.
            // For simplicity, we'll return a placeholder.
            return { access_token: `mock_token_for_${user.username}` };
        }


        return null;
    } catch (error) {
        console.error("Login failed:", error);
        return null;
    }
}

export const getDocuments = async (showToast: any): Promise<Document[]> => {
  const response = await fetchWithFallback(`${MOCK_API_URL}/documents`, { headers: getAuthHeaders() }, showToast);
  return response.json();
};

export const getDocument = async (id: number, showToast: any): Promise<Document> => {
  const response = await fetchWithFallback(`${MOCK_API_URL}/documents/${id}`, { headers: getAuthHeaders() }, showToast);
  return response.json();
};

export const getExtractedData = async (showToast: any): Promise<ExtractedData> => {
    const response = await fetchWithFallback(`${MOCK_API_URL}/extractedData`, { headers: getAuthHeaders() }, showToast);
    return response.json();
};

export const getProductData = async (showToast: any): Promise<ProductWithDetails[]> => {
    const response = await fetchWithFallback(`${MOCK_API_URL}/productData`, { headers: getAuthHeaders() }, showToast);
    return response.json();
};

export const getDashboardData = async (showToast: any): Promise<any> => {
    const response = await fetchWithFallback(`${MOCK_API_URL}/dashboard`, { headers: getAuthHeaders() }, showToast);
    return response.json();
};

export const getLogs = async (showToast: any): Promise<Log[]> => {
    const response = await fetchWithFallback(`${MOCK_API_URL}/logs`, { headers: getAuthHeaders() }, showToast);
    return response.json();
}