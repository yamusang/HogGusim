// src/pages/rescue/RescueList.jsx
import { useEffect, useState } from 'react'
import { DEFAULT_FILTERS } from '../../config'
import { getSido, getSigungu, getShelter, getKind, getRescues, mapAnimal } from '../../api/animalOpenApi'

function yyyymmdd(d) {
  return d.toISOString().slice(0,10).replaceAll('-','')
}

export default function RescueList() {
  const [sido, setSido] = useState([])
  const [sigungu, setSigungu] = useState([])
  const [shelters, setShelters] = useState([])
  const [kinds, setKinds] = useState([])
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState({
    upr_cd: '', org_cd: '', care_reg_no: '',
    kind: '',
    ...DEFAULT_FILTERS, // upkind, pageNo, numOfRows
    // 최근 14일
    bgnde: yyyymmdd(new Date(Date.now() - 13*86400000)),
    endde:  yyyymmdd(new Date()),
  })

  // 최초: 시도 + 품종대분류
  useEffect(() => {
    ;(async () => {
      const s = await getSido(); setSido(s.items || [])
      const k = await getKind(filters.upkind); setKinds(k.items || [])
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 시도 선택 → 시군구 로드
  useEffect(() => {
    ;(async () => {
      if (!filters.upr_cd) { setSigungu([]); return }
      const g = await getSigungu(filters.upr_cd); setSigungu(g.items || [])
    })()
  }, [filters.upr_cd])

  // 시군구 선택 → 보호소 로드
  useEffect(() => {
    ;(async () => {
      if (!filters.upr_cd || !filters.org_cd) { setShelters([]); return }
      const sh = await getShelter(filters.upr_cd, filters.org_cd); setShelters(sh.items || [])
    })()
  }, [filters.upr_cd, filters.org_cd])

  const search = async () => {
    setLoading(true)
    try {
      const { items } = await getRescues(filters)
      setList((items || []).map(mapAnimal))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{padding:'20px'}}>
      <h2 style={{margin:'8px 0 16px'}}>실시간 구조/공고 목록</h2>

      {/* 필터 */}
      <div className="filters"
           style={{display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:'8px', margin:'12px 0'}}>
        <select value={filters.upr_cd}
                onChange={e => setFilters(f => ({...f, upr_cd:e.target.value, org_cd:'', care_reg_no:''}))}>
          <option value="">시도</option>
          {sido.map(s => <option key={s.orgCd} value={s.orgCd}>{s.orgdownNm}</option>)}
        </select>

        <select value={filters.org_cd}
                onChange={e => setFilters(f => ({...f, org_cd:e.target.value, care_reg_no:''}))}
                disabled={!filters.upr_cd}>
          <option value="">시군구</option>
          {sigungu.map(g => <option key={g.orgCd} value={g.orgCd}>{g.orgdownNm}</option>)}
        </select>

        <select value={filters.care_reg_no}
                onChange={e => setFilters(f => ({...f, care_reg_no:e.target.value}))}
                disabled={!filters.org_cd}>
          <option value="">보호소</option>
          {shelters.map(sh => <option key={sh.careRegNo} value={sh.careRegNo}>{sh.careNm}</option>)}
        </select>

        <button onClick={search} disabled={loading}>{loading ? '불러오는 중...' : '검색'}</button>
      </div>

      {/* 리스트 */}
      <ul className="grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:'12px'}}>
        {list.map(a => (
          <li key={a.id} className="card" style={{border:'1px solid #eee', borderRadius:12, overflow:'hidden'}}>
            <div style={{aspectRatio:'4/3', background:'#f5f5f5'}}>
              <img
                src={a.image || a.thumb}
                alt=""
                loading="lazy"
                onError={(e)=>{ e.currentTarget.src='/placeholder-600x450.png' }}
                style={{width:'100%', height:'100%', objectFit:'cover'}}
              />
            </div>
            <div style={{padding:'10px', fontSize:14, lineHeight:1.4}}>
              <strong style={{display:'block', marginBottom:6}}>{a.processState || '상태미상'}</strong>
              <div>{a.species} · {a.gender} · {a.neuter}</div>
              <div>{a.noticeStart} ~ {a.noticeEnd}</div>
              <div style={{color:'#555'}}>{a.shelterName}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
