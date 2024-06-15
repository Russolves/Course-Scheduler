import scrapy
from scrapy.crawler import CrawlerProcess
from urllib.parse import quote_plus
import re
import os
from dotenv import load_dotenv # Version: 1.0.0
import pymongo
import certifi
from pymongo import MongoClient

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

# Spider for parsing course catalog
class Reference_Spider(scrapy.Spider):
    name = 'course_spider'
    pages = 72 # Number of pages in current catalog
    start_urls = []
    for i in range(1, pages + 1): # pages are 1-indexed
        url = f"https://catalog.purdue.edu/content.php?catoid=7&catoid=7&navoid=2928&filter%5Bitem_type%5D=3&filter%5Bonly_active%5D=1&filter%5B3%5D=1&filter%5Bcpage%5D={i}#acalog_template_course_filter"
        start_urls.append(url)
    
    def clean_text(self, text):
        text = text.replace('\xa0', ' ') # Replace non-breaking spaces with regular spaces
        text = re.sub(r'\s+', ' ', text) # Replace multiple spaces with single space
        return text.strip()
    
    def parse( self, response ):
        for course in response.css('td.width'):
            course_name = course.css('a::text').get() # clean course_name
            clean_name = self.clean_text(course_name)
            course_ls.append(clean_name)
            course_link = 'https://catalog.purdue.edu/' + course.css('a::attr(href)').get()
            course_dict[clean_name] = course_link # Push into dictionary

# Method to run spider
def ref_spider():
    process = CrawlerProcess()
    process.crawl(Reference_Spider)
    process.start()

# Method to update course_reference collection
def update_courseReference(client):
    for index, course_name in enumerate(course_ls): # 0-indexed course reference
        course_reference[index] = course_name
    # Push reference list into mongodb
    try:
        db = client['course_database']
        collection = db['course_reference']
        for j in range(len(course_ls)):
            filter = {"reference": j} # use index as filter
            update = {
                "$set": {
                    "reference":j,
                    "course_name":course_reference[j]
                }
            }
            result = collection.update_one(filter, update, upsert = True) # Upsert into course_reference
        print(f"Matched count: {result.matched_count}")
        print(f"Modified count: {result.modified_count}")
        print(f"Upserted id: {result.upserted_id}")
    except Exception as e:
        print(f"An exception has occured during writing process into course_reference collection:\n{e}")

# Main Script
if __name__ == "__main__":
    client = connection() # Establish connection
    course_ls = [] # list of course_names stored here (7190)
    course_dict = {} # { course_name:course_link }
    course_reference = {} # for storing { num:course_name } key-value pairs

    # ref_spider() # spider for crawling references
    # update_courseReference(client)



