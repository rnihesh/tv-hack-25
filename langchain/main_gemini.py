import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever

# Load environment variables
load_dotenv()

# Initialize Gemini model
model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI"),
    temperature=0.3
)

template = """
You are and expert in answering questions about a pizza restaurant.

Here are some relevant reviews: {reviews}

Here is the question to answer: {question}
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

while True:
  print("\n\n--------------------------------")
  question = input("Enter your question (q to quit): ")
  print("\n\n")
  if question == "q":
    break

  reviews = retriever.invoke(question)
  result = chain.invoke({"reviews": reviews, "question": question})
  print(result.content)
