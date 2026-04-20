import csv
import os
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data_pos")
CLIENTS_FILE = os.path.join(DATA_DIR, "clients.csv")
ITEMS_FILE = os.path.join(DATA_DIR, "items.csv")
INVOICES_FILE = os.path.join(DATA_DIR, "invoices.csv")
INVOICE_ITEMS_FILE = os.path.join(DATA_DIR, "invoice_items.csv")

CATEGORIES = ["حلاقة", "عناية", "صبغات", "أطفال", "منتجات الشعر", "منتجات الذقن"]
CAT_TYPE = {c: ("Product" if "منتجات" in c else "Service") for c in CATEGORIES}

def _init_all():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(CLIENTS_FILE):
        _sv(CLIENTS_FILE, [], ["id","name","phone","join_date","last_visit","total_visits","total_spent"])
    if not os.path.exists(ITEMS_FILE):
        DEFAULT_ITEMS = [
            {"name": "قص شعر", "price": 100.0, "category": "حلاقة", "item_type": "Service", "stock": -1, "active": 1},
            {"name": "حلاقة ذقن", "price": 60.0, "category": "حلاقة", "item_type": "Service", "stock": -1, "active": 1},
            {"name": "شامبو كلاسيك", "price": 85.0, "category": "منتجات الشعر", "item_type": "Product", "stock": 50, "active": 1},
        ]
        _sv(ITEMS_FILE, DEFAULT_ITEMS, ["name", "price", "category", "item_type", "stock", "active"])
    if not os.path.exists(INVOICES_FILE):
        _sv(INVOICES_FILE, [], ["id","client_id","client_name","date","total_amount","payment_method","notes"])
    if not os.path.exists(INVOICE_ITEMS_FILE):
        _sv(INVOICE_ITEMS_FILE, [], ["id","invoice_id","item_name","item_type","quantity","price","subtotal","date"])

