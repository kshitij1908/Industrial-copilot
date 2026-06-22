import logging
from typing import Optional
import google.generativeai as genai

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class TranslationService:
    """Service to detect language and translate queries/responses using Gemini."""

    def __init__(self) -> None:
        genai.configure(api_key=settings.gemini_api_key)
        self._model = genai.GenerativeModel(model_name=settings.gemini_model)
        logger.info("TranslationService initialised with Gemini model")

    def detect_language(self, text: str) -> str:
        """Detect if the language of the query is 'Hindi', 'Marathi', or 'English'."""
        if not text or not text.strip():
            return "English"

        prompt = (
            "Analyze the language of the following text. "
            "Respond with only a single word: 'Hindi', 'Marathi', or 'English'. "
            "If it is mixed, transliterated (e.g. Hindi written in Latin script), or if you are not sure, respond with 'English'. "
            f"Text: {text}"
        )

        try:
            response = self._model.generate_content(prompt)
            res_text = response.text.strip().lower()
            if "hindi" in res_text:
                return "Hindi"
            if "marathi" in res_text:
                return "Marathi"
            return "English"
        except Exception as e:
            logger.error(f"Language detection failed: {e}")
            return "English"

    def translate_to_english(self, text: str, source_lang: str) -> str:
        """Translate text from Hindi/Marathi to English."""
        if source_lang == "English":
            return text

        prompt = (
            f"Translate the following {source_lang} text to English. "
            "Keep technical codes, numbers, and equipment tags (such as P-101, valve, pump) exactly as they are. "
            "Do not explain the translation, return only the English translation. "
            f"Text: {text}"
        )

        try:
            response = self._model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Translation to English failed: {e}")
            return text

    def translate_from_english(self, text: str, target_lang: str) -> str:
        """Translate response from English back to Hindi/Marathi."""
        if target_lang == "English":
            return text

        prompt = (
            f"Translate the following English text to {target_lang}. "
            "Keep technical terms, numbers, and equipment tags (like P-101, valve, startup) exactly as they are. "
            "Provide a fluent and natural translation. "
            "Return only the translated text. "
            f"Text: {text}"
        )

        try:
            response = self._model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Translation from English failed: {e}")
            return text


_translation_service: Optional[TranslationService] = None


def get_translation_service() -> TranslationService:
    """Return the global TranslationService singleton."""
    global _translation_service
    if _translation_service is None:
        _translation_service = TranslationService()
    return _translation_service
