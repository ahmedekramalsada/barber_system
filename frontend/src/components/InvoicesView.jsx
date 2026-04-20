import { useState, useEffect } from 'react';

export default function InvoicesView({ apiBase }) {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetch(`${apiBase}/invoices`).then(r => r.json()).then(d => setInvoices(d));
  }, [apiBase]);

  const exportCSV = () => {
    if(invoices.length === 0) return alert("لا توجد بيانات للتصدير");

    // CSV Header
    let csvContent = "رقم الفاتورة,التاريخ,العميل,المبلغ الاجمالي,طريقة الدفع,الخدمات\n";

    invoices.forEach(inv => {
      const itemsList = inv.items?.map(it => `${it.item_name}(x${it.quantity})`).join(" + ") || "";
      // Escape commas in strings or items
      const row = [
        inv.id,
        inv.date,
        `"${inv.client_name}"`,
        inv.total_amount,
        `"${inv.payment_method}"`,
        `"${itemsList}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    // Create Blob and trigger download
    // Use BOM \uFEFF to force Excel to read UTF-8 properly for Arabic
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="page-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h2 className="page-title">🧾 الفواتير</h2>
          <p className="page-subtitle">استعرض جميع الفواتير الصادرة</p>
        </div>
        <button className="btn btn-success" style={{width: 'auto', padding: '12px 24px'}} onClick={exportCSV}>
          📥 تصدير إلى Excel (CSV)
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>التاريخ</th>
              <th>العميل</th>
              <th>المبلغ الكلي</th>
              <th>طريقة الدفع</th>
              <th>الخدمات المباعة</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td>#{inv.id}</td>
                <td>{String(inv.date).substring(0, 16)}</td>
                <td style={{fontWeight:800}}>{inv.client_name}</td>
                <td style={{fontWeight: 900, color: '#e63946'}}>{parseFloat(inv.total_amount).toLocaleString()} ج.م</td>
                <td>{inv.payment_method}</td>
                <td>
                  <ul style={{margin: 0, paddingRight: 20}}>
                    {inv.items?.map((it, i) => (
                      <li key={i}>{it.item_name} (×{it.quantity})</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan="6" style={{textAlign:'center', padding: '32px'}}>لا توجد فواتير بعد.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
