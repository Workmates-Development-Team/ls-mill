from flask import Flask, request, jsonify
from flask_cors import CORS

from pymongo import MongoClient

from pdfminer.high_level import extract_text

import uuid
import random
import os
from bson import ObjectId

app = Flask(__name__)
CORS(app)

# MongoDB connection setup
client = MongoClient('mongodb://localhost:27017/')
db = client['data_quest']
collection = db['chats']

sessions = {}  # Dictionary to store conversation instances by session number
pdf_index = None  # Global variable to hold the PDF index

# Function to simulate BedrockChat API call
def bedrock_chat(input_text, model_id, max_tokens, temperature):
    # Placeholder function for interacting with BedrockChat API.
    # Replace this with actual API call logic.
    response = f"Simulated response for: {input_text}"
    return response

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

    # Save the text to MongoDB
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

@app.route('/ask', methods=['POST'])
def conversation_from_mongodb():
    try:
        data = request.get_json()
        doc_id = data.get('doc_id')
        input_text = data.get('input_text')
        start_new = data.get('start_new', False)
        session_number = data.get('session_number')

        # If session_number is not provided or None, generate a new one
        if not session_number:
            session_number = str(uuid.uuid4())

        # Search MongoDB for document by _id
        document = collection.find_one({'_id': ObjectId(doc_id)})

        if document is None:
            return jsonify({"error": "No content found for the provided document ID"}), 404
        
        # Extract pdf_texts from document
        pdf_texts = document.get('pdf_text', [])

        print('PDF Text', pdf_texts)

        # Initialize or retrieve conversation based on session_number
        conversation = sessions.get(session_number, None)

        if start_new or conversation is None:
            conversation = []
            sessions[session_number] = conversation

        # Prepare input by combining pdf_texts content and user input with numbering
        pdf_text_contents = "\n\n".join([f"{i+1}. {pdf['content']}" for i, pdf in enumerate(pdf_texts)])
        full_input = f"{pdf_text_contents}\n\n{input_text}"

        # Call BedrockChat API (simulated here)
        response = bedrock_chat(full_input, "anthropic.claude-3-haiku-20240307-v1:0", max_tokens=9999, temperature=1.0)

        # Store the conversation in memory
        conversation.append({"input": input_text, "response": response})

        return jsonify({"response": response, "session_number": session_number})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6001, debug=True)
