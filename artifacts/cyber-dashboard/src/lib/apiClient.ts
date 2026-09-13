export const getAuthToken = () => localStorage.getItem('cyberToken');
export const setAuthToken = (token: string) => localStorage.setItem('cyberToken', token);
export const removeAuthToken = () => localStorage.removeItem('cyberToken');

const originalFetch = window.fetch;

export function setupApiClient() {
  window.fetch = async (input, init) => {
    const url = input;
    
    const token = getAuthToken();
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const response = await originalFetch(url, { ...init, headers });
    
    if (response.status === 401) {
      removeAuthToken();
      localStorage.removeItem('cyberUser');
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/' && path !== '/register' && path !== '/forgot-password') {
        window.location.href = '/login';
      }
    }
    
    return response;
  };
}