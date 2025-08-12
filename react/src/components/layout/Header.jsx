// src/components/layout/Header.jsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import Button from '../ui/Button'
import './header.css'

export default function Header() {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  return (
    <header className="header">
      <Link to="/" className="header__brand">
        <img src="/logo.svg" alt="" className="header__logo" />
        <span>유기동물 매칭</span>
      </Link>

      <nav className="header__nav">
        {/* 필요하면 메뉴 추가 */}
      </nav>

      {/* <div className="header__actions">
        {!user ? (
          <>
            <Button as="a" onClick={() => nav('/signup')} sizeName="sm" presetName="signup">회원가입</Button>
            <Button as="a" onClick={() => nav('/login')}  sizeName="sm" presetName="login">로그인</Button>
          </>
        ) : (
          <>
            <span className="header__hello">{user.email}</span>
            <Button sizeName="sm" presetName="ghost" onClick={logout}>로그아웃</Button>
          </>
        )}
      </div> */}
    </header>
  )
}
