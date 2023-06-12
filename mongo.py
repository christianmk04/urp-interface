from flask import Flask, jsonify, request
from flask_cors import CORS
from bson.json_util import dumps
from bson.objectid import ObjectId
import json
import pymongo
import gridfs

app = Flask(__name__)
CORS(app)

# CONNECT TO MONGO
client = pymongo.MongoClient("mongodb+srv://ckoh2021:OFyDPl4iQKAX992P@resourcedb.rpdy1qw.mongodb.net/")

# DATABASE FOR CASE STUDIES
case_studies_db = client.get_database('case_studies_db')
# COLLECTIONS IN CASE STUDIES DB
reference_cs_collection = case_studies_db.get_collection('case_studies')
generated_cs_collection = case_studies_db.get_collection('generated_case_studies')

# DATABASE FOR QUESTIONS & ANSWERS
questions_db = client.get_database('questions_db')
# COLLECTIONS IN QA DB
reference_qa_collection = questions_db.get_collection('reference_qns')
generated_csqa_collection = questions_db.get_collection('generated_cs_qns')
generated_reference_qa_collection = questions_db.get_collection('generated_independent_qns')
case_study_qa_collection = questions_db.get_collection('case_study_qns')


# DATABASE FOR FILE UPLOADS
upload_db = client.get_database('uploadDB')
# COLLECTIONS IN UPLOAD DB
fs = gridfs.GridFS(upload_db, collection="uploaded_files")
upload_cs_collection = upload_db.get_collection('case_studies')
upload_qa_collection = upload_db.get_collection('independent_qa')
uploaded_csqa_collection = upload_db.get_collection('case_study_qa')


# QUESTION AND ANSWER ARRAY FORMATTER FUNCTION - TO FORMAT THE QUESTIONS AND ANSWERS INTO ARRAYS FOR EASIER PROCESSING
def qa_formatter(question_arr, answer_arr):

    modified_qn_arr = []
    modified_ans_arr = []

    for i in range(len(question_arr)):
        if question_arr[i] != '':
            if question_arr[i][0].isnumeric() == True:
                modified_qn_arr.append(question_arr[i][3:])


    for i in range(len(answer_arr)):
        if answer_arr[i] != '':
            if answer_arr[i][0].isnumeric() == True:
                modified_ans_arr.append(answer_arr[i][3:])

    return [modified_qn_arr, modified_ans_arr]


# FIND CASE STUDY BASED ON MODE, MAIN TOPIC AND SUB TOPIC
@app.route("/get_case_study/<string:mode>/<string:main_topic>/<string:sub_topic>", methods=['GET'])
def get_case_study(mode, main_topic, sub_topic):

    newList = []

    case_studies = reference_cs_collection.find()

    json_data = dumps(case_studies)
    json_data = json.loads(json_data)

    if mode == "automatic":
        
        for data in json_data:
            if data["mode"] == "automatic":
                if data["main_topic"] == main_topic and data["sub_topic"] == sub_topic:
                    newList.append(data)

    else:
        for data in json_data:
            if data["mode"] == "manual":
                if data["main_topic"] == main_topic:
                    newList.append(data)

    return jsonify(
        {
            "code" : 200,
            "message" : "Success",
            "main_topic" : main_topic,
            "sub_topic" : sub_topic,
            "mode" : mode,
            "data" : newList
        }
    )

# FIND INDEPENDENT QUESTIONS AND ANSWERS BASED ON MODE AND SUB TOPIC

@app.route("/get_ind_questions/<string:mode>/<string:sub_topic>", methods=['GET'])
def get_ind_questions(mode, sub_topic):

    newList = []

    questions = reference_qa_collection.find()

    json_data = dumps(questions)
    json_data = json.loads(json_data)

    if mode == "automatic":
        for data in json_data:
            if data["mode"] == "automatic":
                if data["topic"] == sub_topic:
                    newList.append(data)
    else:
        for data in json_data:
            if data["mode"] == "manual":
                newList.append(data)

    return jsonify(
        {
            "code" : 200,
            "message" : "Success",
            "sub_topic" : sub_topic,
            "mode" : mode,
            "data" : newList
    })

