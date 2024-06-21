import scrapy
from scrapy.crawler import CrawlerRunner
from scrapy.utils.log import configure_logging
from twisted.internet import reactor, defer
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

# Method to run multiple spiders
def run_spiders(spiders):
    configure_logging()
    runner = CrawlerRunner()

    @defer.inlineCallbacks
    def crawl():
        for spider in spiders:
            yield runner.crawl(spider)
        reactor.stop()
    crawl()
    reactor.run() # script will block here until all crawling jobs are finished

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
                    "course_name":course_reference[j],
                    "course_link":course_dict[course_reference[j]]
                }
            }
            result = collection.update_one(filter, update, upsert = True) # Upsert into course_reference
        print(f"Matched count: {result.matched_count}")
        print(f"Modified count: {result.modified_count}")
        print(f"Upserted id: {result.upserted_id}")
    except Exception as e:
        print(f"An exception has occured during writing process into course_reference collection:\n{e}")

# Spider for parsing course catalog details (credit hours, when class is offered etc.)
class Catalog_Spider(scrapy.Spider):
    name = 'catalog_spider'
    try:
        client = connection()
        db = client["course_database"]
        collection = db['course_reference']
        cursor = collection.find({}, {"_id": 0, "course_name":1, "course_link":1})
        documents = list(cursor)
        start_urls = []
        for entry in documents:
            start_urls.append(entry['course_link'])
    except Exception as e:
        print(f"An exception occurred during establishing mongodb connection in Catalog Spider:{e}")
    finally:
        client.close()
    def parse( self, response ):
        r = response.css('td.block_content')
        course_name = r.css('h1#course_preview_title::text').get()
        course_text = response.xpath('//td[@class="block_content"]/text()').getall() # retrieve main body text as ls
        # will have to check if prerequisite link exists, if so then parsing must change
        value_tuple = parse_text(course_text)
        course_catalog[course_name] = value_tuple

def parse_text(course_text):
    credits_ls = [] # return this as first element of tuple
    times_ls = [] # return this as second element of tuple
    for entry in course_text:
        if "credit hours: " in entry.strip().lower():
            text = entry.strip().lower()
            # Function to find the index of '. ' considering possible whitespaces
            def find_pattern(text):
                match = re.search(r'\.\s+', text)
                if match:
                    return match.start()
                return -1
            # parsing for credit hours
            creditHours_start = text.index("credit hours: ")
            creditHours_end = find_pattern(text)
            if creditHours_end == -1:
                raise ValueError("Pattern '. ' not found in text")
            credit_hours = text[creditHours_start + len("credit hours: "):creditHours_end]
            if credit_hours[0].isdigit():
                if "to" in credit_hours:
                    first = credit_hours[:credit_hours.index('to ')]
                    second = credit_hours[credit_hours.index('to ') + len('to '):]
                    credits_ls.append(float(first))
                    credits_ls.append(float(second))
                elif "or" in credit_hours:
                    first = credit_hours[:credit_hours.index('or ')]
                    second = credit_hours[credit_hours.index('or ') + len('or '):]
                    credits_ls.append(float(first))
                    credits_ls.append(float(second))
                elif "-" in credit_hours:
                    first = credit_hours[:credit_hours.index("-")]
                    second = credit_hours[credit_hours.index("-") + 1:]
                    credits_ls.append(float(first))
                    credits_ls.append(float(second))
                else:
                    credits_ls.append(float(credit_hours))
        if "typically offered " in entry.strip().lower():
            times_text = entry.strip().lower()
            # parsing for time(s) offered
            times = times_text[times_text.index('typically offered ') + len('typically offered '):-1]
            times_ls = times.split(' ') # return this as second element of tuple
    return tuple([credits_ls, times_ls]) # ([1.0, 3.0], [fall, spring, summer])

def update_courseCatalog(client):
    # update entries within mongodb based on course catalog dict
    try:
        db = client['course_database']
        collection = db['course_reference']
        for name in course_catalog:
            filter = {"course_name": name} # use course name as filter
            update = {
                "$set": {
                    "credit_hours":course_catalog[name][0],
                    "time_offered":course_catalog[name][1]
                }
            }
            result = collection.update_one(filter, update, upsert = True) # Upsert into course_reference
        print(f"Matched count: {result.matched_count}")
        print(f"Modified count: {result.modified_count}")
        print(f"Upserted id: {result.upserted_id}")
    except Exception as e:
        print(f"Something went wrong during the process of writing course catalog details to mongodb: {e}")

