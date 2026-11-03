import datetime
import csv
import io
from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base, NoteDB, TransactionDB, CategoryRuleDB

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# these classes describe what kind of data each route accepts. FastAPI checks incoming data against them and rejects anything that doesn’t fit.

class Note(BaseModel):
    title: str
    content: str

class Transaction(BaseModel):
    date: datetime.date
    description: str
    amount: float
    category: str
    subcategory: str
    direction: str

class ImportRequest(BaseModel):
    text: str

class TransactionUpdate(BaseModel):
    category: str = ""
    subcategory: str = ""
    direction: str = ""


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def transaction_to_dict(item: TransactionDB):
    return {
        "id": item.id,
        "date": item.date,
        "description": item.description,
        "amount": item.amount,
        "category": item.category,
        "subcategory": item.subcategory,
        "direction": item.direction,
        "imported_at": item.imported_at,
    }

@app.get("/")
def serve_home():
    return FileResponse("static/index.html")

@app.get("/notes-app")
def serve_notes():
    return FileResponse("static/notes.html")

@app.get("/budget")
def serve_budget():
    return FileResponse("static/budget.html")

@app.get("/budget/import")
def serve_budget_import():
    return FileResponse("static/budget-import.html")

@app.get("/notes")
def get_notes(db: Session = Depends(get_db)):
    return db.query(NoteDB).all()

@app.post("/notes")
def create_note(note: Note, db: Session = Depends(get_db)):
    db_note = NoteDB(title=note.title, content=note.content)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@app.put("/notes/{note_id}")
def update_note(note_id: int, note: Note, db: Session = Depends(get_db)):
    db_note = db.query(NoteDB).filter(NoteDB.id == note_id).first()
    db_note.title = note.title
    db_note.content = note.content
    db.commit()
    db.refresh(db_note)
    return db_note

@app.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    db_note = db.query(NoteDB).filter(NoteDB.id == note_id).first()
    db.delete(db_note)
    db.commit()
    return {"message": "deleted"}

@app.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):
    items = db.query(TransactionDB).order_by(TransactionDB.date.desc()).all()
    return [transaction_to_dict(item) for item in items]

@app.put("/transactions/{transaction_id}")
def update_transaction(transaction_id: int, transaction: TransactionUpdate, db: Session = Depends(get_db)):
    item = db.query(TransactionDB).filter(TransactionDB.id == transaction_id).first()
    item.category = transaction.category
    item.subcategory = transaction.subcategory
    item.direction = transaction.direction
    db.commit()
    db.refresh(item)
    return transaction_to_dict(item)

@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    item = db.query(TransactionDB).filter(TransactionDB.id == transaction_id).first()
    db.delete(item)
    db.commit()
    return {"message": "deleted"}

#below is the preview table and its logic

@app.post("/transactions/preview")
def preview_transactions(request: ImportRequest, db: Session = Depends(get_db)):
    rows = []
    rules = {r.description: r for r in db.query(CategoryRuleDB).all()}
    for row in csv.DictReader(io.StringIO(request.text)):
        date_value = datetime.datetime.strptime(row["Transaction Date"], "%m/%d/%Y").date()
        amount = float(row["Amount"])
        if amount < 0:
            direction = "out"
        else:
            direction = "in"
        rule = rules.get(row["Description"])
        if rule:
            category = rule.category
            subcategory = rule.subcategory
        else: 
            category = ""
            subcategory = ""
        rows.append({
            "date": date_value,
            "description": row["Description"],
            "amount": amount,
            "direction": direction,
            "category": category,
            "subcategory": subcategory,
        })
    return rows

@app.post("/transactions/confirm")
def confirm_transactions(rows: list[Transaction], db: Session = Depends(get_db)):
    imported_at =datetime.datetime.now()
    for row in rows:
        transaction = TransactionDB(
            date=row.date,
            description=row.description,
            amount=row.amount,
            direction=row.direction,
            category=row.category,
            subcategory=row.subcategory,
            imported_at=imported_at,
        )
        db.add(transaction)
    db.commit()
    return {"imported": len(rows)}

@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    rules = db.query(CategoryRuleDB).all()
    return [{"category": r.category, "subcategory": r.subcategory} for r in rules]



