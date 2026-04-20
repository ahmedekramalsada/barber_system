import { useState, useEffect } from 'react';

export default function ItemsView({ apiBase }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editItem, setEditItem] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(-1);

  const ALL_CATEGORIES = ["حلاقة", "عناية", "صبغات", "أطفال", "منتجات الشعر", "منتجات الذقن"];

  const fetchItems = () => {
    fetch(`${apiBase}/items`)
      .then(r => r.json())
      .then(d => {
        setItems(d.items);
        setCategories(Object.keys(d.categories));
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchItems();
  }, [apiBase]);

  const handleSave = async () => {
    if (!name || !price || !category) return alert("يرجى ملء كافة الحقول الأساسية");
    
    const payload = { name, price: Number(price), category, stock: Number(stock) };
    const url = editItem ? `${apiBase}/items/${encodeURIComponent(editItem.name)}` : `${apiBase}/items`;
    const method = editItem ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert("✅ تم الحفظ بنجاح");
      setEditItem(null);
      setName(''); setPrice(''); setCategory(ALL_CATEGORIES[0]); setStock(-1);
      fetchItems();
    } else {
      const err = await res.json();
      alert("خطأ: " + err.detail);
    }
  };

  const handleDelete = async (itemName) => {
    if (!window.confirm(`هل أنت متأكد من حذف القيد: ${itemName}؟`)) return;
    const res = await fetch(`${apiBase}/items/${encodeURIComponent(itemName)}`, { method: 'DELETE' });
    if (res.ok) {
      alert("🗑️ تم الحذف");
      fetchItems();
    }
  };

  const startEdit = (it) => {
    setEditItem(it);
    setName(it.name);
    setPrice(it.price);
    setCategory(it.category);
    setStock(it.stock);
  };

  const cancelEdit = () => {
    setEditItem(null);
    setName(''); setPrice(''); setCategory(ALL_CATEGORIES[0]); setStock(-1);
  };

  if (loading) return <p>جاري التحميل...</p>;

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">🗂️ إدارة الأسعار والخدمات</h2>
        <p className="page-subtitle">أضف خدمات جديدة، قم بتعديل الأسعار والمخزون، أو احذف ما لا تحتاجه.</p>
      </div>

      <div className="pos-layout" style={{ height: 'auto' }}>
        <div className="checkout-panel" style={{ flex: 1, position: 'relative', top: 0 }}>
          <div className="glass-card">
            <h3 className="card-header">{editItem ? "✏️ تعديل خدمة/منتج" : "➕ إضافة جديد"}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label>الاسم</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: حلاقة ذقن" />
              </div>
              <div>
                <label>السعر (ج.م)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label>التصنيف</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="" disabled>اختر التصنيف...</option>
                  {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label>المخزون (-1 لخدمة بدون مخزون)</label>
                <input type="number" value={stock} onChange={e => setStock(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="btn btn-success" onClick={handleSave}>💾 حفظ</button>
                {editItem && <button className="btn" style={{ background: '#e2e8f0' }} onClick={cancelEdit}>إلغاء</button>}
              </div>
            </div>
          </div>
        </div>

        <div className="items-panel" style={{ flex: 2 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>التصنيف</th>
                  <th>السعر</th>
                  <th>المخزون المتاح</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.name}>
                    <td style={{ fontWeight: 800 }}>{it.name}</td>
                    <td>{it.category}</td>
                    <td style={{ color: '#e63946', fontWeight: 900 }}>{it.price} ج.م</td>
                    <td>{it.item_type === 'Service' || it.stock === -1 ? '—' : it.stock}</td>
                    <td>
                      <button className="qty-btn" style={{ color: '#0284c7' }} onClick={() => startEdit(it)}>✏️</button>
                      <button className="qty-btn" style={{ color: '#e63946', marginLeft: '8px' }} onClick={() => handleDelete(it.name)}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
