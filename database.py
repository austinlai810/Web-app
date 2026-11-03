from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./notes.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# these are the tables that are saved in the database

class NoteDB(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)

class TransactionDB(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    description = Column(String, default="")
    amount = Column(Float)
    category = Column(String, default="")
    subcategory = Column(String, default="")
    direction = Column(String, default="")
    imported_at = Column(DateTime)

class CategoryRuleDB(Base):
    __tablename__ = "category_rules"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, unique=True)
    category = Column(String, default="")
    subcategory = Column(String, default="")