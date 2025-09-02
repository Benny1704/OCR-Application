import type { Document, ExtractedData, Log, ProductWithDetails } from './../../interfaces/Types';

const MOCK_API_URL = "http://localhost:8000";
const API_URL = "https://069254027035.ngrok-free.app";

const fetchWithFallback = async (url: string, options: any = {}, showToast: any) => {
    try {
        const response = await fetch(url, options);
        if (response.status >= 500) {
            throw new Error("Server error");
        }
        return response;
    } catch (error) {
        showToast({ type: 'error', message: 'API is down, using mock data.' });
        return await fetch(url.replace(API_URL, MOCK_API_URL), options);
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

        const response = await fetch(`${API_URL}/users/token`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Login API call failed:", error);
        return null;
    }
}

export const getDocuments = async (showToast: any): Promise<Document[]> => {
  const response = await fetchWithFallback(`${API_URL}/documents`, { headers: getAuthHeaders() }, showToast);
  return response.json();
};

export const getDocument = async (id: number, showToast: any): Promise<Document> => {
  const response = await fetchWithFallback(`${API_URL}/documents/${id}`, { headers: getAuthHeaders() }, showToast);
  return response.json();
};

export const getExtractedData = async (showToast: any): Promise<ExtractedData> => {
    const response = await fetchWithFallback(`${API_URL}/extractedData`, { headers: getAuthHeaders() }, showToast);
    return response.json();
};

export const getProductData = async (showToast: any): Promise<ProductWithDetails[]> => {
    const response = await fetchWithFallback(`${API_URL}/productData`, { headers: getAuthHeaders() }, showToast);
    return response.json();
};

export const getDashboardData = async (showToast: any): Promise<any> => {
    const response = await fetchWithFallback(`${API_URL}/dashboard`, { headers: getAuthHeaders() }, showToast);
    return response.json();
};

export const getLogs = async (showToast: any): Promise<Log[]> => {
    const response = await fetchWithFallback(`${API_URL}/logs`, { headers: getAuthHeaders() }, showToast);
    return response.json();
}