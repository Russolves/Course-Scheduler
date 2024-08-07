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
    try:
        client = connection()
        db = client['course_database']
        collection = db['course_reference']
        cursor = collection.find({}, {"_id":0, "course_name":1, "reference":1})
        documents = list(cursor)
        start_urls = []
        for entry in documents:
            course_name = entry['course_name']
            reference = entry['reference']
            course = course_name[:course_name.index(" -")].strip() # parse course name
            course_dept, course_code = course.split(' ')
            url = f"https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in={course_dept}&crse_numb_in={course_code}"
            start_urls.append(url)
    except Exception as e:
        print(f"An exception occurred during establishing mongodb connection in Detail Spider:{e}")
    finally:
        client.close()
    # start_urls = ['https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in=EDCI&crse_numb_in=65300', 'https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in=CS&crse_numb_in=42200', 'https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in=BME&crse_numb_in=58300', 'https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in=ASM&crse_numb_in=10500', 'https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in=AGEC&crse_numb_in=69900', 'https://selfservice.mypurdue.purdue.edu/prod/bwckctlg.p_disp_course_detail?cat_term_in=202330&subj_code_in=BIOL&crse_numb_in=44202']
    def parse( self, response ):
        course_name = response.xpath('//td[@class="nttitle"]/text()').get()
        element_all = response.xpath('//td[@class="ntdefault"]').getall()[0] # use this to parse for prerequisites 'and', 'or'
        matches = []
        ignore_flag = False # flag for ignoring the first 'or' or 'and' should there be general requirements
        # initialize variables
        courses = []
        prereq_output = []
        reference_output = []
        grad = False
        course_description = ''
        try:
            course_description = element_all[element_all.index('. ') + len('. '):element_all.index('<br>')].strip() # parsing for course description
        except ValueError as e:
            uri = str(response)
            subj_index = uri.index('subj_code_in')
            subj_err = uri[subj_index+ len('subj_code_in='):subj_index + uri[subj_index:].index('&')]
            course_err = uri[uri.index('crse_numb_in=') + len('crse_numb_in='):-1]
            print(f"\nIt would seem that the page for {subj_err}: {course_err} is empty double check if necessary\n")
            error_courses.append(f"{subj_err} {course_err}")
        additional = ''
        levels = []
        schedule_types = []
        campus = []
        prerequisites_tag = '<span class="fieldlabeltext">Prerequisites:'
        restrictions_tag = '<span class="fieldlabeltext">Restrictions:</span>'
        if prerequisites_tag in element_all:
            prerequisites_text = element_all[element_all.index(prerequisites_tag) + len(prerequisites_tag):element_all.index('</td>')]
            # print(f"PREREQUISITES: {prerequisites_text}")
            if "General Requirements:" in prerequisites_text:
                ignore_flag = True
                prerequisites_start = prerequisites_text.index('(')
                prerequisites_crude = prerequisites_text[prerequisites_start:]
                # Check whether course is graduate level
                if "Student Attribute: GR" in prerequisites_crude:
                    grad = True
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
                # print(f"CLEANED: {clean_content}")
                clean_ls = clean_content.split(' ')
                for i in range(len(clean_ls)):
                    if clean_ls[i].strip().isdigit() and clean_ls[i - 1].strip().isupper():
                        course = clean_ls[i - 1].strip() + ' ' + clean_ls[i].strip()
                        courses.append(course)
                print(f"COURSES: {courses}")
                matches = [word for word in clean_content.split(' ') if word == 'or' or word == 'and']
                additional = ', '.join([word for word in clean_content.split(' ' ) if word == 'ALEKS' or word == 'ACT' or word == 'SAT'])
                print(f"MATCHES: {matches}")
                print(f"ADDITIONAL: {additional}")
        elif restrictions_tag in element_all:
            restrictions_text = element_all[element_all.index(restrictions_tag) + len(restrictions_tag):]
            if "Graduate" in restrictions_text:
                grad = True
            print(f"RESTRICTIONS: {grad}")
        # Parsing rest of the page (elements that are for sure on the page)
        if '<span class="fieldlabeltext">Levels: </span>' in element_all:
            level_text = element_all[element_all.index('<span class="fieldlabeltext">Levels: </span>') + len('<span class="fieldlabeltext">Levels: </span>'):]
            levels = level_text[:level_text.index('<br>')].strip().split(', ')
            print(f"LEVELS: {levels}")
        if '<span class="fieldlabeltext">May be offered at any of the following campuses:</span>' in element_all:
            campus_text = element_all[element_all.index('<span class="fieldlabeltext">May be offered at any of the following campuses:</span>') + len('<span class="fieldlabeltext">May be offered at any of the following campuses:</span>'):]
            campus_crude = campus_text[campus_text.index('<br>') + len('<br>'):campus_text.index('<br>\n<br>')].strip().split('<br>')
            campus = [entry.strip() for entry in campus_crude]
            print(f"CAMPUS: {campus}")
        if '<span class="fieldlabeltext">Schedule Types: </span>' in element_all:
            schedule_crude = element_all[element_all.index('<span class="fieldlabeltext">Schedule Types: </span>') + len('<span class="fieldlabeltext">Schedule Types: </span>'):].strip()
            schedule_text = schedule_crude[:schedule_crude.index('<br>\n<br>')].strip()
            pattern = r'<a[^>]*>([^<]+)</a>' # Find all <a> tags and capture their inner text
            schedule_pattern = re.findall(pattern, schedule_text)
            schedule_types = schedule_pattern
            cleaned_schedule_text = re.sub(r'<a[^>]*>([^<]+)</a>', r'\1', schedule_text) # remove all <a> tags but keep text content
            other_types = cleaned_schedule_text.split(', ')
            schedule_types.extend(other_types)
            schedule_types = list(set(schedule_types)) # ensure only unique values are pushed into ls
            print(f"SCHEDULE TYPES: {schedule_types}")
        if len(matches) > 0 and len(courses) > 0: # produce ls within ls output for prerequisites
            if ignore_flag:
                matches.pop(0) # remove first entry of 'or' or 'and'
            prereq_output, reference_output = prerequisites_sorter(courses, matches)
            print(f"PREREQ OUTPUT: {prereq_output}")
            print(f"REFERENCE OUTPUT: {reference_output}")
        # piecing course_details output together
        course_details[course_name] = (prereq_output, reference_output, grad, course_description, additional, levels, schedule_types, campus)
