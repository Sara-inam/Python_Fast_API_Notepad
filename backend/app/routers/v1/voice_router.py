from fastapi import APIRouter, WebSocket
from app.services.voice_service import clients
from app.utilis.token_utilis import verify_token

voice_router = APIRouter(prefix="/voice", tags=["Voice"])

@voice_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token or not verify_token(token):
        await websocket.close(code=403)
        return

    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep connection alive
    except:
        clients.remove(websocket)
