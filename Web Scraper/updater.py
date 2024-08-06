import os
from dotenv import load_dotenv # Version: 1.0.0
import pymongo
import certifi
from pymongo import MongoClient
from urllib.parse import quote_plus

# Establish connection to MongoDB server
load_dotenv()
username = os.getenv("MONGO_USERNAME")
password = os.getenv("MONGO_PASSWORD")
cluster = os.getenv("MONGO_CLUSTER")
database = os.getenv("MONGO_DATABASE")

# Method to establish connection with MongoDB client
def connection():
    # URL encode the password
    encoded_password = quote_plus(password)
    # Construct the MongoDB URI
    mongo_uri = f"mongodb+srv://{username}:{encoded_password}@{cluster}/{database}?retryWrites=true&w=majority&appName=Cluster0"
    client = MongoClient(mongo_uri, server_api = pymongo.server_api.ServerApi(version="1", strict=True, deprecation_errors=True), tlsCAFile = certifi.where())
    try:
        client.admin.command({'ping': 1})
        print("Connected to MongoDB successfully!")
    except Exception:
        print("Error!")
    return client

# Method to return ls of references required to traverse db
def retrieve_references(client):
    try:
        db = client['course_database']
        collection = db['course_reference']
        cursor = collection.find({}, {"_id": 0})
        documents = list(cursor)
        return documents
    except Exception as e:
        print(f"Something went wrong during the retrieval of references: {e}")
# Method to update courses' prereq references within collection
def update_courses(client, reference_ls):
    try:
        db = client['course_database']
        collection = db['course_reference']
        nameRef_dict = {entry["course_name"][:entry["course_name"].index(" -")] : entry["reference"] for entry in reference_ls}
        missing_ls = []
        for course in reference_ls:
            print("Updating course " + str(course["reference"] + 1) + " of " + str(len(reference_ls)))
            ls_ls = []
            if course.get("prereq_reference") != None and len(course["prereq_reference"]) > 0:
                for i in range(len(course["prereq_reference"])):
                    ls = []
                    for index in range(len(course["prereq_reference"][i])):
                        if course["prereq_reference"][i][index] == -1:
                            if nameRef_dict.get(course["prereq_courses"][i][index]) != None:
                                reference = nameRef_dict[course["prereq_courses"][i][index]]
                            else:
                                missing_ls.append(course["prereq_courses"][i][index])
                                reference = -1
                        else:
                            reference = course["prereq_reference"][i][index]
                        ls.append(reference)
                    ls_ls.append(ls)
            filter = {"course_name": course["course_name"], "reference": course["reference"]}
            if len(ls_ls) > 0:
                update = {
                    "$set": {
                        "prereq_reference":ls_ls
                    }
                }
            else:
                update = {
                    "$set": {
                        "prereq_courses":[],
                        "prereq_reference":[]
                    }
                }
            result = collection.update_one(filter, update, upsert = True) # Upsert into course_reference
        missing_ls = list(set(missing_ls))
        print(f"Number of missing courses from db: {len(missing_ls)}")
        return missing_ls
    except Exception as e:
        print(f"Something went wrong during update_courses: {e}")

def write_log(missing):
    with open('updater_log.txt', 'w') as file:
        for entry in missing:
            line = entry + '\n'
            file.write(line)

def update_references(client, reference_ls):
    try:
        db = client['course_database']
        collection = db['course_reference']
        reference_count = []
        for entry in reference_ls:
            if entry.get("reference"):
                reference_count.append(entry["reference"])
        max_reference = max(reference_count)
        for entry in reference_ls:
            if entry.get("reference") == None:
                max_reference += 1
                filter = {"course_name":entry["course_name"]}
                update = {
                "$set": {
                    "reference": max_reference
                    }}
                result = collection.update_one(filter, update, upsert = True) # Upsert into course_reference
    except Exception as e:
        print(f"Something went wrong during update_references {e}")

if __name__ == "__main__":
    client = connection()
    reference_ls = retrieve_references(client)
    # # update_references(client, reference_ls)
    # print(f"Updated ls: {retrieve_references(client)}")
    missing = update_courses(client, reference_ls)
    write_log(missing)