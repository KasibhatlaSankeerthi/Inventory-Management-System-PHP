const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

export async function loginRequest(email, password) {
  const response = await fetch(`${apiBaseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseJsonResponse(response);
}

export async function fetchCurrentUser(token) {
  const response = await fetch(`${apiBaseUrl}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJsonResponse(response);
}
