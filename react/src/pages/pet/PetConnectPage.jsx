import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { fetchMyApplications, getApplicationsByPet, approveApplication, rejectApplication } from '../../api/applications'
import Badge from '../../components/common/Badge'
import Card from '../../components/common/Card'
import Button from '../../components/ui/Button'
import './pet.css'

export default function PetConnectPage() {
  const { user } = useAuth()
  const role = user?.role // 'SENIOR' | 'SHELTER' | 'MANAGER'
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const petIdParam = params.get('petId')

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const isSenior = role === 'SENIOR'
  const isShelter = role === 'SHELTER'

  const load = async () => {
    try {
      setLoading(true)
      setErr('')
      if (isSenior) {
        const list = await fetchMyApplications()
        setItems(list || [])
      } else if (isShelter) {
        if (!petIdParam) {
          setItems([])
          return
        }
        const list = await getApplicationsByPet(Number(petIdParam))
        setItems(list || [])
      } else {
        setErr('지원되지 않는 역할입니다.')
      }
    } catch (e) {
      setErr(e.message || '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [role, petIdParam])

  const title = useMemo(() => {
    if (isSenior) return '내 신청 현황'
    if (isShelter) return `신청 확인${petIdParam ? ` (Pet #${petIdParam})` : ''}`
    return '매칭 확인'
  }, [isSenior, isShelter, petIdParam])

  const onApprove = async (appId) => {
    try {
      await approveApplication(appId)
      setItems(prev => prev.map(it => it.id === appId ? { ...it, status: 'ACCEPTED' } : it))
    } catch (e) {
      alert(e.message || '승인 실패')
    }
  }

  const onReject = async (appId) => {
    try {
      await rejectApplication(appId)
      setItems(prev => prev.map(it => it.id === appId ? { ...it, status: 'REJECTED' } : it))
    } catch (e) {
      alert(e.message || '거절 실패')
    }
  }

  return (
    <div className="petconnect">
      <div className="petconnect__header">
        <h1>{title}</h1>

        {isShelter && (
          <div className="petconnect__tools">
            <input
              className="petconnect__petid"
              placeholder="petId 입력"
              defaultValue={petIdParam || ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = e.currentTarget.value.trim()
                  navigate(v ? `?petId=${v}` : '')
                }
              }}
            />
            <Button variant="secondary" onClick={load}>새로고침</Button>
          </div>
        )}
      </div>

      {err && <div className="petconnect__error">{err}</div>}
      {loading && <div className="petconnect__loading">불러오는 중...</div>}

      {!loading && !items.length && (
        <div className="petconnect__empty">
          {isShelter ? 'petId를 선택하면 신청 목록이 보여요.' : '신청 내역이 없습니다.'}
        </div>
      )}

      <div className="petconnect__list">
        {items.map(app => (
          <Card key={app.id} className="petconnect__card">
            <div className="petconnect__row">
              <div className="petconnect__main">
                <div className="petconnect__title">
                  <span className="petconnect__pet">
                    🐶 {app.petName || `Pet #${app.petId}`}
                  </span>
                  <Badge
                    tone={
                      app.status === 'PENDING' ? 'warning'
                      : app.status === 'ACCEPTED' ? 'success'
                      : 'danger'
                    }
                    text={app.status?.toLowerCase()}
                  />
                </div>

                <div className="petconnect__meta">
                  <span>신청자: {app.name} ({app.gender}) · {app.age}세</span>
                  <span>연락처: {app.phone}</span>
                  <span>주소: {app.address}</span>
                  <span>선호시간: {app.timeRange} / {Array.isArray(app.days) ? app.days.join(', ') : app.days}</span>
                  {app.date && <span>희망일: {new Date(app.date).toLocaleDateString()}</span>}
                  {app.experience && <span>경험: {app.experience}</span>}
                </div>
              </div>

              {isShelter && (
                <div className="petconnect__actions">
                  <Button
                    disabled={app.status !== 'PENDING'}
                    onClick={() => onApprove(app.id)}
                  >
                    수락
                  </Button>
                  <Button
                    variant="danger"
                    disabled={app.status !== 'PENDING'}
                    onClick={() => onReject(app.id)}
                  >
                    거절
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
// 