import os
import time
from flask import Flask, request, jsonify
import google.generativeai as genai
from flask_cors import CORS
from bson import ObjectId
 
import uuid
 
from pymongo import MongoClient

# Configure the Google Gemini API Key
genai.configure(api_key="AIzaSyCEY0yiUsQBEao9U0rIoKGtYdKsX-hLn64")

app = Flask(__name__)

# MongoDB connection setup
client = MongoClient('mongodb://localhost:27017/')
db = client['data_quest']
collection = db['chats']
CORS(app)

def upload_to_gemini(path, mime_type=None):
    """Uploads the given file to Gemini."""
    file = genai.upload_file(path, mime_type=mime_type)
    print(f"Uploaded file '{file.display_name}' as: {file.uri}")
    return file

def wait_for_files_active(files):
    """Waits for the given files to be active."""
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
    print()

# API route to upload PDF and extract data
@app.route('/upload', methods=['POST'])
def upload_pdf():
    # Ensure a file was uploaded
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    if 'user_id' not in request.form or 'chat_id' not in request.form:
        return jsonify({"error": "User ID and Chat ID are required"}), 400
 
    user_id = request.form['user_id']
    chat_id = request.form['chat_id']
   
    
    file = request.files['file']

    pdf_texts = [{"filename": file.filename}]
 
    # Save the text to MongoDB
    result = collection.update_one(
        {"user": ObjectId(user_id), "chatId": chat_id},
        {"$set": {"user": ObjectId(user_id), "chatId": chat_id}, "$push": {"pdf_text": {"$each": pdf_texts}}},
        upsert=True
    )
 
    
    # Save the file temporarily
    temp_file_path = r"C:\works\ls-mill\backend\python\tmp{file.filename}"
    
    file.save(temp_file_path)

    try:
        # Upload to Gemini and wait for processing
        uploaded_file = upload_to_gemini(temp_file_path, mime_type="application/pdf")
        wait_for_files_active([uploaded_file])

        # Initialize Gemini model for chat
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

        # Start chat session with specific extraction instructions
        chat_session = model.start_chat(
            history=[
                {
                    "role": "user",
                    "parts": [
                        uploaded_file,
                        (
                            '''Extract Data: Parse the uploaded invoice PDF and extract data specifically from the following columns:

PO NO
Date
ItemNo
Type
Variety
Size
Color
Article
UOM
Qty
Rate
Total
Mother PO
Data Processing:

Remove commas: Ensure that any commas in numeric fields such as Qty, Rate, and Total are removed.
Exclude unnecessary rows: Ignore any rows that contain terms like Subtotal, Total, Grand Total, or any similar summary lines.
Table Formatting:

Output all the extracted data in a single continuous table format, without breaking across multiple pages or sections, even if the PDF is lengthy.
Each row should correspond to a unique product or item from the invoice, and no data from summary sections (e.g., totals) should be included.
Example: The final table should look like this (dont include subtotal row):

PO NO          | Date       | ItemNo | Type            | Variety        | Size         | Color       | Article | UOM | Qty | Rate  | Total   | Mother PO
-------------- | ---------- | -------| ----------------| ---------------| ------------ | ----------- | ------- | --- | --- | ------| --------| -----------
POSG24000197   | 02 JUL 2024| 1      | Fitted Sheet Set| Affinity Rimini| Single       | Pure White  | Akemi   | SET | 80  | 10.57 | 845.60  | -
POSG24000197   | 02 JUL 2024| 2      | Fitted Sheet Set| Affinity Rimini| Super Single | Pure White  | Akemi   | SET | 96  | 11.08 | 1063.68 | -

Ensure that the table includes no breaks, and all rows flow in a continuous, uninterrupted manner.'''
                        ),
                    ],
                },
            ]
        )
        session_number = str(uuid.uuid4())
        # Extract data from PDF
        response = chat_session.send_message("Extract the data from the table")

        # Return the extracted data in JSON format
        return jsonify({"response": response.text, "_id": str(result.upserted_id),  "session_number": session_number})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

# Run the Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6002, debug=True)