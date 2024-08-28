# Course Scheduler

Welcome to the Purdue Course Scheduler project! This application helps Purdue students mapout prerequisites and schedule courses efficiently. The project is built using the MERN stack (MongoDB, Express, React, Node.js) and utilizes Docker for containerization. Below you will find the setup instructions to get the project up and running.

## **Table of Contents**

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Setting Up the Project](#setting-up-the-project)
4. [Running the Application](#running-the-application)
5. [Project Structure](#project-structure)
6. [Additional Information](#additional-information)

## **Prerequisites**

Ensure you have the following installed on your system:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [MongoDB](https://docs.mongodb.com/manual/installation/)

## **Project Structure**

The project consists of two main directories:

- `scheduler` (Frontend)
- `backend` (Backend)

Both directories contain a `Dockerfile` for containerization.

## **Setting Up the Project**

### 1. Clone the Repository

```bash
git clone https://github.com/Russolves/Course-Scheduler.git
cd "course-scheduler"
```
### 2. Setup MongoDB Collection
First you will need to make sure that you have installed the MongoDB Command Line Database Tools https://www.mongodb.com/try/download/database-tools
After doing so add the tools to your system's environmental Path to use the mongoimport command in your CLI.
Then you'll need to configure and set up a MongoDB collection in order to import the database.json file scraped from Purdue's course catalog pages. Import the provided 'database.json' file to your MongoDB instance using 'mongoimport':
```
mongoimport --uri mongodb+srv://<MONGO_USERNAME>:<MONGO_PASSWORD>@<MONGO_CLUSTER>/<MONGO_DATABASE> --collection <MONGO_COLLECTION> --file database.json --jsonArray
```
### 3. Configuring the .env file in backend
Create a '.env' file in the 'backend' directory with the following variable
```
MONGO_USERNAME=your_mongo_username
MONGO_PASSWORD=your_mongo_password
MONGO_CLUSTER=your_mongo_cluster
MONGO_DATABASE=your_mongo_database
MONGO_COLLECTION=your_mongo_collection
```
## **Running the Application**
Navigate to the root directory of the project and run the following command to build and start the containers using Docker
```
docker-compose up --build
```
This command will build the Docker images for both the frontend and backend and start the containers

## **Project Structure**
You should be able to access the application at 'http://localhost:3000' and 'http://localhost:2000' for the backend

### 1. Frontend Development
Developed using React.js for a responsive and interactive user interface
Implements state management and routing for smooth navigation and data flow
Features a modular component structure for maintainability and scalability

### 2. Backend Architecture
Built on Node.js with Express.js framework for efficient API handling
Implements CRUD operations for course and user data management
Utilizes middleware for enhanced security (Helmet) and cross-origin resource sharing (CORS)
Integrates body parsing for seamless data transfer between frontend and backend

### 3. Algorithm Implementation
Utilizes Directed Acyclic Graphs (DAGs) to model course prerequisites
Implements a custom topological sorting algorithm for optimal course sequencing
Employs a hybrid Depth-First Search (DFS) and Breadth-First Search (BFS) approach for exploring prerequisite combinations
Incorporates dynamic programming techniques to optimize the process of generating combinations

### 4. Database Integration
Utilizes NoSQL MongoDB for flexible, document-based data storage
Implements efficient querying and indexing for fast data retrieval

### 5. Docker Containerization
Leverages Docker for consistent development and deployment environments
Utilizes multi-container setup to isolate frontend, backend, and database services
Implements Docker Compose for streamlined container orchestration

This course scheduler demonstrates the practical application of graph theory in academic planning, showcasing how advanced algorithms can be integrated into real-world web applications. The project's architecture emphasizes modularity, scalability, and modern development practices.

## **Additional Information**
For any issues or contributions, feel free to open an issue or create a pull request on the GitHub repository
