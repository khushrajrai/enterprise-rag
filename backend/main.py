import os
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag import ask_question, ingest_document

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".txt", ".pdf"}


class HistoryTurn(BaseModel):
    role: str
    text: str


class Query(BaseModel):
    question: str
    history: list[HistoryTurn] = []


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .txt and .pdf files are supported.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        ingest_document(tmp_path)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to process the document.")
    finally:
        os.remove(tmp_path)

    return {"status": "ready", "filename": file.filename}


@app.post("/ask")
def ask(query: Query):
    history = [turn.model_dump() for turn in query.history]
    response = ask_question(query.question, history)
    return {"answer": response}
