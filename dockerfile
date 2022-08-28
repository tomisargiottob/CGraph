FROM node:16

# Create app directory
RUN mkdir app
WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

CMD [ "npm", "run", "start" ]