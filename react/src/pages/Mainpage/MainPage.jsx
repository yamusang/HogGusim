import React from 'react';
import Button from '../../components/ui/Button'
import './main-page.css'

export default function MainPage() {
  return (
    <main className="main">
      <div className="main__topbar">
      </div>

      <section className="main__hero">
        <h1>당신은 어떤 역할인가요?</h1>
        <p>추천 받은 목록에서 선택하고, 신청까지 한 번에.</p>
        <div className="main__roles">
          <Button presetName="senior" sizeName="lg" to="/senior">고령자</Button>
          <Button presetName="manager" sizeName="lg" to="/manager">펫매니저</Button>
          <Button presetName="shelter" sizeName="lg" to="/shelter">보호소</Button>
        </div>
      </section>
    </main>
  );
}
