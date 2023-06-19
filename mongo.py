from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from bson.json_util import dumps, loads
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
generated_qa_collection = questions_db.get_collection('generated_independent_qns')
reference_csqa_collection = questions_db.get_collection('case_study_qns')


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

##################################################################################################################################################################################################
##################################################################################################################################################################################################
##################################################################################################################################################################################################
'''
FUNCTIONS IN THIS SECTION SERVE THE KEYWORD & TEXT MODE PAGE - FUNCTIONS HERE WILL RETRIEVE THE REFERENCE RESOURCES TO BE USED TO GENERATE NEW RESOURCES

INCLUDES THE FOLLOWING FUNCTIONS IN ORDER:

- CASE STUDIES 
    - RETRIEVE THE CASE STUDY THAT MATCHES THE CHOSEN MAIN TOPIC AND SUB TOPIC
        - AUTOMATIC MODE - RETRIEVE THE CASE STUDY THAT MATCHES THE CHOSEN MAIN TOPIC AND SUB TOPIC
        - MANUAL MODE - RETRIEVE THE CASE STUDY THAT MATCHES THE CHOSEN MAIN TOPIC

- INDEPENDENT QUESTIONS AND ANSWERS
    - RETRIEVES THE INDEPENDENT QUESTIONS AND ANSWERS THAT MATCHES THE CHOSEN TOPIC
        - AUTOMATIC MODE - RETRIEVES THE INDEPENDENT QUESTIONS AND ANSWERS THAT MATCHES THE CHOSEN TOPIC
        - MANUAL MODE - RETRIEVES ALL THE INDEPENDENT QUESTIONS AND ANSWERS (NO SPECIFIC TOPIC - ALL TOPICS COVERED BY ALL THE QUESTIONS)

- CASE STUDY QUESTIONS AND ANSWERS
    - RETRIEVES THE CASE STUDY QUESTIONS AND ANSWERS THAT MATCHES THE CHOSEN MAIN TOPIC AND SUB TOPIC
'''

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
        
    questions = reference_csqa_collection.find()

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

##################################################################################################################################################################################################
##################################################################################################################################################################################################
##################################################################################################################################################################################################
'''
FUNCTIONS IN THIS SECTION SERVE THE KEYWORD & TEXT MODE PAGE - FUNCTIONS HERE WILL UPLOAD GENERATED RESOURCES BASED ON KEYWORDS AND TEXT INPUTS INTO THE DATABASE

INCLUDES THE FOLLOWING FUNCTIONS IN ORDER:

- CASE STUDIES 
    - UPLOAD GENERATED CASE STUDY INTO DATABASE

- INDEPENDENT QUESTIONS AND ANSWERS
    - UPLOAD GENERATED INDEPENDENT QUESTIONS AND ANSWERS INTO DATABASE

- CASE STUDY QUESTIONS AND ANSWERS
    - UPLOAD GENERATED CASE STUDY QUESTIONS AND ANSWERS INTO DATABASE
        - FUNCTION WILL ONLY WORK IF CASE STUDY IS ALREADY GENERATED AND SAVED IN THE DATABASE
'''

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

    for i in range(len(modified_qn_arr)):
        new_qa = {
            "mode" : mode,
            "topic" : input_data["sub_topic"],
            "question" : modified_qn_arr[i],
            "answer" : modified_ans_arr[i]
        }
        try:
            generated_qa_collection.insert_one(new_qa)
        
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

##################################################################################################################################################################################################
##################################################################################################################################################################################################
##################################################################################################################################################################################################
'''
FUNCTIONS IN THIS SECTION SERVE THE UPLOAD PDF PAGE - USERS WILL UPLOAD FILES AND THE FILES WILL BE STORED IN THE DATABASE

ANY CASE STUDIES, QUESTIONS AND ANSWERS GENERATED WILL BE UPLOADED ONTO UPLOADDB DATABASE

INCLUDES THE FOLLOWING FUNCTIONS IN ORDER:

- PDF FILE
    - UPLOADING OF PDF FILE INTO DB - WILL RETURN THE OID OF THE FILE FOR REFERENCING

- GENERATED CASE STUDY
    - UPLOAD GENERATED CASE STUDY INTO DB - WILL RETURN THE OID OF THE CASE STUDY FOR REFERENCING

- INDEPENDENT QUESTIONS AND ANSWERS
    - UPLOAD INDEPENDENT QUESTIONS AND ANSWERS INTO DB

- CASE STUDY QUESTIONS AND ANSWERS (CALLED WHEN USER GENERATES BOTH CASE STUDY RELATED QUESTIONS AND ANSWERS)
    - UPLOAD CASE STUDY QUESTIONS AND ANSWERS INTO DB
        - THIS FUNCTION WILL FOLLOW AFTER THE FUNCTION TO UPLOAD THE CASE STUDY
'''

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
    request_data = request.data.decode("utf-8")
    data = json.loads(request_data)

    new_case_study = {
        "ref_file": ObjectId(file_id),
        "content" : data["case_study"],
        "main_topic" : data["main_topic"],
        "sub_topic" : data["sub_topic"]
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
    request_data = request.data.decode("utf-8")
    replace = request_data.replace("'", '"')
    data = json.loads(replace)

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
            "answer" : modified_ans_arr[i],
            "main_topic" : data["main_topic"],
            "sub_topic" : data["sub_topic"]
        }

        upload_qa_collection.insert_one(new_qa)

    return "Successfully uploaded independent questions and answers to DB"

