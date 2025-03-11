FROM node:22

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Bundle all source code
COPY . .

# Expose application port
EXPOSE 8080

# Start the app
CMD ["npm", "start"]