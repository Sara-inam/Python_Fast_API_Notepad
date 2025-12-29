from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.note_schemas import NoteCreate, NoteUpdate, NoteResponse
from app.services.note_service import NoteService
from app.utilis.token_utilis import verify_token
from pydub import AudioSegment
import io
from fastapi.responses import StreamingResponse
from app.crud.note_crud import get_note_voice

# FFmpeg path
AudioSegment.converter = r"C:\ffmpeg-8.0.1-essentials_build\bin\ffmpeg.exe"
AudioSegment.ffprobe = r"C:\ffmpeg-8.0.1-essentials_build\bin\ffprobe.exe"

note_router = APIRouter(prefix="/notes", tags=["Notes"])

def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization[7:]
    user_id = verify_token(token)
    return {"id": user_id}



# --- GET NOTES ---
@note_router.get("/get", response_model=list[NoteResponse])
def list_notes(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = NoteService(db, current_user["id"])
    notes = service.list_notes()
    for note in notes:
        # Only set full URL if voice exists
        if note.voice_message:
            note.voice_message = f"http://127.0.0.1:8000/notes/voice/{note.id}"
        else:
            note.voice_message = None
    return notes

# --- STREAM VOICE ---
@note_router.get("/voice/{note_id}")
def stream_voice(
    note_id: int,
    db: Session = Depends(get_db)
):
    voice_bytes = get_note_voice(db, note_id)

    if not voice_bytes:
        raise HTTPException(status_code=404, detail="Voice not found")

    return StreamingResponse(
        io.BytesIO(voice_bytes),
        media_type="audio/webm"
    )


# --- CREATE NOTE ---
@note_router.post("/create", response_model=NoteResponse)
async def create_new_note(
    title: str = Form(...),
    content: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.schemas.note_schemas import NoteCreate

    note_create = NoteCreate(title=title, content=content or "")
    service = NoteService(db, current_user["id"])
    db_note = service.create_note(note_create)

    if file:
        file_bytes = await file.read()
        service.upload_voice(db_note.id, file_bytes)

    db_note.voice_message = f"http://127.0.0.1:8000/notes/voice/{db_note.id}" if db_note.voice_message else None
    return db_note


@note_router.put("/update/{note_id}", response_model=NoteResponse)
async def update_existing_note(
    note_id: int,
    title: str = Form(...),
    content: str = Form(...),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = NoteService(db, current_user["id"])

    note_update = NoteUpdate(title=title, content=content)  # Pydantic object
    db_note = service.update_note(note_id, note_update)  

    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")

    if file:
        file_bytes = await file.read()
        service.upload_voice(note_id, file_bytes)

    db_note.voice_message = f"http://127.0.0.1:8000/notes/voice/{note_id}" if db_note.voice_message else None
    return db_note


# --- DELETE NOTE ---
@note_router.delete("/delete/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = NoteService(db, current_user["id"])
    db_note = service.delete_note(note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"detail": "Deleted Successfully"}


# --- UPLOAD VOICE ONLY ---
@note_router.post("/upload_voice/{note_id}")
async def upload_voice(note_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type")
    file_bytes = await file.read()
    audio = AudioSegment.from_file(io.BytesIO(file_bytes))
    if len(audio) > 60000:
        raise HTTPException(status_code=400, detail="Voice message max 1 minute allowed")
    service = NoteService(db, current_user["id"])
    db_note = service.upload_voice(note_id, file_bytes)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"detail": "Voice uploaded successfully", "voice_message": f"/notes/voice/{note_id}"}