# Function taking matches & courses and returns ls within ls output for prerequisites
def prerequisites_sorter(courses, matches):
    output = [[courses.pop(0)]] # initialize output as ls within ls
    prev = None
    while courses:
        term = matches.pop(0)
        next_course = courses.pop(0)
        if term == 'and':
            for entry in output:
                entry.append(next_course)
        elif term == 'or':
            if prev == 'and':
                for i in range(len(output)): # predefined length
                    ls_copy = output[i].copy()
                    ls_copy.pop()
                    ls_copy.append(next_course)
                    output.append(ls_copy)
            else:
                ls_copy = output[-1].copy()
                ls_copy.pop()
                ls_copy.append(next_course)
                output.append(ls_copy)
        else:
            raise Exception(f"A term other than 'and' or 'or' has appeared within prerequisites_sorter, term: {term}")
        prev = term
    # convert each and every element in ls of ls into reference
    reference_output = []
    for i in range(len(output)):
        temp = []
        for course in output[i]:
            if code_reference.get(course) != None:
                temp.append(code_reference[course])
            else:
                temp.append(-1)
        reference_output.append(temp)
    return output, reference_output
# Method to retrieve code_reference
def retrieve_codeReference(code_reference):
    try:
        client = connection()
        db = client['course_database']
        collection = db['course_reference']
        cursor = collection.find({}, {"_id":0, "course_name":1, "reference":1})
        documents = list(cursor)
        for entry in documents:
            course_name = entry['course_name']
            reference = entry['reference']
            course = course_name[:course_name.index(" -")].strip() # parse course name
            code_reference[course] = reference # push into code reference for use later
    except Exception as e:
        print(f"An exception occurred during the retrieval of code_reference: {e}")
    finally:
        client.close()
        return code_reference
# Method to write details into mongodb database
def update_courseDetails(client):
    # update entries within mongodb based on course details dict
    try:
        db = client['course_database']
        collection = db['course_reference']
        for name in course_details:
            filter = {"course_name": name} # use course name as filter
            update = {
                "$set": {
                    "prereq_courses":course_details[name][0], # ls of ls
                    "prereq_reference":course_details[name][1], # ls of ls
                    "grad":course_details[name][2], # boolean
                    "course_description":course_details[name][3], # string
                    "additional":course_details[name][4], # string
                    "levels":course_details[name][5], # ls
                    "schedule_types":course_details[name][6], # ls
                    "campus":course_details[name][7], # ls
                }
            }
            result = collection.update_one(filter, update, upsert = True) # Upsert into course_reference
        print(f"Matched count: {result.matched_count}")
        print(f"Modified count: {result.modified_count}")
        print(f"Upserted id: {result.upserted_id}")
    except Exception as e:
        print(f"Something went wrong during the process of writing prerequisite course details to mongodb: {e}")

if __name__ == "__main__":
    client = connection() # Establish initial connection
    # Some global variables
    course_ls = [] # list of course_names stored here (7190 entries)
    course_dict = {} # { course_name:course_link }
    course_reference = {} # for storing { num:course_name } key-value pairs
    course_catalog = {} # { course_name:([credits], [times offered])}
    code_reference = {} # { course_code: num } for e.g. { AAE 19000: 0 }
    error_courses = [] # contains ls of all courses in which the details spider was not able to parse
    course_details = {} # { course_name: ([[course_code]], [[reference]], grad, course_description, additional, [levels], [schedule_types], [campus])}
    # reference & course_code has to be ls within ls due to classes that can be substituted for each other
    code_reference = retrieve_codeReference(code_reference)
    spiders = [Detail_Spider] # put the spiders you want to run here (Reference_Spider, Catalog_Spider)
    run_spiders(spiders)
    print(f"Error courses: {error_courses}")
    print(f"Course Details: {course_details}")
    print(f"Number of encountered errors: {len(error_courses)}")
    # update_courseReference(client)
    # update_courseCatalog(client)
    update_courseDetails(client)
    client.close()

