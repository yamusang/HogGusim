// src/pages/auth/LogoutPage.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

export default function LogoutPage(){
  const { logout } = useAuth()
  const nav = useNavigate()
  useEffect(() => { logout(); nav('/', { replace:true }) }, [])
  return null
}
