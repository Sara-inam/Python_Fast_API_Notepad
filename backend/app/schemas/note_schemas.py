from pydantic import BaseModel
from typing import Optional

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class NoteResponse(BaseModel):
    id: int
    title: str
    content: Optional[str] = ""
    voice_message: Optional[str] = None

    class Config:
        orm_mode = True
