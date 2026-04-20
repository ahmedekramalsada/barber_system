import { useState, useEffect } from 'react';

export default function StatsView({ apiBase }) {
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetch(`${apiBase}/stats?days=${days}`).then(r => r.json()).then(d => setStats(d));
  }, [apiBase, days]);

  if (!stats) return <p>جاري التحميل...</p>;

  const topItems = Object.entries(stats.top_items || {}).sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);

  return (
    <>
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h2 className="page-title">📊 الإحصائيات</h2>
          <p className="page-subtitle">نظرة شاملة على أداء الصالون</p>
        </div>
        <select value={days} onChange={e => setDays(Number(e.target.value))} style={{width:'200px'}}>
          <option value={1}>اليوم</option>
          <option value={7}>آخر أسبوع</option>
          <option value={30}>آخر شهر</option>
          <option value={365}>السنة كاملة</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="kpi-card">
          <div className="kpi-label">إجمالي تفاصيل المبيعات</div>
          <p className="kpi-val" style={{color: '#e63946'}}>{stats.total_sales?.toLocaleString() || 0} <small style={{fontSize:'1rem'}}>ج.م</small></p>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">عدد الفواتير</div>
          <p className="kpi-val" style={{color: '#0d1b2a'}}>{stats.total_invoices || 0}</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">متوسط قيمة الفاتورة</div>
          <p className="kpi-val" style={{color: '#10b981'}}>{Math.round(stats.avg_sale || 0).toLocaleString()} <small style={{fontSize:'1rem'}}>ج.م</small></p>
        </div>
      </div>

      {topItems.length > 0 && (
        <div className="glass-card">
          <h3 className="card-header">🔥 أعلى الخدمات والمنتجات مبيعاً</h3>
          <div className="item-grid">
            {topItems.map(([name, data]) => (
              <div key={name} className="item-card" style={{cursor:'default', transform:'none'}}>
                <div className="item-name">{name}</div>
                <div style={{fontSize:'1.8rem', fontWeight: 900, color: '#e63946'}}>{data.rev.toLocaleString()} ج.م</div>
                <div className="item-stock">المبيعات: {data.qty} مرة</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
