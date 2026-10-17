import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

type Variant = 'A' | 'B' | 'C' | 'D' | 'E';
type ConceptId = 'A' | 'B' | 'C' | 'D';
type Concept = { id: ConceptId; label: string; gender: string; note: string; image: string; color: string };

const concepts: Concept[] = [
  { id: 'A', label: 'Thanh y', gender: 'Nữ', note: 'Điềm tĩnh · ngọc lục', image: '/characters/A-thanh-y.png', color: '#9bc3a7' },
  { id: 'B', label: 'Lam y', gender: 'Nam', note: 'Kiên định · lam nhạt', image: '/characters/B-lam-y.png', color: '#92b8d4' },
  { id: 'C', label: 'Vân y', gender: 'Nữ', note: 'Tự tin · màu đất', image: '/characters/C-van-y.png', color: '#d6a78c' },
  { id: 'D', label: 'Mặc y', gender: 'Nam', note: 'Trầm ổn · nâu mực', image: '/characters/D-mac-y.png', color: '#c9b49c' },
];

const variants: Record<Variant, { title: string; description: string; good: string; cost: string }> = {
  A: { title: 'Sổ nhập môn', description: 'Tên ở bên trái, chân dung nhân vật cố định ở bên phải.', good: 'Rõ ràng, nhập tên nhanh.', cost: 'Ít thấy khung cảnh làng.' },
  B: { title: 'Cổng Nam Lĩnh', description: 'Cổng làng và nhân vật chiếm màn hình; ô tên nằm ở mép dưới.', good: 'Cảm giác bước vào thế giới game.', cost: 'Ô nhập ít nổi bật hơn.' },
  C: { title: 'Mệnh bài', description: 'Giao diện như một tấm thẻ thân phận được khắc tên.', good: 'Tên nhân vật thành điểm nhấn.', cost: 'Bố cục nghi lễ hơn là hành động.' },
  D: { title: 'Đối thoại trưởng làng', description: 'Một lời chào trong làng dẫn thẳng đến ô đặt tên.', good: 'Mở truyện tự nhiên.', cost: 'Cần thêm lời thoại mở đầu.' },
  E: { title: 'Bình minh Nam Lĩnh', description: 'Cửa sổ đặt tên gọn trên nền toàn cảnh làng tân thủ.', good: 'Thoáng, thấy điểm xuất hiện.', cost: 'Chân dung được thu nhỏ.' },
};

function VillageCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const { width: w, height: h } = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * ratio));
      canvas.height = Math.max(1, Math.round(h * ratio));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#172e36'); sky.addColorStop(.48, '#698d87'); sky.addColorStop(1, '#a8ad82');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w * .62, h * .28, 12, w * .62, h * .28, h * .38);
      glow.addColorStop(0, '#f7e9bfaa'); glow.addColorStop(.45, '#f7e9bf33'); glow.addColorStop(1, '#f7e9bf00');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f5e8c4'; ctx.beginPath(); ctx.arc(w * .62, h * .28, h * .055, 0, Math.PI * 2); ctx.fill();
      const mountain = (base: number, amplitude: number, color: string, phase: number) => {
        ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h * base);
        for (let x = 0; x <= w + 16; x += 16) ctx.lineTo(x, h * base - Math.sin(x / w * Math.PI * 3 + phase) * amplitude - Math.sin(x / w * Math.PI * 8 + phase) * amplitude * .22);
        ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      };
      mountain(.61, h * .12, '#456d68', 1.6);
      mountain(.72, h * .075, '#315c54', 3.1);
      mountain(.83, h * .048, '#234d46', 5.4);
      ctx.fillStyle = '#d7d9b7'; ctx.globalAlpha = .18;
      for (let i = 0; i < 4; i++) ctx.fillRect(0, h * (.66 + i * .055), w, 4 + i * 2);
      ctx.globalAlpha = 1;
      const ground = ctx.createLinearGradient(0, h * .75, 0, h);
      ground.addColorStop(0, '#3c6655'); ground.addColorStop(1, '#1b3d39');
      ctx.fillStyle = ground; ctx.fillRect(0, h * .81, w, h * .19);
      for (let i = -4; i <= 4; i++) {
        const x = w * .5 + i * w * .078, y = h * .79 + Math.abs(i) * h * .009;
        const houseWidth = Math.max(34, w * .039);
        ctx.fillStyle = '#24423e'; ctx.fillRect(x - houseWidth / 2, y - 27, houseWidth, 40);
        ctx.beginPath(); ctx.moveTo(x - houseWidth * .68, y - 26); ctx.lineTo(x, y - 43); ctx.lineTo(x + houseWidth * .68, y - 26); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e0c28a'; ctx.fillRect(x - 4, y - 9, 8, 10);
      }
      ctx.fillStyle = '#d7c69c77'; ctx.beginPath(); ctx.moveTo(w * .45, h); ctx.quadraticCurveTo(w * .49, h * .82, w * .52, h * .82); ctx.quadraticCurveTo(w * .55, h * .91, w * .62, h); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 22; i++) {
        const x = ((i * 67.3 + 11) % 1000) / 1000 * w;
        const y = h * (.2 + ((i * 39.7) % 620) / 1000);
        ctx.fillStyle = i % 3 === 0 ? '#f6e6b68c' : '#f6e6b650';
        ctx.beginPath(); ctx.arc(x, y, i % 4 === 0 ? 1.8 : 1, 0, Math.PI * 2); ctx.fill();
      }
      for (const side of [0, 1]) for (let i = 0; i < 5; i++) {
        const x = side ? w - 15 - i * 21 : 15 + i * 21, top = h * (.33 + (i % 3) * .08);
        ctx.strokeStyle = '#173d37a8'; ctx.lineWidth = 3 + (i % 2);
        ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + (side ? -12 : 12), top); ctx.stroke();
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  return <canvas className="village-canvas" ref={ref} aria-label="Minh họa làng tân thủ Nam Lĩnh" />;
}

type UI = { concept: Concept; name: string; setName: (value: string) => void; error: string; busy: boolean; submit: () => void };

function NameInput({ ui, id }: { ui: UI; id: string }) {
  return <label className="name-field" htmlFor={id}><span>Tên nhân vật</span><input id={id} value={ui.name} onChange={event => ui.setName(event.target.value)} placeholder="Nhập tên nhân vật" maxLength={24} autoComplete="off" /><small>Tên này sẽ hiện trên nhân vật của bạn.</small></label>;
}

function Submit({ ui, text = 'Bắt đầu hành trình' }: { ui: UI; text?: string }) {
  return <div className="submit-wrap"><button className="gold-button" onClick={ui.submit} disabled={ui.busy}>{ui.busy ? 'Đang vào làng...' : text}<span>→</span></button>{ui.error && <p className="error-message" role="alert">{ui.error}</p>}</div>;
}

function Character({ concept, className = '' }: { concept: Concept; className?: string }) {
  return <img className={`character ${className}`} src={concept.image} alt={`Nhân vật chính dự kiến: ${concept.label}`} />;
}

function VariantA({ ui }: { ui: UI }) {
  return <div className="layout-a layout-content"><section className="panel a-panel"><span className="eyebrow">CHƯƠNG MỞ ĐẦU · NAM LĨNH</span><h1>Đặt tên cho<br /><em>hành trình của bạn</em></h1><p>Mỗi người tu tiên đều bắt đầu từ một cái tên. Sau khi xác nhận, bạn sẽ xuất hiện tại làng tân thủ Nam Lĩnh.</p><div className="thin-line" /><NameInput ui={ui} id="name-a" /><Submit ui={ui} /></section><div className="a-portrait"><span className="portrait-ring" /><Character concept={ui.concept} /><div className="portrait-caption"><span>NHÂN VẬT CHÍNH</span><strong>Một dáng hình, nhiều hành trình</strong><small>Diện mạo bạn đã chọn</small></div></div></div>;
}

function VariantB({ ui }: { ui: UI }) {
  return <div className="layout-b layout-content"><div className="gate-title"><span className="eyebrow">LÀNG TÂN THỦ · NAM LĨNH</span><h1>Tiên lộ mở từ đây</h1><p>Hãy cho thế giới này biết tên của bạn.</p></div><Character concept={ui.concept} className="gate-character" /><div className="gate-panel panel"><div><span className="eyebrow">BƯỚC DUY NHẤT</span><h2>Nhập tên nhân vật</h2></div><NameInput ui={ui} id="name-b" /><Submit ui={ui} text="Bước qua cổng làng" /></div></div>;
}

