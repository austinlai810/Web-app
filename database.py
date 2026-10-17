from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./notes.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class NoteDB(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)

class BudgetItemDB(Base):
    __tablename__ = "budget_items"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, default="")
    description = Column(String, default="")
    income = Column(Float, default=0)
    expense = Column(Float, default=0)
