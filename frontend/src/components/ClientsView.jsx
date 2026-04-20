import { useState, useEffect } from 'react';

export default function ClientsView({ apiBase }) {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');

  // Edit states
  const [editClient, setEditClient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const fetchClients = () => {
    fetch(`${apiBase}/clients`).then(r => r.json()).then(d => setClients(d));
  };

  useEffect(() => {
    fetchClients();
  }, [apiBase]);

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  const startEdit = (c) => {
    setEditClient(c);
    setEditName(c.name);
    setEditPhone(c.phone);
  };

  const handleSave = async () => {
    if(!editName || !editPhone) return alert("أدخل كافة البيانات");
    const res = await fetch(`${apiBase}/clients/${editClient.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, phone: editPhone })
    });
    if (res.ok) {
      alert("✅ تم تعديل بيانات العميل بنجاح");
      setEditClient(null);
      fetchClients();
    } else {
      const err = await res.json();
      alert("خطأ: " + err.detail);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف العميل: ${name}؟\nتنبيه: ستبقى فواتيره القديمة مسجلة.لحفظ البيانات المالية.`)) return;
    const res = await fetch(`${apiBase}/clients/${id}`, { method: 'DELETE' });
    if(res.ok) {
      alert("🗑️ تم الحذف");
      fetchClients();
    }
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">👥 إدارة العملاء</h2>
        <p className="page-subtitle">عرض تفاصيل وبيانات العملاء الخاصين بك وتعديلها</p>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <input 
          placeholder="🔍 ابحث بالاسم أو رقم الهاتف..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ maxWidth: '400px' }}
        />
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-label">إجمالي العملاء</div>
          <p className="kpi-val">{clients.length}</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">إجمالي مدفوعاتهم</div>
          <p className="kpi-val">{clients.reduce((sum, c) => sum + parseFloat(c.total_spent || 0), 0).toLocaleString()} <small>ج.م</small></p>
        </div>
      </div>

      {editClient && (
        <div className="glass-card" style={{ marginBottom: '24px', borderLeft: '4px solid #0284c7' }}>
          <h3 style={{marginTop: 0}}>✏️ تعديل بيانات: {editClient.name}</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="الاسم" />
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="رقم الهاتف" />
            <button className="btn btn-success" style={{width:'auto'}} onClick={handleSave}>💾 حفظ التعديلات</button>
            <button className="btn" style={{width:'auto', background:'#e2e8f0'}} onClick={() => setEditClient(null)}>إلغاء</button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>الهاتف</th>
              <th>الزيارات</th>
              <th>المدفوعات</th>
              <th>تاريخ الانضمام</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td style={{fontWeight:800}}>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.total_visits}</td>
                <td style={{color:'#10b981', fontWeight:800}}>{parseFloat(c.total_spent).toLocaleString()} ج.م</td>
                <td>{String(c.join_date).substring(0, 10)}</td>
                <td>
                  <button className="qty-btn" style={{ color: '#0284c7' }} onClick={() => startEdit(c)}>✏️</button>
                  <button className="qty-btn" style={{ color: '#e63946', marginLeft: '8px' }} onClick={() => handleDelete(c.id, c.name)}>🗑</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="7" style={{textAlign:'center', padding: '32px'}}>لا يوجد عملاء يطابقون البحث.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
