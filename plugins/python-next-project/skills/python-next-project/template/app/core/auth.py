"""Optional Bearer-token authentication.

When `APP_API_KEY` is set, every route that depends on `verify_api_key`
requires a matching `Authorization: Bearer <key>` header. When it is empty
(the default), the dependency is a no-op and the API is open — fine for a
trusted network or local dev.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

_bearer_scheme = HTTPBearer(auto_error=False)


async def verify_api_key(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
):
    if not settings.API_KEY:
        return None

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing. Use: Authorization: Bearer <api-key>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if credentials.credentials != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )

    return credentials.credentials
