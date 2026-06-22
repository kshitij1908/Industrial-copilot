import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class TranscriptionResponse(BaseModel):
    text: str
    language: str = "en"
    duration: float = 0.0


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe audio file using OpenAI Whisper.
    Frontend sends audio blob (WebM/OGG/WAV).
    Falls back to error message if Whisper not available.
    """
    try:
        import whisper
        import tempfile
        import os

        content = await audio.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty audio file")

        # Save to temp file
        suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            model = whisper.load_model("base")
            result = model.transcribe(tmp_path, language="en")
            return TranscriptionResponse(
                text=result["text"].strip(),
                language=result.get("language", "en"),
                duration=result.get("duration", 0.0),
            )
        finally:
            os.unlink(tmp_path)

    except ImportError:
        # Whisper not installed - return instruction to use Web Speech API
        logger.warning("OpenAI Whisper not installed. Using Web Speech API fallback.")
        raise HTTPException(
            status_code=501,
            detail="Whisper not installed. Use Web Speech API on the frontend for voice input.",
        )
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
