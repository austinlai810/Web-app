from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base, NoteDB, BudgetItemDB

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

class Note(BaseModel):
    title: str
    content: str

class BudgetItem(BaseModel):
    category: str = ""
    description: str = ""
    income: float = 0
    expense: float = 0

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def budget_to_dict(item: BudgetItemDB):
    return {
        "id": item.id,
        "category": item.category or "",
        "description": item.description or "",
        "income": item.income or 0,
        "expense": item.expense or 0,
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

@app.get("/budget-items")
def get_budget_items(db: Session = Depends(get_db)):
    return [budget_to_dict(item) for item in db.query(BudgetItemDB).all()]

@app.post("/budget-items")
def create_budget_item(item: BudgetItem, db: Session = Depends(get_db)):
    db_item = BudgetItemDB(
        category=item.category,
        description=item.description,
        income=item.income,
        expense=item.expense,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return budget_to_dict(db_item)

@app.put("/budget-items/{item_id}")
def update_budget_item(item_id: int, item: BudgetItem, db: Session = Depends(get_db)):
    db_item = db.query(BudgetItemDB).filter(BudgetItemDB.id == item_id).first()
    db_item.category = item.category
    db_item.description = item.description
    db_item.income = item.income
    db_item.expense = item.expense
    db.commit()
    db.refresh(db_item)
    return budget_to_dict(db_item)

@app.delete("/budget-items/{item_id}")
def delete_budget_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(BudgetItemDB).filter(BudgetItemDB.id == item_id).first()
    db.delete(db_item)
    db.commit()
    return {"message": "deleted"}
