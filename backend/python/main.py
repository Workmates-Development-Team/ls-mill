from flask import Flask, request, jsonify
from flask_cors import CORS

from pymongo import MongoClient
from langchain_aws.chat_models import ChatBedrock
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from pdfminer.high_level import extract_text
import google.generativeai as genai

import uuid
import random
import pandas as pd
import os
import time
from bson import ObjectId

# Configure the Google Gemini API Key
genai.configure(api_key="AIzaSyCEY0yiUsQBEao9U0rIoKGtYdKsX-hLn64")

app = Flask(__name__)
CORS(app)

# MongoDB connection setup
client = MongoClient('mongodb://localhost:27017/')
db = client['data_quest']
collection = db['chats']

# Global variables for ChatBedrock sessions and the LLM
sessions = {}  # Dictionary to store conversation instances by session number
random_max_tokens = random.randint(500, 9999)

# Initialize ChatBedrock for Anthropic model
llm = ChatBedrock(
    credentials_profile_name="default",
    provider="anthropic",
    model_id="anthropic.claude-3-haiku-20240307-v1:0",
    model_kwargs={"temperature": 1, "max_tokens": random_max_tokens, "top_p": 1.0},
    streaming=True,
)

# Route to handle PDF uploads and extract text using PDFMiner
@app.route('/upload_pdfs', methods=['POST'])
def upload_pdfs():
    if 'pdfs' not in request.files:
        return jsonify({"error": "No files part in the request"}), 400

    if 'user_id' not in request.form or 'chat_id' not in request.form:
        return jsonify({"error": "User ID and Chat ID are required"}), 400

    user_id = request.form['user_id']
    chat_id = request.form['chat_id']
    
    files = request.files.getlist('pdfs')
    pdf_texts = []

    for file in files:
        file_path = f"./{file.filename}"
        file.save(file_path)
        try:
            text = extract_text(file_path)
            pdf_texts.append({"filename": file.filename, "content": text})
        finally:
            os.remove(file_path)

    # Save the extracted PDF text to MongoDB
    result = collection.update_one(
        {"user": ObjectId(user_id), "chatId": chat_id},
        {"$set": {"user": ObjectId(user_id), "chatId": chat_id}, "$push": {"pdf_text": {"$each": pdf_texts}}},
        upsert=True
    )

    if result.upserted_id:
        response_data = {"_id": str(result.upserted_id)}
    else:
        response_data = {"modified_count": result.modified_count}

    return jsonify(response_data), 200

# Route to handle conversation using Anthropic's ChatBedrock
@app.route('/ask', methods=['POST'])
def conversation_from_mongodb():
    try:
        data = request.get_json()
        doc_id = data.get('doc_id')
        input_text = data.get('input_text')
        start_new = True
        session_number = data.get('session_number')

        if not session_number:
            session_number = str(uuid.uuid4())

        document = collection.find_one({'_id': ObjectId(doc_id)})
        if document is None:
            return jsonify({"error": "No content found for the provided document ID"}), 404
        
        pdf_texts = document.get('pdf_text', [])
        conversation = sessions.get(session_number, None)

        if start_new or conversation is None:
            conversation_llm = ChatBedrock(
                credentials_profile_name="default",
                provider="anthropic",
                model_id="anthropic.claude-3-haiku-20240307-v1:0",
                model_kwargs={"temperature": 1, "max_tokens": 9999, "top_p": 1.0},
                streaming=True,
            )
            conversation = ConversationChain(llm=conversation_llm, verbose=True, memory=ConversationBufferMemory())
            sessions[session_number] = conversation

        pdf_text_contents = "\n\n".join([f"{i+1}. {pdf['content']}" for i, pdf in enumerate(pdf_texts)])
        full_input = f"{pdf_text_contents}\n\n{input_text}"

        response = conversation.predict(input=full_input)
        return jsonify({"response": response, "session_number": session_number})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Google Gemini file upload and data extraction
def upload_to_gemini(path, mime_type=None):
    file = genai.upload_file(path, mime_type=mime_type)
    print(f"Uploaded file '{file.display_name}' as: {file.uri}")
    return file

def wait_for_files_active(files):
    print("Waiting for file processing...")
    for name in (file.name for file in files):
        file = genai.get_file(name)
        while file.state.name == "PROCESSING":
            print(".", end="", flush=True)
            time.sleep(10)
            file = genai.get_file(name)
        if file.state.name != "ACTIVE":
            raise Exception(f"File {file.name} failed to process")
    print("...all files ready")

# API route to upload PDF and use Google Gemini for extraction
@app.route('/upload', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    if 'user_id' not in request.form or 'chat_id' not in request.form:
        return jsonify({"error": "User ID and Chat ID are required"}), 400

    user_id = request.form['user_id']
    chat_id = request.form['chat_id']
    file = request.files['file']

    pdf_texts = [{"filename": file.filename}]
    result = collection.update_one(
        {"user": ObjectId(user_id), "chatId": chat_id},
        {"$set": {"user": ObjectId(user_id), "chatId": chat_id}, "$push": {"pdf_text": {"$each": pdf_texts}}},
        upsert=True
    )

    temp_file_path = f"./tmp/{file.filename}"
    file.save(temp_file_path)

    try:
        uploaded_file = upload_to_gemini(temp_file_path, mime_type="application/pdf")
        wait_for_files_active([uploaded_file])

        generation_config = {
            "temperature": 1,
            "top_p": 0.95,
            "top_k": 64,
            "max_output_tokens": 8192,
            "response_mime_type": "text/plain",
        }

        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=generation_config,
        )

        chat_session = model.start_chat(
            history=[
                {
                    "role": "user",
                    "parts": [
                        uploaded_file,
                        '''Extract Data: Parse the uploaded invoice PDF and extract specific columns:
    Data Processing: Remove commas in numeric fields like Qty, Rate, Total. Ignore rows like Subtotal, Total, Grand Total.
    Table Formatting: Output all extracted data in a continuous table format without breaks.
    Example:
    PO NO        | Date     | ItemNo | Type   | Variety | Size | Qty | Rate | Total  | Mother PO
    -------------|----------|--------|--------|---------|------|-----|------|--------|---------
    POSG24000197 | 02 JUL 24| 1      | Fitted | Rimini  | White| 80  | 10.57| 845.60 | -'''
                    ],
                },
            ]
        )

        session_number = str(uuid.uuid4())
        response = chat_session.send_message("Extract the data from the table")

        return jsonify({"response": response.text, "_id": str(result.upserted_id),  "session_number": session_number})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

# Run the Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6001, debug=True)
