import { useState, useEffect } from 'react';

export default function POSView({ apiBase, onCheckout }) {
  const [categories, setCategories] = useState({});
  const [clients, setClients] = useState([]);
  const [cart, setCart] = useState({});
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('نقداً 💵');
  
  // Quick Add Client form
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [showAddClient, setShowAddClient] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/items`).then(r => r.json()).then(d => setCategories(d.categories));
    fetch(`${apiBase}/clients`).then(r => r.json()).then(d => setClients(d));
  }, [apiBase]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev[item.name];
      if (existing) {
        if (item.item_type === 'Product' && existing.quantity >= item.stock) {
          alert(`المخزون المتاح ${item.stock} قطعة فقط`);
          return prev;
        }
        return { ...prev, [item.name]: { ...existing, quantity: existing.quantity + 1 } };
      }
      return { ...prev, [item.name]: { ...item, quantity: 1 } };
    });
  };

  const decrCart = (name) => {
    setCart(prev => {
      const curr = prev[name];
      if (!curr) return prev;
      if (curr.quantity > 1) return { ...prev, [name]: { ...curr, quantity: curr.quantity - 1 } };
      const newCart = { ...prev };
      delete newCart[name];
      return newCart;
    });
  };

  const rmCart = (name) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[name];
      return newCart;
    });
  };

  const cartTotal = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleAddClient = async () => {
    if(!newClientName || !newClientPhone) return alert("أدخل الاسم ورقم الهاتف");
    const res = await fetch(`${apiBase}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClientName, phone: newClientPhone })
    });
    if (res.ok) {
      const data = await res.json();
      setClients(prev => [...prev, data.client]);
      setSelectedClient(data.client);
      setShowAddClient(false);
      setNewClientName(''); setNewClientPhone('');
    } else {
      const err = await res.json();
      alert(err.detail || "خطأ في إضافة العميل");
    }
  };

  const checkout = async () => {
    if (!selectedClient) return alert("اختر العميل أولاً");
    if (Object.keys(cart).length === 0) return alert("السلة فارغة");
    
    const res = await fetch(`${apiBase}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        cart: cart,
        payment_method: paymentMethod,
        notes: ""
      })
    });
    
    if (res.ok) {
      setCart({});
      setSelectedClient(null);
      alert("✅ تم إصدار الفاتورة بنجاح!");
      onCheckout();
    } else {
      alert("حدث خطأ أثناء إصدار الفاتورة");
    }
  };

  return (
    <>
      <div className="page-header">
        <h2 className="page-title">💸 نقطة البيع</h2>
        <p className="page-subtitle">اختر الخدمات من اليمين وأتمم الدفع من اليسار</p>
      </div>

      <div className="pos-layout">
        {/* Items Grid */}
        <div className="items-panel">
          {Object.entries(categories).map(([catName, items]) => (
            <div key={catName} className="category-section">
              <div className="category-title">{catName}</div>
              <div className="item-grid">
                {items.map(item => {
                  const isProd = item.item_type === 'Product';
                  const inCart = cart[item.name]?.quantity || 0;
                  const oos = isProd && (item.stock <= 0 || inCart >= item.stock);
                  return (
                    <div key={item.name} className={`item-card ${oos ? 'oos' : ''}`} onClick={() => !oos && addToCart(item)}>
                      {inCart > 0 && <div className="item-qty-badge">✓ {inCart}</div>}
                      <span className={`item-tag ${isProd ? 'tag-product' : 'tag-service'}`}>
                        {isProd ? 'منتج' : 'خدمة'}
                      </span>
                      <div className="item-name">{item.name}</div>
                      <div className="item-price">{item.price} ج.م</div>
                      {isProd && <div className="item-stock">متاح: {item.stock - inCart}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Panel */}
        <div className="checkout-panel">
          <div className="glass-card">
            <h3 className="card-header">👤 العميل</h3>
            {!selectedClient ? (
              <>
                <input 
                  list="clients-datalist"
                  placeholder="🔍 ابحث بالاسم أو رقم الهاتف..."
                  onChange={(e) => {
                    const val = e.target.value;
                    const client = clients.find(c => `${c.name} • ${c.phone}` === val);
                    if (client) setSelectedClient(client);
                  }}
                  style={{ marginBottom: '12px' }}
                />
                <datalist id="clients-datalist">
                  {clients.map(c => <option key={c.id} value={`${c.name} • ${c.phone}`} />)}
                </datalist>
                
                <div>
                  {showAddClient ? (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                      <input placeholder="اسم العميل" value={newClientName} onChange={e => setNewClientName(e.target.value)} style={{marginBottom: 8}}/>
                      <input placeholder="رقم الهاتف" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} style={{marginBottom: 12}}/>
                      <button className="btn btn-primary" onClick={handleAddClient}>حفظ</button>
                    </div>
                  ) : (
                    <button className="btn" style={{background: '#e2e8f0'}} onClick={() => setShowAddClient(true)}>➕ تسجيل عميل جديد</button>
                  )}
                </div>
              </>
            ) : (
              <div className="client-selected-box">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <h4 className="csb-name">{selectedClient.name}</h4>
                  <button className="qty-btn" onClick={() => setSelectedClient(null)}>❌</button>
                </div>
                <p className="csb-meta">{selectedClient.phone} | الزيارات: {selectedClient.total_visits}</p>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-header">🛒 السلة</h3>
            {Object.keys(cart).length === 0 ? (
              <div className="cart-empty">السلة فارغة<br/>اضغط على الخدمات لإضافتها</div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {Object.values(cart).map(item => (
                  <div key={item.name} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">{item.price} ج.م × {item.quantity} = {item.price * item.quantity} ج.م</div>
                    </div>
                    <div className="cart-qty-ctrl">
                      <button className="qty-btn" onClick={() => addToCart(item)}>+</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => decrCart(item.name)}>-</button>
                    </div>
                    <button className="qty-btn" style={{color: '#e63946', background: 'transparent', boxShadow:'none', fontSize: '1.2rem'}} onClick={() => rmCart(item.name)}>🗑</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '24px' }}>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                {['نقداً 💵', 'فيزا / كارت 💳', 'إنستاباي 📱', 'تحويل بنكي 🏦'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="total-bar">
              <div className="total-label">الإجمالي الكلي</div>
              <div className="total-value">{cartTotal.toLocaleString()} ج.م</div>
            </div>

            <button className="btn btn-success" style={{ marginTop: '16px' }} onClick={checkout} disabled={cartTotal === 0 || !selectedClient}>
              ✅ تأكيد الدفع
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
