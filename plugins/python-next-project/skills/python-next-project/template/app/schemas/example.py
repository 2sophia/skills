"""Example request/response models. Pydantic models for the API live here."""

from pydantic import BaseModel


class ExampleResponse(BaseModel):
    message: str
