# IMPORT FLASK APP DEPENDENCIES
from flask import Flask, request, jsonify, render_template

from flask_cors import CORS
from os import environ
from distutils.log import debug
from fileinput import filename

app = Flask(__name__)
CORS(app)


# RENDER KEYWORD AND TEXT INPUT PAGE
@app.route('/')
def main_text():
    return render_template('interface.html')

# RENDER UPLOAD PDF PAGE
@app.route('/upload')
def main_upload():
    return render_template('interface_upload.html')



# IMPORT LANGCHAIN DEPENDENCIES
from PyPDF2 import PdfReader
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import ElasticVectorSearch, Pinecone, Weaviate, FAISS
import tiktoken

from langchain.chains.question_answering import load_qa_chain
from langchain.chat_models import ChatOpenAI
from langchain.llms import OpenAI

import requests

import os 

# FUNCTION TO DO THE PDF READING 
def pdf_read(uploaded_file):
    reader = PdfReader(uploaded_file)

    raw_text = ""
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            raw_text += text

    text_splitter = CharacterTextSplitter(
        separator = "\n",
        chunk_size = 1000,
        chunk_overlap = 200,
        length_function = len,
    )
    texts = text_splitter.split_text(raw_text)

    embeddings = OpenAIEmbeddings()

    knowledge_base = FAISS.from_texts(texts, embeddings)

    chain = load_qa_chain(ChatOpenAI(), chain_type="stuff")

    return [chain, knowledge_base]

# FUNCTION TO UPLOAD PDF FILE TO DB
def upload_file_skeleton(file_to_upload, file_name):
    mongo_upload_endpoint = "http://localhost:5001/upload_pdf" + "/" + file_to_upload.filename
    try: 
        response = requests.post(mongo_upload_endpoint, file_to_upload)
        file_id = response.text
        print("Successfully uploaded file to DB")
    except Exception as e:
        print("Error")
        print(e)
    
    return file_id

# FUNCTION TO UPLOAD GENERATED CASE STUDY TO DB
def upload_cs_skeleton(file_id, case_study_output):
    mongo_upload_endpoint = "http://localhost:5001/upload_cs_for_pdf" + "/" + file_id
    try: 
        response = requests.post(mongo_upload_endpoint, case_study_output)
        print("Successfully uploaded case study to DB")
        cs_id = response.text
    except Exception as e:
        print("Error")
        print(e)
    
    return cs_id

# UPLOAD PDF FILE TO DB AND GENERATE + UPLOAD CASE STUDY TO DB
@app.route('/upload_file_cs', methods=['POST'])
def upload_cs():
    
    print('-----------------Uploading file------------------------')

    # ERROR HANDLING - TO MAKE SURE THAT A FILE HAS BEEN UPLOADED BY THE USER AND A VALID API KEY IS ENTERED

    user_api_key = request.form['user_api_key']
    
    if user_api_key == '':
        return render_template('interface_upload_error.html', error_message="Unable to proceed. Please enter a valid API key!")

    uploaded_file = request.files['file']
    
    if uploaded_file.filename == '':
        return render_template('interface_upload_error.html', error_message="Unable to proceed. Please upload a PDF file!")
    
    # SET API KEY FOR GENERATION OF RESOURCE

    os.environ["OPENAI_API_KEY"] = user_api_key
    
    # UPLOAD FILE TO DB
    file_id = upload_file_skeleton(uploaded_file, uploaded_file.filename)
    
    # GENERATE CASE STUDY
    chain = pdf_read(uploaded_file)[0]
    knowledge_base = pdf_read(uploaded_file)[1]

    cs_query = "Based on the contents in this file, can you create a fictional case study for me about a fictional company? The case study should revolve around Agile and DevOps, and should reference as much of the contents of in the file. The case study should follow this structure: 1. Introduction of Company and Background 2. Current Practices 2. Problems faced due to current practices 3. The need to implement new practices and what they are 4. Results 5. Conclusion. \n\n Make the case study in such a way where the individual sections are not numbered and that the whole case study flows seamlessly \n\n Skip the pleasantries of acknowledging the user and start generating the case study immediately (Meaning, do not start with 'Sure, here's a case study for...' or 'Here's a case study for...')."

    cs_docs = knowledge_base.similarity_search(cs_query)
    cs_output = chain.run(input_documents=cs_docs,question=cs_query)

    # UPLOAD CASE STUDY TO DB
    upload_cs_skeleton(file_id, cs_output)

    return render_template('interface_post_upload_cs.html', cs_output=cs_output)