# FIND CASE STUDY AND RELATED QUESTIONS AND ANSWERS - USE THE MODE, MAIN TOPIC AND SUB TOPIC (AS KEYS) TO FIND THE CASE STUDY AND RELATED QUESTIONS AND ANSWERS
@app.route("/get_csqa/<string:mode>/<string:main_topic>/<string:sub_topic>", methods=['GET'])
def get_csqa(mode, main_topic, sub_topic):

    case_studies = reference_cs_collection.find()

    cs_json_data = dumps(case_studies)
    cs_json_data = json.loads(cs_json_data)

    curr_case_study = ""
    curr_case_study_id = ""

    for data in cs_json_data:
        if mode == "automatic":
            if data["mode"] == "automatic":
                if data["main_topic"] == main_topic and data["sub_topic"] == sub_topic:
                    curr_case_study = data["content"]
                    curr_case_study_id = data["_id"]

        elif mode == "manual":
            if data["mode"] == "manual":
                if data["main_topic"] == main_topic:
                    curr_case_study = data["content"]
                    curr_case_study_id = data["_id"]
        
    questions = case_study_qa_collection.find()

    q_json_data = dumps(questions)
    q_json_data = json.loads(q_json_data)

    quesList = []
    answersList = []

    for data in q_json_data:
        if data["case_study"] == curr_case_study_id:
            quesList.append(data["question"])
            answersList.append(data["answer"])
    
    return jsonify(
        {
            "code" : 200,
            "message" : "Success",
            "case_study" : curr_case_study,
            "questions" : quesList,
            "answers" : answersList
    })

# UPLOAD GENERATED CS INTO DATABASE
@app.route("/upload_cs", methods=['POST'])
def upload_cs():
    input_data = request.get_json()

    new_cs = {
        "mode" : input_data["mode"],
        "main_topic" : input_data["main_topic"],
        "sub_topic" : input_data["sub_topic"],
        "content" : input_data["content"]
    }

    try:
        generated_cs_collection.insert_one(new_cs)
    
    except Exception as e:
        return jsonify(
            {
                "code" : 500,
                "message" : "Error while inserting data"
            }
        )

    return jsonify(
        {
            "code" : 200,
            "message" : "Success"
        }
    )

# FUNCTION TO UPLOAD QUESTIONS AND ANSWERS FOR ALREADY GENERATED AND SAVED CASE STUDY
@app.route("/upload_qa_for_cs", methods=['POST'])
def upload_qa_for_cs():
    input_data = request.get_json()

    # Obtain the id of the existing case study
    cs_to_find = input_data["content"]
    generated_cs = generated_cs_collection.find_one({"content" : cs_to_find})

    cs_json_data = dumps(generated_cs)
    cs_json_data = json.loads(cs_json_data)

    cs_id = cs_json_data["_id"]
    mode = input_data["mode"]
    question_arr = input_data["questions"].split("\n")
    answer_arr = input_data["answers"].split("\n")

    print(question_arr)
    print(answer_arr)

    # FORMAT THE QUESTIONS IN THE QUESTIONS & ANSWER ARRAYS
    modified_arrays = qa_formatter(question_arr, answer_arr)
    modified_qn_arr = modified_arrays[0]
    modified_ans_arr = modified_arrays[1]

    if mode == "automatic":
        for i in range(len(modified_qn_arr)):
            new_csqa = {
                "case_study" : cs_id,
                "mode" : mode,
                "main_topic" : input_data["main_topic"],
                "sub_topic" : input_data["sub_topic"],
                "question" : modified_qn_arr[i],
                "answer" : modified_ans_arr[i]
            }
            try:
                generated_csqa_collection.insert_one(new_csqa)
            
            except Exception as e:
                return jsonify(
                    {
                        "code" : 500,
                        "message" : "Error while inserting data"
                    }
                )
    elif mode == "manual" or mode == "api_call":
        for i in range(len(modified_qn_arr)):
            new_csqa = {
                "case_study" : cs_id,
                "mode" : mode,
                "main_topic" : input_data["main_topic"],
                "question" : modified_qn_arr[i],
                "answer" : modified_ans_arr[i]
            }
            try:
                generated_csqa_collection.insert_one(new_csqa)
            
            except Exception as e:
                return jsonify(
                    {
                        "code" : 500,
                        "message" : "Error while inserting data"
                    }
                )


    return jsonify(
        {
            "code" : 200,
            "message" : "Success"
        }
    )