# FUNCTION TO UPLOAD QUESTIONS AND ANSWERS FOR PDF FILE INTO DB USING OID OF CASE STUDY AS REFERENCE - CASE STUDY QUESTIONS AND ANSWERS
@app.route("/upload_csqa_for_pdf/<string:cs_id>", methods=['POST'])
def upload_csqa_for_pdf(cs_id):
    request_data = request.data.decode("utf-8")
    data = json.loads(request_data)

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
            "answer" : modified_ans_arr[i],
            "main_topic" : data["main_topic"],
            "sub_topic" : data["sub_topic"]
        }

        uploaded_csqa_collection.insert_one(new_qa)

    return "Successfully uploaded case study questions and answers to DB"

##################################################################################################################################################################################################
##################################################################################################################################################################################################
##################################################################################################################################################################################################
'''
FUNCTIONS IN THIS SECTION SERVE THE RETRIEVAL PAGES - USERS CAN RETRIEVE AND VIEW THE DATA STORED IN THE DB

INCLUDES THE FOLLOWING FUNCTIONS IN ORDER:

- CASE STUDIES 
    - RETRIEVE ALL CASE STUDIES
    - UPDATE SPECIFIC CASE STUDY

- INDEPENDENT QUESTIONS AND ANSWERS
    - RETRIEVE ALL INDEPENDENT QUESTIONS AND ANSWERS
    - UPDATE SPECIFIC INDEPENDENT QUESTION AND ANSWER PAIR

- CASE STUDY QUESTIONS AND ANSWERS
    - RETRIEVE SPECIFIC CASE STUDY AND ALL RELATED QUESTIONS AND ANSWERS
    - UPDATE SPECIFIC CASE STUDY QUESTION AND ANSWER PAIR
'''

# RETRIEVE ALL CASE STUDIES 
@app.route("/retrieve_cs/<string:classification>", methods=['GET'])
def retrieve_cs(classification):
    case_studies = []
    
    if classification == "reference":
        case_studies_collection = reference_cs_collection.find()
    elif classification == "generated":
        case_studies_collection = generated_cs_collection.find()

    case_studies = list(case_studies_collection)
    json_data = dumps(case_studies)
    json_data = json.loads(json_data)

    return json_data

# UPDATE SPECIFIC CASE STUDY AFTER EDITING ON FRONT END SIDE
@app.route("/update_cs/<string:classification>/<string:cs_id>", methods=['PUT'])
def update_cs(classification, cs_id):
    data = request.data.decode('utf-8')
    data_json = json.loads(data)

    case_study_id = {"_id": ObjectId(cs_id)}
    updated_cs = {"$set": {"main_topic": data_json["main_topic"], "sub_topic": data_json["sub_topic"], "content": data_json["cs_content"]}}

    if classification == 'reference':
        try:
            reference_cs_collection.update_one(case_study_id, updated_cs)
            return jsonify(
                {
                    "code" : 200,
                    "message" : "Case study updated successfully"
                }
            )
        except Exception as e:
            print(e)
            return jsonify(
                {
                    "code" : 500,
                    "message" : "Internal Server Error"
                }
            )
    elif classification == 'generated':
        try:
            generated_cs_collection.update_one(case_study_id, updated_cs)
            return jsonify(
                {
                    "code" : 200,
                    "message" : "Case study updated successfully"
                }
            )
        except Exception as e:
            print(e)
            return jsonify(
                {
                    "code" : 500,
                    "message" : "Internal Server Error"
                }
            )

