"""Example router — delete this and add your own.

Demonstrates the layering: a route in `api/routes/` returns a typed model
from `schemas/`. Real endpoints should push business logic down into
`services/` and persistence into `models/` + the Mongo handle from
`app.core.database.get_db()`.
"""

from fastapi import APIRouter

from app.schemas.example import ExampleResponse

router = APIRouter(prefix="/api", tags=["example"])


@router.get("/example", response_model=ExampleResponse)
async def get_example() -> ExampleResponse:
    return ExampleResponse(message="hello from the backend")
