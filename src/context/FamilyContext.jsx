import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const FamilyContext = createContext();

const API_BASE = '/api';

const initialState = {
  members: [],
  loading: true,
  error: null,
  isAuthenticated: false,
  authRequired: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MEMBERS':
      return { ...state, members: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_AUTH':
      return { ...state, isAuthenticated: action.payload.authenticated, authRequired: action.payload.required };
    default:
      return state;
  }
}

export function FamilyProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchMembers = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const res = await fetch(`${API_BASE}/members`);
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      dispatch({ type: 'SET_MEMBERS', payload: data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/status`);
      const { isSetup } = await res.json();
      dispatch({ type: 'SET_AUTH', payload: { required: isSetup, authenticated: !isSetup } });
    } catch {
      dispatch({ type: 'SET_AUTH', payload: { required: false, authenticated: true } });
    }
  }, []);

  const login = useCallback(async (password) => {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const { valid } = await res.json();
    if (valid) {
      dispatch({ type: 'SET_AUTH', payload: { required: true, authenticated: true } });
    }
    return valid;
  }, []);

  const setupPassword = useCallback(async (password) => {
    const res = await fetch(`${API_BASE}/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const result = await res.json();
    if (result.success) {
      dispatch({ type: 'SET_AUTH', payload: { required: true, authenticated: true } });
    }
    return result.success;
  }, []);

  // Save member — now uses server-side sync via PUT/POST
  const saveMember = useCallback(async (member) => {
    const isNew = !state.members.some(m => m.id === member.id);
    const url = isNew ? `${API_BASE}/members/new` : `${API_BASE}/members/${member.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save member');
    }

    // Re-fetch all members to get synced relationships
    await fetchMembers();
    return member;
  }, [state.members, fetchMembers]);

  const deleteMember = useCallback(async (id) => {
    const res = await fetch(`${API_BASE}/members/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchMembers();
    }
  }, [fetchMembers]);

  const importData = useCallback(async (data, format = 'json') => {
    if (format === 'gedcom') {
      await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'gedcom', data }),
      });
    } else if (Array.isArray(data)) {
      // Backward compatible JSON import
      await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }
    await fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    checkAuth();
    fetchMembers();
  }, [checkAuth, fetchMembers]);

  const value = {
    ...state,
    fetchMembers,
    saveMember,
    deleteMember,
    importData,
    login,
    setupPassword,
    checkAuth,
  };

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (!context) throw new Error('useFamily must be used within FamilyProvider');
  return context;
}
