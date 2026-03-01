# 🏢 Enterprise Document Intelligence System (RAG)

An enterprise-level Retrieval-Augmented Generation (RAG) system built using LangChain and HuggingFace models.  

This project simulates how companies can securely analyze private internal documents (reports, strategy docs, performance reviews) and generate intelligent insights like:

- 📊 KPI Extraction
- 📈 Performance Summary
- ⚠ Risk Detection
- 🔍 SWOT Analysis
- 💡 Strategic Improvement Suggestions

---

## 🚀 Features

- Document ingestion (PDF/TXT)
- Text chunking & embeddings
- FAISS vector database (local)
- Retrieval-based question answering
- Automated SWOT analysis
- Risk identification
- Improvement recommendations
- Structured JSON output support

---

## 🧠 Tech Stack

- Python
- LangChain
- HuggingFace Transformers
- Sentence Transformers
- FAISS (Vector Database)

---

## 📂 Architecture

Documents  
→ Text Splitter  
→ Embeddings (MiniLM)  
→ FAISS Vector Store  
→ Retriever  
→ HuggingFace LLM  
→ Structured Business Insights  

---

## 🛠 Installation

```bash
pip install langchain
pip install langchain-community
pip install langchain-huggingface
pip install sentence-transformers
pip install faiss-cpu
pip install transformers
pip install torch