import { useState, useEffect } from 'react';
import POSView from './components/POSView';
import InvoicesView from './components/InvoicesView';
import StatsView from './components/StatsView';
import ClientsView from './components/ClientsView';
import ItemsView from './components/ItemsView';

const API_BASE = 'http://localhost:8000/api';

function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [todaySales, setTodaySales] = useState({ total_sales: 0, total_invoices: 0 });

  useEffect(() => {
    fetch(`${API_BASE}/stats?days=1`)
      .then(res => res.json())
      .then(data => setTodaySales(data))
      .catch(console.error);
  }, [activeTab]);

  const renderContent = () => {
    switch(activeTab) {
      case 'pos': return <POSView apiBase={API_BASE} onCheckout={() => setActiveTab('invoices')} />;
      case 'invoices': return <InvoicesView apiBase={API_BASE} />;
      case 'stats': return <StatsView apiBase={API_BASE} />;
      case 'clients': return <ClientsView apiBase={API_BASE} />;
      case 'items': return <ItemsView apiBase={API_BASE} />;
      default: return <POSView apiBase={API_BASE} />;
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ fontSize: '3rem' }}>✂️</div>
          <h1>صالون الحلاق</h1>
          <p>نظام إدارة المبيعات المطور</p>
        </div>
        
        <nav className="nav-menu">
          <div className={`nav-item ${activeTab === 'pos' ? 'active' : ''}`} onClick={() => setActiveTab('pos')}>
            💸 نقطة البيع
          </div>
          <div className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            📊 الإحصائيات
          </div>
          <div className={`nav-item ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
            🧾 الفواتير
          </div>
          <div className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
            👥 العملاء
          </div>
          <div className={`nav-item ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>
            🗂️ الأسعار والخدمات
          </div>
        </nav>

        <div className="sidebar-summary">
          <p>مبيعات اليوم</p>
          <h2>{todaySales?.total_sales?.toLocaleString()} ج.م</h2>
          <p>{todaySales?.total_invoices} فاتورة</p>
        </div>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