# FUNCTION TO UPLOAD INDEPENDENT QUESTIONS AND ANSWERS TO DB
@app.route("/upload_ind_qa", methods=['POST'])
def upload_ind_qa():
    input_data = request.get_json()

    mode = input_data["mode"]
    question_arr = input_data["questions"].split("\n")
    answer_arr = input_data["answers"].split("\n")

    # FORMAT THE QUESTIONS IN THE QUESTIONS & ANSWER ARRAYS
    modified_arrays = qa_formatter(question_arr, answer_arr)
    modified_qn_arr = modified_arrays[0]
    modified_ans_arr = modified_arrays[1]

    if mode == "automatic":
        for i in range(len(modified_qn_arr)):
            new_qa = {
                "mode" : mode,
                "main_topic" : input_data["main_topic"],
                "sub_topic" : input_data["sub_topic"],
                "question" : modified_qn_arr[i],
                "answer" : modified_ans_arr[i]
            }
            try:
                generated_reference_qa_collection.insert_one(new_qa)
            
            except Exception as e:
                return jsonify(
                    {
                        "code" : 500,
                        "message" : "Error while inserting data"
                    }
                )
    elif mode == "manual" or mode == "api_call":
        for i in range(len(modified_qn_arr)):
            new_qa = {
                "mode" : mode,
                "main_topic" : input_data["main_topic"],
                "question" : modified_qn_arr[i],
                "answer" : modified_ans_arr[i]
            }
            try:
                generated_reference_qa_collection.insert_one(new_qa)
            
            except Exception as e:
                return jsonify(
                    {
                        "code" : 500,
                        "message" : "Error while inserting data"
                    }
                )

    return jsonify(
        {
            "code" : 200,
            "message" : "Success"
        }
    )


# FUNCTION TO UPLOAD PDF FILE INTO DB AND RETURN THE OID OF THE FILE FOR REFERENCING

@app.route("/upload_pdf/<string:file_name>", methods=['POST'])
def upload_pdf(file_name):
    uploaded_file = request.data
    fs.put(uploaded_file, filename=file_name)    
    print("upload to DB successful")

    # RETURN OID OF THE FILE
    case_studies_files_col = upload_db["uploaded_files.files"]
    latest = case_studies_files_col.find({"filename": file_name}).sort([("uploadDate", -1)]).limit(1)
    json_data = dumps(latest)
    json_data = json.loads(json_data)
    file_id = json_data[0]["_id"]["$oid"]

    return file_id
    
# FUNCTION TO UPLOAD CASE STUDY FOR PDF FILE INTO DB USING OID OF FILE AS REFERENCE - RETURN OID OF THE CASE STUDY FOR REFERENCING

@app.route("/upload_cs_for_pdf/<string:file_id>", methods=['POST'])
def upload_pdf_cs(file_id):
    case_study = request.data.decode("utf-8")
    new_case_study = {
        "ref_file": ObjectId(file_id),
        "content" : case_study,
    }
    upload_cs_collection.insert_one(new_case_study)

    latest = upload_cs_collection.find({"ref_file": ObjectId(file_id)})
    json_data = dumps(latest)
    json_data = json.loads(json_data)
    cs_id = json_data[0]["_id"]["$oid"]

    return cs_id

# FUNCTION TO UPLOAD QUESTIONS AND ANSWERS FOR PDF FILE INTO DB USING OID OF FILE AS REFERENCE - INDEPENDENT QUESTIONS AND ANSWERS

@app.route("/upload_qa_for_pdf/<string:file_id>", methods=['POST'])
def upload_pdf_qa_ind(file_id):
    questions_and_answers = eval(request.data.decode("utf-8"))

    question_arr = questions_and_answers["questions"].split("\n")
    answer_arr = questions_and_answers["answers"].split("\n")

    # FORMAT THE QUESTIONS IN THE QUESTIONS & ANSWER ARRAYS
    modified_arrays = qa_formatter(question_arr, answer_arr)
    modified_qn_arr = modified_arrays[0]
    modified_ans_arr = modified_arrays[1]

    for i in range(len(modified_qn_arr)):
        new_qa = {
            "ref_file": ObjectId(file_id),
            "question" : modified_qn_arr[i],
            "answer" : modified_ans_arr[i]
        }

        upload_qa_collection.insert_one(new_qa)

    return "Successfully uploaded independent questions and answers to DB"

# FUNCTION TO UPLOAD QUESTIONS AND ANSWERS FOR PDF FILE INTO DB USING OID OF CASE STUDY AS REFERENCE - CASE STUDY QUESTIONS AND ANSWERS

@app.route("/upload_csqa_for_pdf/<string:cs_id>", methods=['POST'])
def upload_csqa_for_pdf(cs_id):
    questions_and_answers = eval(request.data.decode("utf-8"))

    question_arr = questions_and_answers["questions"].split("\n")
    answer_arr = questions_and_answers["answers"].split("\n")

    # FORMAT THE QUESTIONS IN THE QUESTIONS & ANSWER ARRAYS
    modified_arrays = qa_formatter(question_arr, answer_arr)
    modified_qn_arr = modified_arrays[0]
    modified_ans_arr = modified_arrays[1]

    for i in range(len(modified_qn_arr)):
        new_qa = {
            "case_study": ObjectId(cs_id),
            "question" : modified_qn_arr[i],
            "answer" : modified_ans_arr[i]
        }

        uploaded_csqa_collection.insert_one(new_qa)

    return "Successfully uploaded case study questions and answers to DB"



if __name__ == "__main__":
    app.run(port=5001, debug=True)