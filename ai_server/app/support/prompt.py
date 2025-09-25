def build_prompt(persona: str, user_text: str) -> str:
    return (
        "# Persona\n"
        f"{persona}\n\n"
        "# Instructions\n"
        "- Stay in character.\n"
        "- Spoken, concise Chinese (1-2 sentences).\n"
        "- If unknown, say naturally you are not sure.\n\n"
        "# Conversation\n"
        f"User: {user_text}\n"
        "Assistant:"
    )


