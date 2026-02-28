FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

# Arrancar servidor de desarrollo de Next.js
CMD ["npm", "run", "dev"]
