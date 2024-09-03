from flask import Flask, request, jsonify
from flask_cors import CORS

from pymongo import MongoClient

from langchain_community.chat_models import BedrockChat
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory

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

pdf_index = None  # Global variable to hold the PDF index
llm = None  # Global variable to hold the HR LLM model

random_max_tokens = random.randint(500, 9999)
llm = BedrockChat(
    credentials_profile_name="default",
    provider="anthropic",
    model_id="anthropic.claude-3-haiku-20240307-v1:0",
    model_kwargs={"temperature": 1, "max_tokens": random_max_tokens, "top_p": 1.0},
    streaming=True,
)

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

        # Search MongoDB for document by _id
        document = collection.find_one({'_id': ObjectId(doc_id)})

        if document is None:
            return jsonify({"error": "No content found for the provided document ID"}), 404
        
        # Extract pdf_texts from document
        pdf_texts = document.get('pdf_text', [])

        print('PDF Text', pdf_texts)

        # Initialize a new BedrockChat and ConversationChain
        conversation_llm = BedrockChat(
            credentials_profile_name="default",
            provider="anthropic",
            model_id="anthropic.claude-3-haiku-20240307-v1:0",
            model_kwargs={"temperature": 1, "max_tokens": 9999, "top_p": 1.0},
            streaming=True,
        )
        conversation = ConversationChain(llm=conversation_llm, verbose=True, memory=ConversationBufferMemory())

        # Prepare input by combining pdf_texts content and user input with numbering
        pdf_text_contents = "\n\n".join([f"{i+1}. {pdf['content']}" for i, pdf in enumerate(pdf_texts)])
        full_input = f"{pdf_text_contents}\n\n{input_text}"

        # Get response from conversation model
        response = conversation.predict(input=full_input)

        return jsonify({"response": response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6001, debug=True)
