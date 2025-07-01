import os
from openai import OpenAI
from weasyprint import HTML
from dotenv import load_dotenv


load_dotenv()

# Initialize the OpenAI client with API key from environment
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))



# 1️⃣ Generate text
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a Shakespearean storyteller."},
        {"role": "user", "content": "Write a story about nature."}
    ]
)

generated_text = response.choices[0].message.content
print("Generated text:", generated_text)

# 2️⃣ Convert to simple HTML
html_content = f"""
<html>
  <head>
    <meta charset="utf-8">
    <title>My Story</title>
  </head>
  <body>
    <h1>Shakespearean Story</h1>
    <p>{generated_text}</p>
  </body>
</html>
"""

# 3️⃣ Make PDF
HTML(string=html_content).write_pdf("output.pdf")

print("✅ PDF saved as output.pdf")
