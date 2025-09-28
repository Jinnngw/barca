import os
from pathlib import Path

from typing import Optional


def load_persona(role: Optional[str]) -> str:
    safe = (role or "default").strip().lower() or "default"
    filenames = [f"{safe}.md", "default.md"]
    
    # Get the directory where this file is located
    current_dir = Path(__file__).parent.parent
    personas_dir = current_dir / "personas"
    
    for name in filenames:
        file_path = personas_dir / name
        if file_path.exists():
            try:
                with file_path.open("r", encoding="utf-8") as f:
                    return f.read()
            except Exception:
                continue
    return "You are a helpful AI assistant. Answer briefly in Chinese."


