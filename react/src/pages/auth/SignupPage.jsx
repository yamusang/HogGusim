import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/apiClient'
import Button from '../../components/ui/Button'
import FormField from '../../components/common/FormField'
import './auth.css'

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const minLen = 8

  const isMismatch = useMemo(() => confirm.length > 0 && password !== confirm, [password, confirm])
  const isWeak = useMemo(() => password && password.length < minLen, [password])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isWeak) return setError(`비밀번호는 ${minLen}자 이상이어야 합니다.`)
    if (isMismatch) return setError('비밀번호가 일치하지 않습니다.')

    try {
      await api.post('/auth/signup', { email, password })
      alert('회원가입이 완료되었습니다. 로그인 해주세요.')
      navigate('/login')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error?.message || '회원가입 실패')
    }
  };

  const disabled = !email || !password || !confirm || isMismatch || isWeak

  return (
    <div className="auth auth--center">
      <div className="auth__card">
        <h1 className="auth__title">회원가입</h1>
        {error && <div className="auth__error">{error}</div>}

        <form onSubmit={onSubmit} className="auth__form">
          <FormField
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormField
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            hint={`※ ${minLen}자 이상 권장`}
          />
          <FormField
            label="비밀번호 확인"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            error={isMismatch ? '비밀번호가 일치하지 않습니다.' : ''}
          />

          <Button presetName="primary" type="submit" disabled={disabled}>
            회원가입
          </Button>
        </form>
      </div>
    </div>
  )
}
