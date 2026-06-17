import os

from groq import Groq


def get_financial_advice(question, portfolio_analysis, conversation_messages=None):
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        return "AI Error: GROQ_API_KEY is not configured."

    system_prompt = (
        "You are a friendly and helpful financial assistant."
        " Use the user's portfolio summary and answer clearly in simple financial language."
        " If the user asks for clarification, give concise advice and suggest next steps."
        " Keep the conversation polite and interactive."
    )

    portfolio_prompt = f"Portfolio:\n{portfolio_analysis}\n\nQuestion:\n{question}"

    messages = [
        {"role": "system", "content": system_prompt}
    ]

    if isinstance(conversation_messages, list):
        for msg in conversation_messages:
            role = msg.get("role")
            content = msg.get("content")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": portfolio_prompt})

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"AI Error: {str(e)}"