def _ld(path):
    if not os.path.exists(path):
        return []
    with open(path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def _sv(path, rows, fieldnames=None):
    if not fieldnames and rows:
        fieldnames = list(rows[0].keys())
    elif not fieldnames:
        fieldnames = []
    with open(path, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

def _si(v, d=0):
    try:
        if v is None or v == "": return d
        return int(float(v))
    except: return d

def _sf(v, d=0.0):
    try:
        if v is None or v == "": return d
        return float(v)
    except: return d

def _ss(v, d=""):
    return str(v).strip() if v is not None else d

def _now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

_init_all()

# --- Clients ---
def clients_all():
    return _ld(CLIENTS_FILE)

def client_add(name, phone):
    rows = clients_all()
    for r in rows:
        if _ss(r.get("phone")) == phone:
            return False, f"⚠️ الرقم مسجل مسبقاً للعميل: {r['name']}"
    nid = max((_si(r.get("id")) for r in rows), default=0) + 1
    rows.append({"id": nid, "name": name, "phone": phone, "join_date": _now(), "last_visit": "", "total_visits": 0, "total_spent": 0.0})
    _sv(CLIENTS_FILE, rows, ["id","name","phone","join_date","last_visit","total_visits","total_spent"])
    return True, {"id": nid, "name": name, "phone": phone}

def client_update(cid, name, phone):
    rows = clients_all()
    for r in rows:
        if _si(r.get("id")) != cid and _ss(r.get("phone")) == phone:
            return False, "الرقم مسجل لعميل آخر"
    for r in rows:
        if _si(r.get("id")) == cid:
            r["name"] = name
            r["phone"] = phone
            _sv(CLIENTS_FILE, rows, ["id","name","phone","join_date","last_visit","total_visits","total_spent"])
            return True, "تم الحفظ"
    return False, "العميل غير موجود"

def client_delete(cid):
    rows = [r for r in clients_all() if _si(r.get("id")) != cid]
    _sv(CLIENTS_FILE, rows, ["id","name","phone","join_date","last_visit","total_visits","total_spent"])
    return True

# --- Items ---
def items_all():
    return [r for r in _ld(ITEMS_FILE) if _si(r.get("active", 1)) == 1]

def item_add(name, price, category, stock=-1):
    rows = _ld(ITEMS_FILE)
    for r in rows:
        if _ss(r.get("name")) == name: return False, "هذا العنصر موجود مسبقاً"
    rows.append({"name": name, "price": float(price), "category": category, "item_type": CAT_TYPE.get(category, "Service"), "stock": stock, "active": 1})
    _sv(ITEMS_FILE, rows, ["name", "price", "category", "item_type", "stock", "active"])
    return True, "تمت الإضافة"

def item_update(old_name, name=None, price=None, category=None, stock=None):
    rows = _ld(ITEMS_FILE)
    for r in rows:
        if _ss(r.get("name")) == old_name:
            if name: r["name"] = name.strip()
            if price is not None: r["price"] = float(price)
            if category: 
                r["category"] = category
                r["item_type"] = CAT_TYPE.get(category, "Service")
            if stock is not None: r["stock"] = int(stock)
            _sv(ITEMS_FILE, rows, ["name", "price", "category", "item_type", "stock", "active"])
            return True, "تم التحديث"
    return False, "العنصر غير موجود"

def item_delete(name):
    # Instead of deleting physically to keep invoice history intact, we could set active=0 or just delete if that's what the system did before.
    # The original Streamlit app actually deleted it from the CSV:
    rows = [r for r in _ld(ITEMS_FILE) if _ss(r.get("name")) != name]
    _sv(ITEMS_FILE, rows, ["name", "price", "category", "item_type", "stock", "active"])
    return True

# --- Invoices ---
def invoice_create(client_id, client_name, cart, payment_method, notes=""):
    try:
        now = _now()
        total = sum(_sf(v["price"]) * _si(v["quantity"]) for v in cart.values())
        
        inv_rows = _ld(INVOICES_FILE)
        nid = max((_si(r.get("id")) for r in inv_rows), default=0) + 1
        inv_rows.append({
            "id": nid, "client_id": client_id, "client_name": client_name,
            "date": now, "total_amount": round(total, 2),
            "payment_method": payment_method, "notes": notes,
        })
        _sv(INVOICES_FILE, inv_rows, ["id","client_id","client_name","date","total_amount","payment_method","notes"])

        ii_rows = _ld(INVOICE_ITEMS_FILE)
        ii_nid = max((_si(r.get("id")) for r in ii_rows), default=0) + 1
        for item in cart.values():
            qty, price = _si(item["quantity"]), _sf(item["price"])
            ii_rows.append({
                "id": ii_nid, "invoice_id": nid, "item_name": item["name"], "item_type": item["item_type"],
                "quantity": qty, "price": price, "subtotal": round(price * qty, 2), "date": now,
            })
            ii_nid += 1
        _sv(INVOICE_ITEMS_FILE, ii_rows, ["id","invoice_id","item_name","item_type","quantity","price","subtotal","date"])

        clients = clients_all()
        for c in clients:
            if _si(c.get("id")) == client_id:
                c["total_visits"] = _si(c.get("total_visits")) + 1
                c["total_spent"] = round(_sf(c.get("total_spent")) + total, 2)
                c["last_visit"] = now
                break
        _sv(CLIENTS_FILE, clients, ["id","name","phone","join_date","last_visit","total_visits","total_spent"])

        all_items = _ld(ITEMS_FILE)
        for item in cart.values():
            if _ss(item.get("item_type")) == "Product":
                for r in all_items:
                    if _ss(r.get("name")) == item["name"]:
                        r["stock"] = max(0, _si(r.get("stock")) - _si(item["quantity"]))
                        break
        _sv(ITEMS_FILE, all_items, ["name", "price", "category", "item_type", "stock", "active"])
        return nid
    except Exception as e:
        print("Invoice error:", e)
        return -1

def stats_get(days=30):
    result = {"total_sales": 0.0, "avg_sale": 0.0, "total_invoices": 0, "daily": {}, "top_items": {}, "payment_breakdown": {}}
    cutoff = datetime.now() - timedelta(days=days)
    rows = _ld(INVOICES_FILE)
    ii = _ld(INVOICE_ITEMS_FILE)
    
    recent = []
    for r in rows:
        try:
            d = datetime.strptime(_ss(r.get("date"))[:10], "%Y-%m-%d")
            if d >= cutoff: recent.append(r)
        except: continue
        
    if not recent: return result
    
    result["total_invoices"] = len(recent)
    result["total_sales"] = sum(_sf(r.get("total_amount")) for r in recent)
    result["avg_sale"] = result["total_sales"] / len(recent)
    
    for r in recent:
        day = _ss(r.get("date"))[:10]
        pm = _ss(r.get("payment_method"))
        amt = _sf(r.get("total_amount"))
        result["daily"][day] = result["daily"].get(day, 0) + amt
        result["payment_breakdown"][pm] = result["payment_breakdown"].get(pm, 0) + amt
        
    inv_ids = {_si(r.get("id")) for r in recent}
    for item in ii:
        if _si(item.get("invoice_id")) not in inv_ids: continue
        n, qty = _ss(item.get("item_name")), _si(item.get("quantity"))
        sub = _sf(item.get("subtotal")) or _sf(item.get("price")) * qty
        if n not in result["top_items"]: result["top_items"][n] = {"qty": 0, "rev": 0.0}
        result["top_items"][n]["qty"] += qty
        result["top_items"][n]["rev"] += sub
        
    return result
