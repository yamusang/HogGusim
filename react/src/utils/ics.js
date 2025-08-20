// src/utils/ics.js
// 간단 iCalendar(.ics) 빌더 — 외부 라이브러리 없이 사용
// reservedAt(ISO), title, description, location을 받아 .ics 텍스트를 반환

const pad = (n) => String(n).padStart(2, '0');

// Date → YYYYMMDDTHHmmssZ (UTC)
function toICSDateUTC(iso) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mm = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
}

// 기본 1시간짜리 이벤트 가정(필요하면 duration 분으로 바꿔도 됨)
function addHours(iso, hours = 1) {
  const d = new Date(iso);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

export function buildICS({ uid, startISO, endISO, title, description, location }) {
  const dtstamp = toICSDateUTC(new Date().toISOString());
  const dtstart = toICSDateUTC(startISO);
  const dtend   = toICSDateUTC(endISO || addHours(startISO, 1));

  // RFC5545 라인분리와 특수문자 이스케이프 최소 처리
  const esc = (s='') => String(s)
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//matchpet//shelter//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid || `${Date.now()}@matchpet`}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${esc(title)}`,
    description ? `DESCRIPTION:${esc(description)}` : null,
    location ? `LOCATION:${esc(location)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].filter(Boolean).join('\r\n');
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
