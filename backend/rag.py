from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import PromptTemplate
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from langchain_huggingface import HuggingFacePipeline


loader = TextLoader("./data/company_report.txt", encoding="utf-8")
documents = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=400,
    chunk_overlap=80
)
docs = text_splitter.split_documents(documents)

embeddings = HuggingFaceEmbeddings(
    model="sentence-transformers/all-MiniLM-L6-v2"
)

vector_db = Chroma.from_documents(
    documents=docs,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

retriever = vector_db.as_retriever(search_type="similarity", search_kwargs={"k": 4})

prompt = PromptTemplate(
    template="""
You are a financial and business intelligence assistant.

Use ONLY the information from the provided context.

Rules:
- No external knowledge.
- No assumptions.
- If information is missing, say:
"Insufficient information in the provided context."
- Always extract exact numbers when present.
- Keep answers concise but complete.

If applicable, structure the response as:
- Key Facts:
- Supporting Data:
- Conclusion:

Context:
{context}


User Question:
{question}

Final Answer:
""",
    input_variables=["context", "question"]
)

# LLM
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")
model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")

pipe = pipeline(
    "text2text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=512
)

llm = HuggingFacePipeline(pipeline=pipe)

def ask_question(question: str):
    retrieved_docs = retriever.invoke(question)
    context_text = "\n\n".join(doc.page_content for doc in retrieved_docs)
    final_prompt = prompt.invoke({"context": context_text, "question": question})
    answer = llm.invoke(final_prompt)
    return answer