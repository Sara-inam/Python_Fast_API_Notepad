from sqlalchemy.orm import Session
from app.crud.note_crud import get_notes, create_note, update_note, delete_note, update_voice_message
from app.schemas.note_schemas import NoteCreate, NoteUpdate

class NoteService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def list_notes(self):
        return get_notes(self.db, user_id=self.user_id)

    def create_note(self, note: NoteCreate):
        return create_note(self.db, note, user_id=self.user_id)

    def update_note(self, note_id: int, note: NoteUpdate):
        db_note = update_note(self.db, note_id, note, user_id=self.user_id)  # pass user_id
        if not db_note:
            return None
        return db_note

    def delete_note(self, note_id: int):
        db_note = delete_note(self.db, note_id)
        if not db_note:
            return None
        return db_note
    
    def upload_voice(self, note_id: int, voice_data: bytes):
        db_note = update_voice_message(self.db, note_id, voice_data)
        return db_note
