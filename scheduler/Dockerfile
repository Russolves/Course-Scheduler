FROM node:20.6.1

WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# # Build the React app for production
# RUN npm run build

# Expose the application port
EXPOSE 3000

# # Serve the built app using serve
# RUN npm install -g serve
# CMD ["serve", "-s", "build"]

# For development purposes
CMD ["npm", "start"]
