import React, { createContext, useEffect, useState } from 'react'
import api from '../api/apiClient'

export const AuthContext = createContext(null)

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // { role, token, ... }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, []);

  // 합의한 로그인: POST /auth/login -> { token, role }
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    const u = { role: data.role, token: data.token }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return u
  };

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