function VariantC({ ui }: { ui: UI }) {
  return <div className="layout-c layout-content"><div className="identity-card panel"><span className="eyebrow">MỆNH BÀI TÂN TU</span><div className="card-art"><Character concept={ui.concept} /></div><div className="card-base"><span>KHỞI ĐẦU TẠI</span><strong>Nam Lĩnh</strong><small>Làng tân thủ · Vùng phương Nam</small></div></div><section className="c-copy"><span className="eyebrow">TIÊN DANH ĐẦU TIÊN</span><h1>Khắc tên<br />lên mệnh bài</h1><p>Một cái tên để bắt đầu câu chuyện. Nhân vật sẽ xuất hiện trong làng tân thủ Nam Lĩnh khi bạn xác nhận.</p><div className="c-form panel"><NameInput ui={ui} id="name-c" /><Submit ui={ui} text="Xác nhận tiên danh" /></div></section></div>;
}

function VariantD({ ui }: { ui: UI }) {
  return <div className="layout-d layout-content"><div className="dialogue-location">LÀNG TÂN THỦ &nbsp; / &nbsp; NAM LĨNH</div><Character concept={ui.concept} className="dialogue-character" /><div className="dialogue-panel panel"><div className="npc-mark">村</div><div className="dialogue-copy"><span className="eyebrow">TRƯỞNG LÀNG</span><h2>Người mới đến à? Hãy cho ta biết tên của ngươi.</h2><p>Từ đây, con đường tu tiên của ngươi sẽ bắt đầu.</p></div><div className="dialogue-form"><NameInput ui={ui} id="name-d" /><Submit ui={ui} text="Trả lời trưởng làng" /></div></div></div>;
}

function VariantE({ ui }: { ui: UI }) {
  return <div className="layout-e layout-content"><div className="dawn-label"><span className="eyebrow">BÌNH MINH Ở NAM LĨNH</span><h1>Một tên gọi.<br />Một khởi đầu.</h1><p>Bạn sẽ tỉnh dậy tại làng tân thủ.</p></div><div className="dawn-card panel"><div className="dawn-art"><Character concept={ui.concept} /></div><div className="dawn-form"><span className="eyebrow">TẠO NHÂN VẬT</span><h2>Bạn muốn được gọi là gì?</h2><NameInput ui={ui} id="name-e" /><Submit ui={ui} text="Vào làng Nam Lĩnh" /></div></div><div className="dawn-foot">✧ &nbsp; Điểm xuất hiện cố định: làng tân thủ Nam Lĩnh</div></div>;
}

function VillageArrival({ ui, back }: { ui: UI; back: () => void }) {
  return <div className="arrival"><div className="arrival-hud"><div className="hud-emblem">✦</div><div><strong>{ui.name.trim()}</strong><small>Người mới · Nam Lĩnh</small></div></div><div className="arrival-quest"><span>NHIỆM VỤ MỞ ĐẦU</span><strong>Gặp trưởng làng</strong><small>Tìm người dẫn đường trong làng tân thủ.</small></div><Character concept={ui.concept} className="arrival-character" /><div className="arrival-message panel"><span className="eyebrow">ĐÃ VÀO LÀNG TÂN THỦ</span><h1>Chào mừng, {ui.name.trim()}</h1><p>Hành trình của bạn bắt đầu tại Nam Lĩnh.</p><button className="outline-button" onClick={back}>Xem lại màn hình đặt tên ↶</button></div><div className="arrival-hud-bottom"><span>Nam Lĩnh · Làng tân thủ</span><span>Nhiệm vụ &nbsp; · &nbsp; Túi đồ &nbsp; · &nbsp; Bản đồ</span></div></div>;
}

