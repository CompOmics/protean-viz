#frontend
FROM node:22 AS build-stage
WORKDIR /frontend
COPY frontend/ .
RUN npm install
RUN npm run build

