const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost/project/api';

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_BASE}/${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data;
}

function toBody(payload: any): string {
  return JSON.stringify(payload);
}

// ============================================================
// Auth
// ============================================================
export const auth = {
  register: (payload: any) => request('auth.php?action=register', { method: 'POST', body: toBody(payload) }),
  login: (email: string, password: string) =>
    request('auth.php?action=login', { method: 'POST', body: toBody({ email, password }) }),
  logout: () => request('auth.php?action=logout', { method: 'POST' }),
  me: () => request('auth.php?action=me'),
};

// ============================================================
// Books
// ============================================================
export const books = {
  list: () => request('books.php'),
  get: (id: number) => request(`books.php?id=${id}`),
  create: (payload: any) => request('books.php', { method: 'POST', body: toBody(payload) }),
  update: (id: number, payload: any) => request(`books.php?id=${id}`, { method: 'PUT', body: toBody(payload) }),
  remove: (id: number) => request(`books.php?id=${id}`, { method: 'DELETE' }),
};

// ============================================================
// Categories
// ============================================================
export const categories = {
  list: () => request('categories.php'),
  create: (payload: any) => request('categories.php', { method: 'POST', body: toBody(payload) }),
  update: (id: number, payload: any) => request(`categories.php?id=${id}`, { method: 'PUT', body: toBody(payload) }),
  remove: (id: number) => request(`categories.php?id=${id}`, { method: 'DELETE' }),
};

// ============================================================
// Members
// ============================================================
export const members = {
  list: () => request('members.php'),
  get: (id: number) => request(`members.php?id=${id}`),
  update: (id: number, payload: any) => request(`members.php?id=${id}`, { method: 'PUT', body: toBody(payload) }),
  remove: (id: number) => request(`members.php?id=${id}`, { method: 'DELETE' }),
};

// ============================================================
// Borrowings
// ============================================================
export const borrowings = {
  list: () => request('borrowings.php'),
  create: (payload: any) => request('borrowings.php', { method: 'POST', body: toBody(payload) }),
  return: (id: number, payload: any) => request(`borrowings.php?id=${id}`, { method: 'PUT', body: toBody(payload) }),
  remove: (id: number) => request(`borrowings.php?id=${id}`, { method: 'DELETE' }),
};

// ============================================================
// Dashboard & Stats
// ============================================================
export const dashboard = {
  get: () => request('dashboard.php'),
};

export const stats = {
  get: () => request('stats.php'),
};
