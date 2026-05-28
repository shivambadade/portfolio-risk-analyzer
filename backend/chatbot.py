from openai import OpenAI

import os


client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


def get_financial_advice(
    question,
    portfolio_analysis
):

    prompt = f"""
    You are an AI financial advisor.

    Portfolio Analysis:
    {portfolio_analysis}

    User Question:
    {question}

    Give concise and professional financial advice.
    """

    response = client.chat.completions.create(

        model="gpt-3.5-turbo",

        messages=[

            {
                "role": "system",
                "content": "You are a professional AI financial advisor."
            },

            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content