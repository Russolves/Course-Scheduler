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
finally:
    client.close()

# Spider for parsing course catalog
class Reference_Spider(scrapy.Spider):
    name = 'course_spider'
    start_urls = ['https://catalog.purdue.edu/content.php?catoid=7&catoid=7&navoid=2928&filter%5Bitem_type%5D=3&filter%5Bonly_active%5D=1&filter%5B3%5D=1&filter%5Bcpage%5D=3#acalog_template_course_filter']

    def clean_text(self, text):
        text = text.replace('\xa0', ' ') # Replace non-breaking spaces with regular spaces
        text = re.sub(r'\s+', ' ', text) # Replace multiple spaces with single space
        return text.strip()
    
    def parse( self, response ):
        for course in response.css('td.width'):
            course_name = course.css('a::text').get() # clean course_name
            clean_name = self.clean_text(course_name)
            course_link = 'https://catalog.purdue.edu/' + course.css('a::attr(href)').get()
            course_dict[clean_name] = course_link # Push into dictionary

course_dict = {}
# # Run spider
# process = CrawlerProcess()
# process.crawl(Reference_Spider)
# process.start()
