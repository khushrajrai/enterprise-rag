import os

from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import PromptTemplate
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from langchain_huggingface import HuggingFacePipeline

LOADERS = {
    ".txt": lambda path: TextLoader(path, encoding="utf-8"),
    ".pdf": lambda path: PyPDFLoader(path),
}

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=400,
    chunk_overlap=80
)

embeddings = HuggingFaceEmbeddings(
    model="sentence-transformers/all-MiniLM-L6-v2"
)

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
- Use the conversation history only to understand what the user is referring to
  (e.g. "it", "that", "the previous one"). Your factual answer must still come
  only from the context below.

If applicable, structure the response as:
- Key Facts:
- Supporting Data:
- Conclusion:

Conversation so far:
{history}

Context:
{context}


User Question:
{question}

Final Answer:
""",
    input_variables=["context", "history", "question"]
)

# LLM (loaded once and reused across documents)
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")
model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")

pipe = pipeline(
    "text2text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=512
)

llm = HuggingFacePipeline(pipeline=pipe)

# Active retriever — replaced each time a new document is uploaded
retriever = None


def ingest_document(file_path: str):
    """Loads a .txt or .pdf file, chunks it, embeds it, and builds a fresh retriever for it."""
    global retriever

    ext = os.path.splitext(file_path)[1].lower()
    loader_factory = LOADERS.get(ext)
    if loader_factory is None:
        raise ValueError(f"Unsupported file type: {ext}")

    documents = loader_factory(file_path).load()
    docs = text_splitter.split_documents(documents)

    vector_db = Chroma.from_documents(
        documents=docs,
        embedding=embeddings
    )

    retriever = vector_db.as_retriever(search_type="similarity", search_kwargs={"k": 4})


def format_history(history):
    if not history:
        return "None"

    lines = []
    for turn in history:
        speaker = "User" if turn.get("role") == "user" else "Assistant"
        lines.append(f"{speaker}: {turn.get('text', '')}")
    return "\n".join(lines)


def ask_question(question: str, history=None):
    if retriever is None:
        return "Please upload a document before asking questions."

    retrieved_docs = retriever.invoke(question)
    context_text = "\n\n".join(doc.page_content for doc in retrieved_docs)
    history_text = format_history(history)
    final_prompt = prompt.invoke({"context": context_text, "history": history_text, "question": question})
    answer = llm.invoke(final_prompt)
    return answer