# UPLOAD PDF FILE TO DB AND GENERATE + UPLOAD QUESTIONS & ANSWERS TO DB
@app.route('/upload_file_qa', methods=['POST'])
def upload_qa():
    
    print('-----------------Uploading file------------------------')

    user_api_key = request.form['user_api_key']
    
    if user_api_key == '':
        return render_template('interface_upload_error.html', error_message="Unable to proceed. Please enter a valid API key!")

    uploaded_file = request.files['file']
    
    if uploaded_file.filename == '':
        return render_template('interface_upload_error.html', error_message="Unable to proceed. Please upload a PDF file!")
    
    # SET API KEY FOR GENERATION OF RESOURCE

    os.environ["OPENAI_API_KEY"] = user_api_key

    
    # UPLOAD FILE TO DB
    file_id = upload_file_skeleton(uploaded_file, uploaded_file.filename)

    # GENERATE QUESTIONS AND ANSWERS
    chain = pdf_read(uploaded_file)[0]
    knowledge_base = pdf_read(uploaded_file)[1]

    ques_ind_query = "Based on the contents of the file, can you write me 10 questions that relate to DevOps and Agile? Have the questions reference as much of the content inside the file as possible, whilst adhering to the theme of DevOps and Agile. \n\n Write the questions in the following format: \n1. Question 1\n2. Question 2\n3. Question 3 \n\n and so on. \n\n Skip the pleasantries of acknowledging the user and start generating the questions immediately (Meaning, do not start with 'Sure, here's a questions for...')."
    q_docs = knowledge_base.similarity_search(ques_ind_query)
    q_output = chain.run(input_documents=q_docs,question=ques_ind_query)

    ans_ind_query = f'Please provide the answers to the following questions. \n\n {q_output} \n\n Skip the pleasantries of acknowledging the user and start generating the answers immediately (Meaning, do not start with "Sure, here\'s the answers for...").'
    a_docs = knowledge_base.similarity_search(ans_ind_query)
    a_output = chain.run(input_documents=a_docs,question=ans_ind_query)

    # UPLOAD QUESTIONS AND ANSWERS TO DB
    mongo_upload_endpoint = "http://localhost:5001/upload_qa_for_pdf" + "/" + file_id
    qa_json = {
        "questions": q_output,
        "answers": a_output
    }
    try:
        response = requests.post(mongo_upload_endpoint, json=qa_json)
        print(response.text)
    except Exception as e:
        print("Error")
        print(e)

    return render_template('interface_post_upload_qa.html', q_output=q_output, a_output=a_output)
        
# UPLOAD PDF FILE TO DB AND GENERATE + UPLOAD CASE STUDY AND QUESTIONS & ANSWERS TO DB
@app.route('/upload_file_csqa', methods=['POST'])
def upload_csqa():
    
    print('-----------------Uploading file------------------------')

    user_api_key = request.form['user_api_key']
    
    if user_api_key == '':
        return render_template('interface_upload_error.html', error_message="Unable to proceed. Please enter a valid API key!")

    uploaded_file = request.files['file']
    
    if uploaded_file.filename == '':
        return render_template('interface_upload_error.html', error_message="Unable to proceed. Please upload a PDF file!")
    
    # SET API KEY FOR GENERATION OF RESOURCE

    os.environ["OPENAI_API_KEY"] = user_api_key
    
    # UPLOAD FILE TO DB
    file_id = upload_file_skeleton(uploaded_file, uploaded_file.filename)

    # GENERATE CASE STUDY
    chain = pdf_read(uploaded_file)[0]
    knowledge_base = pdf_read(uploaded_file)[1]

    cs_query = "Based on the contents in this file, can you create a fictional case study for me about a fictional company? The case study should revolve around Agile and DevOps, and should reference as much of the contents of in the file. The case study should follow this structure: 1. Introduction of Company and Background 2. Current Practices 2. Problems faced due to current practices 3. The need to implement new practices and what they are 4. Results 5. Conclusion. \n\n Make the case study in such a way where the individual sections are not numbered and that the whole case study flows seamlessly \n\n Skip the pleasantries of acknowledging the user and start generating the case study immediately (Meaning, do not start with 'Sure, here's a case study for...' or 'Here's a case study for...')."

    cs_docs = knowledge_base.similarity_search(cs_query)
    cs_output = chain.run(input_documents=cs_docs,question=cs_query)

    # UPLOAD CASE STUDY TO DB
    cs_id = upload_cs_skeleton(file_id, cs_output)

    # GENERATE QUESTIONS AND ANSWERS
    ques_cs_query = f'Based on the case study below, can you create 10 questions about the case study? Phrase them in a way where it will require more critical thinking. \n\n Case Study: {cs_output} \n\n Skip the pleasantries of acknowledging the user and start generating the questions immediately (Meaning, do not start with \'Sure, here\'s a questions for...\')'
    q_docs = knowledge_base.similarity_search(ques_cs_query)
    q_output = chain.run(input_documents=q_docs,question=ques_cs_query)

    a_query = f'Based on the case study and the questions below, could you provide the answers to the questions? \n\n Case Study: {cs_output} \n\n Questions: {q_output} \n\n Skip the pleasantries of acknowledging the user and start generating the answers immediately. (Meaning, do not start with "Sure, here\'s the answers for...").'
    a_docs = knowledge_base.similarity_search(a_query)
    a_output = chain.run(input_documents=a_docs,question=a_query)

    # UPLOAD RELATED QUESTIONS AND ANSWERS TO DB
    mongo_upload_endpoint = "http://localhost:5001/upload_csqa_for_pdf" + "/" + cs_id
    qa_json = {
        "questions": q_output,
        "answers": a_output
    }
    try:
        response = requests.post(mongo_upload_endpoint, json=qa_json)
        print(response.text)
    except Exception as e:
        print("Error")
        print(e)

    return render_template('interface_post_upload_csqa.html', cs_output=cs_output, q_output=q_output, a_output=a_output)

# FLASK APP ROUTE
if __name__ == '__main__':
    app.run(port=5000, debug=True)