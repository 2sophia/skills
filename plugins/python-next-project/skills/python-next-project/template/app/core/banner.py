"""Rich-formatted startup banner.

Renders a compact panel summarizing the runtime configuration when the
backend boots. Purely cosmetic — but it makes "is this the config I think
it is?" answerable at a glance in the logs. Extend the grid with your own
rows as the app grows.
"""

import os

from rich import box
from rich.console import Console, Group
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from app.core.config import settings


def _kv(label: str, value) -> tuple[str, str]:
    return (f"[cyan]{label}[/]", str(value))


def render_banner() -> None:
    console = Console()

    runtime = Table.grid(padding=(0, 2), expand=False)
    runtime.add_column(no_wrap=True, min_width=16)
    runtime.add_column()

    debug_style = "yellow" if settings.DEBUG else "green"
    runtime.add_row(*_kv("debug", f"[{debug_style}]{settings.DEBUG}[/]"))

    auth_val = "[green]enabled[/]" if settings.API_KEY else "[yellow]disabled[/]"
    runtime.add_row(*_kv("auth", auth_val))

    runtime.add_row(*_kv("mongodb", f"{settings.MONGODB_URI}/{settings.MONGODB_DB_NAME}"))
    runtime.add_row(*_kv("backend", f"http://localhost:{settings.BACKEND_PORT}"))
    runtime.add_row(*_kv("docs", f"http://localhost:{settings.BACKEND_PORT}/docs"))

    frontend_on = os.environ.get("_APP_FRONTEND_RUNNING") == "1"
    fe_val = (
        f"[green]on[/]  [dim]:{settings.FRONTEND_PORT}[/]"
        if frontend_on
        else "[dim]off (backend-only)[/]"
    )
    runtime.add_row(*_kv("frontend", fe_val))

    title = Text()
    title.append(f" {settings.NAME} ", style="bold white on blue")
    title.append(f" v{settings.VERSION} ", style="dim white")
    title.append(" starting", style="italic dim")

    console.print(
        Panel(
            Group(Text("Runtime", style="bold bright_white"), runtime),
            title=title,
            title_align="left",
            border_style="bright_blue",
            padding=(1, 2),
            box=box.ROUNDED,
        )
    )
