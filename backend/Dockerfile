# Official Node.js image
FROM node:20.6.1

# Create and change to backend app directory
WORKDIR /usr/src/app

# Copy
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose local port
EXPOSE 2000

# Command to run application
CMD ["npm", "start"]