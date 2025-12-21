import asyncio
from typing import Optional, Any, Dict
import httpx
import logging

logger = logging.getLogger(__name__)


class AsyncHTTPClient:
    """Simple Async HTTP client with retry and exponential backoff.

    Wraps `httpx.AsyncClient` and retries on network errors.
    Returns `httpx.Response` so existing code calling `.status_code` and `.json()` keeps working.
    """

    def __init__(self, timeout: float = 10.0, max_retries: int = 3, backoff_factor: float = 0.5):
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self._client = httpx.AsyncClient(timeout=self.timeout)

    async def _request(self, method: str, url: str, **kwargs) -> httpx.Response:
        last_exc = None
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = await self._client.request(method, url, **kwargs)
                return resp
            except (httpx.RequestError, httpx.HTTPStatusError) as exc:
                last_exc = exc
                logger.warning(
                    "HTTP %s %s failed on attempt %d: %s",
                    method,
                    url,
                    attempt,
                    str(exc),
                )
                if attempt == self.max_retries:
                    break
                sleep_for = self.backoff_factor * (2 ** (attempt - 1))
                await asyncio.sleep(sleep_for)

        # raise the last exception for caller to handle
        if last_exc:
            raise last_exc
        raise RuntimeError("HTTP request failed without exception")

    async def get(self, url: str, params: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> httpx.Response:
        return await self._request("GET", url, params=params, headers=headers)

    async def post(self, url: str, json: Optional[Any] = None, headers: Optional[Dict[str, str]] = None) -> httpx.Response:
        return await self._request("POST", url, json=json, headers=headers)

    async def close(self) -> None:
        await self._client.aclose()