function App() {
  const search = new URLSearchParams(window.location.search);
  const startVariant = (['A', 'B', 'C', 'D', 'E'] as string[]).includes((search.get('variant') || '').toUpperCase()) ? search.get('variant')!.toUpperCase() as Variant : 'A';
  const startConcept = concepts.find(item => item.id === (search.get('hero') || '').toUpperCase()) || concepts[0];
  const [variant, setVariant] = useState<Variant>(startVariant);
  const [concept, setConcept] = useState<Concept>(startConcept);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [arrived, setArrived] = useState(false);
  const updatePreview = (nextVariant: Variant, nextConcept: Concept) => {
    setVariant(nextVariant); setConcept(nextConcept); setError(''); setArrived(false);
    window.history.replaceState(null, '', `?variant=${nextVariant}&hero=${nextConcept.id}`);
  };
  const submit = () => {
    if (!name.trim()) { setError('Hãy nhập tên nhân vật trước khi vào làng.'); return; }
    setError(''); setBusy(true);
    window.setTimeout(() => { setBusy(false); setArrived(true); }, 550);
  };
  const ui: UI = { concept, name, setName: value => { setName(value); if (error) setError(''); }, error, busy, submit };
  return <div className="preview-page">
    <header className="preview-header"><div className="preview-brand"><span className="brand-seal">仙</span><div><strong>GAME TIÊN HIỆP</strong><small>CHỌN NHÂN VẬT &amp; ĐẶT TÊN</small></div></div><div className="preview-badge">BẢN ĐỀ XUẤT</div></header>
    <section className="review-characters"><div className="review-title"><span>01 / CHỌN NHÂN VẬT CHÍNH</span><h2>Chọn nhân vật của bạn</h2><p>Chọn một trong bốn mẫu, rồi đặt tên để bắt đầu ở làng tân thủ Nam Lĩnh.</p></div><div className="concept-grid">{concepts.map(item => <button className={`concept-card ${concept.id === item.id ? 'selected' : ''}`} key={item.id} onClick={() => updatePreview(variant, item)} style={{ '--concept-color': item.color } as CSSProperties} aria-pressed={concept.id === item.id}><span className="concept-image"><img src={item.image} alt={`Mẫu ${item.id}: ${item.label}`} /></span><span className="concept-caption"><b>MẪU {item.id}</b><strong>{item.label}</strong><small>{item.gender} · {item.note}</small></span></button>)}</div></section>
    <section className="review-ui"><div className="review-ui-label"><span>02 / XEM CÁC BỐ CỤC ĐẶT TÊN</span><strong>Chọn nhân vật, nhập tên, rồi vào Nam Lĩnh</strong></div><div className="variant-tabs" role="tablist" aria-label="Năm bố cục giao diện">{(['A', 'B', 'C', 'D', 'E'] as Variant[]).map(item => <button role="tab" aria-selected={variant === item} className={variant === item ? 'active' : ''} key={item} onClick={() => updatePreview(item, concept)}><b>{item}</b><span>{variants[item].title}</span></button>)}</div></section>
    <div className="variant-description"><span>PHƯƠNG ÁN {variant}</span><strong>{variants[variant].description}</strong><span>ƯU ĐIỂM</span><strong>{variants[variant].good}</strong><span>ĐÁNH ĐỔI</span><strong>{variants[variant].cost}</strong></div>
    <main className={`game-frame variant-${variant.toLowerCase()}`}><VillageCanvas /><div className="frame-vignette" /><div className="game-header"><div className="game-logo"><span>仙</span><strong>TIÊN HIỆP</strong></div><div>CHƯƠNG MỞ ĐẦU &nbsp; / &nbsp; NAM LĨNH</div><div>✧ &nbsp; TÂN TU</div></div>{arrived ? <VillageArrival ui={ui} back={() => setArrived(false)} /> : variant === 'A' ? <VariantA ui={ui} /> : variant === 'B' ? <VariantB ui={ui} /> : variant === 'C' ? <VariantC ui={ui} /> : variant === 'D' ? <VariantD ui={ui} /> : <VariantE ui={ui} />}</main>
    <footer className="preview-footer"><span>Preview tương tác · Người chơi chọn nhân vật và đặt tên · Chưa phải gameplay hoàn chỉnh</span><span>Các tab A–E là phương án bố cục preview</span></footer>
  </div>;
}

export default App;