# RETRIEVE ALL INDEPENDENT QUESTIONS AND ANSWERS
@app.route("/retrieve_qa/<string:classification>", methods=['GET'])
def retrieve_qa(classification):
    questions_and_answers = []
    
    if classification == "reference":
        questions_and_answers_collection = reference_qa_collection.find()
    elif classification == "generated":
        questions_and_answers_collection = generated_qa_collection.find()

    questions_and_answers = list(questions_and_answers_collection)
    json_data = dumps(questions_and_answers)
    json_data = json.loads(json_data)

    return json_data




@app.route("/update_qa/<string:classification>/<string:qa_id>", methods=['PUT'])
def update_qa(classification, qa_id):
    data = request.data.decode('utf-8')
    replace = data.replace("'", '"')
    data_json = json.loads(replace)

    question_id = {"_id": ObjectId(qa_id)}
    updated_qn = {"$set": {"topic": data_json["topic"], "question": data_json["question"], "answer": data_json["answer"]}}

    if classification == 'reference':
        try:
            reference_qa_collection.update_one(question_id, updated_qn)
            return jsonify(
                {
                    "code" : 200,
                    "message" : "Question and answer updated successfully"
                }
            )
        except Exception as e:
            print(e)
            return jsonify(
                {
                    "code" : 500,
                    "message" : "Internal Server Error"
                }
            )
    elif classification == 'generated':
        try:
            generated_qa_collection.update_one(question_id, updated_qn)
            return jsonify(
                {
                    "code" : 200,
                    "message" : "Question and answer updated successfully"
                }
            )
        except Exception as e:
            print(e)
            return jsonify(
                {
                    "code" : 500,
                    "message" : "Internal Server Error"
                }
            )
                
# RETRIEVE CSQA SET
@app.route("/retrieve_csqa_set/<string:classification>/<string:cs_id>", methods=['GET'])
def retrieve_csqa_set(classification, cs_id):
    if classification == "reference":
        cs = reference_cs_collection.find({"_id": ObjectId(cs_id)})
        # csqa_set_collection = reference_csqa_collection.find({"case_study": ObjectId(cs_id)})
    elif classification == "generated":
        cs = generated_cs_collection.find({"_id": ObjectId(cs_id)})
        # csqa_set_collection = generated_csqa_collection.find({"case_study": ObjectId(cs_id)})
    
    cs_json = list(cs)
    cs_json_data = dumps(cs_json)
    cs_json_data = json.loads(cs_json_data)

    if classification == "reference":
        csqa_set_collection = reference_csqa_collection.find()
        csqa_set = list(csqa_set_collection)
        qa_list = []
        for qa in csqa_set:
            if qa["case_study"] == ObjectId(cs_id):
                qa_list.append({"question": qa["question"], "answer": qa["answer"], "main_topic": qa["main_topic"], "sub_topic": qa["sub_topic"], "id" : str(qa["_id"])})

    elif classification == "generated":
        csqa_set_collection = generated_csqa_collection.find()
        csqa_set = list(csqa_set_collection)
        qa_list = []
        for qa in csqa_set:
            if qa["case_study"]["$oid"] == cs_id:
                qa_list.append({"question": qa["question"], "answer": qa["answer"], "main_topic": qa["main_topic"], "sub_topic": qa["sub_topic"], "id" : str(qa["_id"])})
    
    return [cs_json_data, qa_list]

# UPDATE CSQA SET
@app.route("/update_csqa_set/<string:classification>/<string:qa_id>", methods=['PUT'])
def update_csqa_set(classification, qa_id):

    data_json = request.data.decode('utf-8')
    data_json = json.loads(data_json)


    question_id = {"_id": ObjectId(qa_id)}
    updated_qn = {"$set": {"main_topic": data_json["main_topic"], "sub_topic":data_json["sub_topic"], "question": data_json["question"], "answer": data_json["answer"]}}

    if classification == 'reference':
        try:
            reference_csqa_collection.update_one(question_id, updated_qn)
            return jsonify(
                {
                    "code" : 200,
                    "message" : "Question and answer updated successfully"
                }
            )
        except Exception as e:
            print(e)
            return jsonify(
                {
                    "code" : 500,
                    "message" : "Internal Server Error"
                }
            )
    elif classification == 'generated':
        try:
            generated_csqa_collection.update_one(question_id, updated_qn)
            return jsonify(
                {
                    "code" : 200,
                    "message" : "Question and answer updated successfully"
                }
            )
        except Exception as e:
            print(e)
            return jsonify(
                {
                    "code" : 500,
                    "message" : "Internal Server Error"
                }
            )



if __name__ == "__main__":
    app.run(port=5001, debug=True)