# Spider for parsing course details page (prerequisites, summary, campus_offered...)
class Detail_Spider(scrapy.Spider):
    name = 'detail_spider'
    # try:
    #     client = connection()
    #     db = client['course_database']
    #     collection = db['course_reference']
    #     cursor = collection.find({}, {"_id":0, "course_name":1, "reference":1})
    #     documents = list(cursor)
    #     start_urls = []
    #     for entry in documents:
    #         course_name = entry['course_name']
    #         reference = entry['reference']
    #         course = course_name[:course_name.index(" -")].strip() # parse course name
    #         code_reference[course] = reference # push into code reference for use later
    #         course_dept, course_code = course.split(' ')
    #         url = f"https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in={course_dept}&crse_numb_in={course_code}"
    #         start_urls.append(url)
    # except Exception as e:
    #     print(f"An exception occurred during establishing mongodb connection in Detail Spider:{e}")
    # finally:
    #     client.close()
    start_urls = ['https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in=CS&crse_numb_in=42200', 'https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in=BME&crse_numb_in=58300', 'https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in=ASM&crse_numb_in=10500', 'https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in=AGEC&crse_numb_in=69900', 'https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in=BIOL&crse_numb_in=44202']

    def parse( self, response ):
        course_name = response.xpath('//td[@class="nttitle"]/text()').get()
        element_all = response.xpath('//td[@class="ntdefault"]').getall()[0] # use this to parse for prerequisites 'and', 'or'
        prerequisites_tag = '<span class="fieldlabeltext">Prerequisites:'
        if prerequisites_tag in element_all:
            prerequisites_text = element_all[element_all.index(prerequisites_tag) + len(prerequisites_tag):element_all.index('</td>')]
            # print(f"PREREQUISITES: {prerequisites_text}")
            if "General Requirements:" in prerequisites_text:
                prerequisites_start = prerequisites_text.index('(')
                prerequisites_crude = prerequisites_text[prerequisites_start:]
                # Regex pattern to find courses within <a> tags followed by the course number
                pattern = r'<a[^>]*>(\w+)</a>\s*(\d{5})'
                # Find all matches in the section HTML
                course_crude = re.findall(pattern, prerequisites_crude)
                courses = [str(entry[0]) + ' ' + str(entry[1]) for entry in course_crude]
                print(f"COURSES: {courses}")
                # Regex pattern to find <br>or<br>, OR, and <br>and<br>
                and_or = r'<br>\s*(or|and)\s*<br>|OR'
                # Find all matches in the HTML content
                matches = [match for match in re.findall(and_or, prerequisites_crude, re.IGNORECASE) if match]
                print(f"MATCHES: {matches}")
            else: # assuming 'or' (for now)
                # Remove all <a> tags but keep their content
                clean_content = re.sub(r'<a[^>]*>([^<]+)</a>', r'\1', prerequisites_text)
                # Print the cleaned content (optional)
                print(f"CLEANED: {clean_content}")
                clean_ls = clean_content.split(' ')
                courses = []
                for i in range(len(clean_ls)):
                    if clean_ls[i].strip().isdigit() and clean_ls[i - 1].strip().isupper():
                        course = clean_ls[i - 1].strip() + ' ' + clean_ls[i].strip()
                        courses.append(course)
                print(f"COURSES: {courses}")

if __name__ == "__main__":
    client = connection() # Establish initial connection
    # Some global variables
    course_ls = [] # list of course_names stored here (7190 entries)
    course_dict = {} # { course_name:course_link }
    course_reference = {} # for storing { num:course_name } key-value pairs
    course_catalog = {} # { course_name:([credits], [times offered])}
    code_reference = {} # { course_code: num } for e.g. { AAE 19000: 0 }
    course_details = {} # { course_name: ([])}

    spiders = [Detail_Spider] # put the spiders you want to run here (Reference_Spider, Catalog_Spider)
    run_spiders(spiders)
    # update_courseReference(client)
    # update_courseCatalog(client)
    client.close()

