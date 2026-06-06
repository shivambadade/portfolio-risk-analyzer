import os

from groq import Groq


def get_financial_advice(question, portfolio_analysis):
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        return "AI Error: GROQ_API_KEY is not configured."

    prompt = f"""
    Portfolio:
    {portfolio_analysis}

    Question:
    {question}

    Answer in simple financial language.
    """

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"AI Error: {str(e)}"
