from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Note(BaseModel):
    title: str
    content: str

notes = []

@app.get("/notes")
def get_notes():
    return notes

@app.post("/notes")
def create_note(note: Note):
    notes.append(note)
    return note

@app.delete("/notes/{note_id}")
def delete_note(note_id: int):
    del notes[note_id]
    return {"message": "deleted"}