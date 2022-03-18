FROM node:latest

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json /app

RUN npm install

# Bundle app source
COPY . /app

CMD ["npm", "prod"]
