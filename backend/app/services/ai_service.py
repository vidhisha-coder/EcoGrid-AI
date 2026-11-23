
import json
import logging
import re

from google import genai
from PIL import Image

logger = logging.getLogger(__name__)

ANALYZE_PROMPT = """Analyze this image for environmental issues.
Respond ONLY with valid JSON in this exact format:
{
  "category": "one of: waste, water_pollution, air_pollution, deforestation, noise, other",
  "priority": "one of: low, medium, high, critical",
  "description": "brief description of the environmental issue visible",
  "confidence": 0.85,
  "tags": ["tag1", "tag2"],
  "recommendations": ["action1", "action2"]
}"""

DUPLICATE_PROMPT_TEMPLATE = """You are an environmental report deduplication assistant.

New report description: "{new_desc}"

Existing reports (id: description):
{existing}

Determine if the new report is a duplicate of any existing report.

Respond ONLY with valid JSON:
{{
  "is_duplicate": true,
  "duplicate_of_id": null,
  "similarity_score": 0.0,
  "reason": "brief explanation"
}}"""

VALID_CATEGORIES = {
    "waste",
    "water_pollution",
    "air_pollution",
    "deforestation",
    "noise",
    "other",
}

VALID_PRIORITIES = {"low", "medium", "high", "critical"}


def _extract_json(text: str) -> dict:
    """Extract JSON from Gemini response."""

    text = (text or "").strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    text = re.sub(r"```(?:json)?", "", text).strip()
    text = text.replace("```", "").strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)

    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not parse JSON from Gemini response")


class AIService:

    def __init__(self, api_key: str) -> None:
        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-3.5-flash"

    async def analyze_image(self, image_path: str) -> dict:
        """Analyze an environmental issue image using Gemini Vision."""

        try:
            with Image.open(image_path) as image:
                img = image.copy()

            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=[ANALYZE_PROMPT, img],
            )

            result = _extract_json(response.text)

            category = result.get("category", "other")
            if category not in VALID_CATEGORIES:
                category = "other"

            priority = result.get("priority", "medium")
            if priority not in VALID_PRIORITIES:
                priority = "medium"

            confidence = float(result.get("confidence", 0.5))
            confidence = max(0.0, min(1.0, confidence))

            tags = result.get("tags", [])
            if not isinstance(tags, list):
                tags = []

            recommendations = result.get("recommendations", [])
            if not isinstance(recommendations, list):
                recommendations = []

            return {
                "category": category,
                "priority": priority,
                "description": str(
                    result.get(
                        "description",
                        "Environmental issue detected"
                    )
                ),
                "confidence": confidence,
                "tags": [str(tag) for tag in tags],
                "recommendations": [
                    str(item) for item in recommendations
                ],
            }

        except FileNotFoundError:
            logger.error("Image file not found: %s", image_path)
            return self._fallback_analysis("Image file not found")

        except Exception as exc:
            logger.exception("AI image analysis failed")
            return self._fallback_analysis(str(exc))

    async def check_duplicate(
        self,
        new_report_desc: str,
        existing_reports: list
    ) -> dict:
        """Check whether a report duplicates an existing report."""

        if not existing_reports:
            return {
                "is_duplicate": False,
                "duplicate_of_id": None,
                "similarity_score": 0.0,
                "reason": "No existing reports to compare",
            }

        try:
            existing_text = "\n".join(
                f"{report['id']}: {report['description'][:200]}"
                for report in existing_reports[:20]
            )

            prompt = DUPLICATE_PROMPT_TEMPLATE.format(
                new_desc=new_report_desc[:500],
                existing=existing_text,
            )

            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
            )

            result = _extract_json(response.text)

            is_duplicate = bool(
                result.get("is_duplicate", False)
            )

            duplicate_of_id = result.get("duplicate_of_id")

            if duplicate_of_id is not None:
                try:
                    duplicate_of_id = int(duplicate_of_id)
                except (ValueError, TypeError):
                    duplicate_of_id = None

            similarity_score = float(
                result.get("similarity_score", 0.0)
            )
            similarity_score = max(
                0.0,
                min(1.0, similarity_score)
            )

            return {
                "is_duplicate": is_duplicate,
                "duplicate_of_id": duplicate_of_id,
                "similarity_score": similarity_score,
                "reason": str(result.get("reason", "")),
            }

        except Exception as exc:
            logger.exception("Duplicate check failed")

            return {
                "is_duplicate": False,
                "duplicate_of_id": None,
                "similarity_score": 0.0,
                "reason": f"Check failed: {exc}",
            }

    @staticmethod
    def _fallback_analysis(error_msg: str) -> dict:
        """Return safe fallback if AI analysis fails."""

        return {
            "category": "other",
            "priority": "medium",
            "description": "Could not analyse image automatically.",
            "confidence": 0.0,
            "tags": [],
            "recommendations": ["Manual review required"],
            "error": error_msg,
        }
