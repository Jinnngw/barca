import importlib.resources as pkg_resources

from typing import Optional


def load_persona(role: Optional[str]) -> str:
    safe = (role or "default").strip().lower() or "default"
    filenames = [f"{safe}.md", "default.md"]
    for name in filenames:
        try:
            with pkg_resources.files("ai_server.app.personas").joinpath(name).open("r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            continue
    return "You are a helpful AI assistant. Answer briefly in Chinese."


