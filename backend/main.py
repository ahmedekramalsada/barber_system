from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend import db

app = FastAPI(title="Barber POS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClientAddReq(BaseModel):
    name: str
    phone: str

class InvoiceReq(BaseModel):
    client_id: int
    client_name: str
    cart: Dict[str, Any]
    payment_method: str
    notes: Optional[str] = ""

@app.get("/api/items")
def get_items():
    items = db.items_all()
    # Group by category for easier frontend rendering
    categories = {}
    for i in items:
        cat = i["category"]
        if cat not in categories: categories[cat] = []
        categories[cat].append(i)
    return {"items": items, "categories": categories}

class ItemReq(BaseModel):
    name: str
    price: float
    category: str
    stock: int = -1

@app.post("/api/items")
def add_item(req: ItemReq):
    ok, msg = db.item_add(req.name, req.price, req.category, req.stock)
    if not ok: raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

@app.put("/api/items/{old_name}")
def edit_item(old_name: str, req: ItemReq):
    ok, msg = db.item_update(old_name, req.name, req.price, req.category, req.stock)
    if not ok: raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

@app.delete("/api/items/{name}")
def delete_item(name: str):
    db.item_delete(name)
    return {"message": "تم الحذف"}

@app.get("/api/clients")
def get_clients():
    return db.clients_all()

@app.post("/api/clients")
def add_client(req: ClientAddReq):
    ok, msg = db.client_add(req.name, req.phone)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": "Client added successfully", "client": msg}

@app.put("/api/clients/{cid}")
def edit_client(cid: int, req: ClientAddReq):
    ok, msg = db.client_update(cid, req.name, req.phone)
    if not ok: raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

@app.delete("/api/clients/{cid}")
def delete_client(cid: int):
    db.client_delete(cid)
    return {"message": "تم الحذف"}

@app.post("/api/invoices")
def create_invoice(req: InvoiceReq):
    nid = db.invoice_create(
        client_id=req.client_id,
        client_name=req.client_name,
        cart=req.cart,
        payment_method=req.payment_method,
        notes=req.notes
    )
    if nid < 0:
        raise HTTPException(status_code=500, detail="Failed to create invoice")
    return {"message": "Invoice created", "invoice_id": nid}

@app.get("/api/stats")
def get_stats(days: int = 30):
    return db.stats_get(days)

@app.get("/api/invoices")
def get_invoices():
    # Return all invoices with their items
    inv_rows = db._ld(db.INVOICES_FILE)
    ii_all = db._ld(db.INVOICE_ITEMS_FILE)
    
    result = []
    for r in inv_rows:
        r2 = dict(r)
        r2["items"] = [x for x in ii_all if db._si(x.get("invoice_id")) == db._si(r.get("id"))]
        result.append(r2)
    return sorted(result, key=lambda x: str(x.get("date", "")), reverse=True)
