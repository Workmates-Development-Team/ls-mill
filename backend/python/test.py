#   Read PDFs using FAISS

from flask import Flask, request, jsonify
import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import BedrockEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.indexes import VectorstoreIndexCreator
from langchain_community.llms.bedrock import Bedrock
from langchain_community.chat_models import BedrockChat

app = Flask(__name__)
pdf_index = None  # Global variable to hold the PDF index
llm = None  # Global variable to hold the HR LLM model


def initialize_pdf_index(pdf_path):
    global pdf_index
    if pdf_index is None:
        # Define the data source and load data with PDFLoader
        data_load = PyPDFLoader(pdf_path)

        # Split the Text based on Character
        data_split = RecursiveCharacterTextSplitter(separators=["\n\n", "\n", " ", ""])

        # Create Embeddings
        data_embeddings = BedrockEmbeddings(
            credentials_profile_name='default',
            model_id='amazon.titan-embed-text-v1'
        )

        # Create Vector DB, Store Embeddings and Index for Search
        data_index = VectorstoreIndexCreator(
            text_splitter=data_split,
            embedding=data_embeddings,
            vectorstore_cls=FAISS
        )

        # Create index for PDF document
        pdf_index = data_index.from_loaders([data_load])


def initialize_hr_llm():
    global llm
    if llm is None:
        llm = Bedrock(
            credentials_profile_name='default',
            model_id='anthropic.claude-v2',
            model_kwargs={
                "max_tokens_to_sample": 2000,
                "temperature": 1,
                "top_p": 1
            }
        )



def hr_rag_response(index, question):
    initialize_hr_llm()
    hr_rag_query = index.query(question=question, llm=llm)
    return hr_rag_query


# input prompt, file
@app.route('/read', methods=['POST'])
def invoke_llm_with_embeddings():
    try:
        # Get prompt and PDF file from request
        prompt = request.form.get('prompt')
        pdf_file = request.files.get('pdf_file')

        # Save PDF file temporarily
        temp_pdf_path = r'temp.pdf'
        pdf_file.save(temp_pdf_path)

        # Initialize PDF index if not initialized
        initialize_pdf_index(temp_pdf_path)

        # Query HR RAG using PDF index
        response = hr_rag_response(pdf_index, prompt)

        # Prepare response data
        response_data = {
            "output_responses": response
        }

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(port=5014, debug=True, host='0.0.0.0')
 