from sqlalchemy.orm import Session
from app.models.note import Note
from app.schemas.note_schemas import NoteCreate, NoteUpdate
import base64

def get_notes(db: Session, user_id: int):
    notes = db.query(Note).filter(Note.user_id == user_id).all()
   
    return notes

def create_note(db: Session, note, user_id: int):
    db_note = Note(
        title=note.title,
        content=getattr(note, "content", ""),  # Use empty string if not provided
        user_id=user_id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def update_note(db: Session, note_id: int, note: NoteUpdate, user_id: int):
    # Add user_id filter to make sure user can only update own notes
    db_note = db.query(Note).filter(Note.id == note_id, Note.user_id == user_id).first()
    if db_note:
        if note.title is not None:
            db_note.title = note.title
        if note.content is not None:
            db_note.content = note.content
        db.commit()
        db.refresh(db_note)
    return db_note



def delete_note(db: Session, note_id: int):
    db_note = db.query(Note).filter(Note.id == note_id).first()
    if db_note:
        db.delete(db_note)
        db.commit()
    return db_note

def update_voice_message(db: Session, note_id: int, voice_data: bytes):
    db_note = db.query(Note).filter(Note.id == note_id).first()
    if not db_note:
        return None
    db_note.voice_message = voice_data
    db.commit()
    db.refresh(db_note)
    return db_note

def get_note_voice(db: Session, note_id: int):
    db_note = db.query(Note).filter(Note.id == note_id).first()
    if db_note and db_note.voice_message:
        return db_note.voice_message   #  RETURN BYTES
    return None
