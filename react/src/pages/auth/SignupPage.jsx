import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../api/apiClient'
import Button from '../../components/ui/Button'
import FormField from '../../components/common/FormField'
import './auth.css'

export default function SignupPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const params = new URLSearchParams(search)

  const roleParam = (params.get('role') || sessionStorage.getItem('selectedRole') || 'SENIOR').toUpperCase()
  const [role] = useState(roleParam)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const minLen = 8

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const isInvalidEmail = useMemo(() => email && !emailRegex.test(email), [email])
  const isMismatch = useMemo(() => confirm.length > 0 && password !== confirm, [password, confirm])
  const isWeak = useMemo(() => password && password.length < minLen, [password])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isInvalidEmail) return setError('올바른 이메일 형식을 입력하세요.')
    if (isWeak) return setError(`비밀번호는 ${minLen}자리 이상이어야 합니다.`)
    if (isMismatch) return setError('비밀번호가 일치하지 않습니다.')

    try {
      await api.post('/auth/signup', { email, password, role })
      sessionStorage.setItem('selectedRole', role) 
      alert('회원가입이 완료되었습니다. 로그인 해주세요.')
      navigate(`/login?role=${role}`)
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.error?.message || '회원가입 실패')
    }
  };

  const disabled = !email || !password || !confirm || isInvalidEmail || isMismatch || isWeak

  return (
    <div className="auth auth--center">
      <div className="auth__card">
        <h1 className="auth__title">회원가입</h1>
        <p style={{margin:'0 0 8px', color:'#667085', fontSize:14}}>
          선택된 역할: {role === 'SENIOR' ? '고령자' : role === 'MANAGER' ? '펫매니저' : '보호소 관리자'}
        </p>
        {error && <div className="auth__error">{error}</div>}

        <form onSubmit={onSubmit} className="auth__form">
          <FormField
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={isInvalidEmail ? '올바른 이메일 형식이 아닙니다.' : ''}
          />
          <FormField
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            hint={`※ 비밀번호는 ${minLen}자리 이상 입력하세요.`}
            error={isWeak ? `비밀번호는 ${minLen}자리 이상이어야 합니다.` : ''}
          />
          <FormField
            label="비밀번호 확인"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            error={isMismatch ? '비밀번호가 일치하지 않습니다.' : ''}
          />

          <Button
            presetName="primary"
            type="submit"
            disabled={disabled}
            className="auth__submit auth__submit--primary"
          >
            회원가입
          </Button>
        </form>
      </div>
    </div>
  )
}
