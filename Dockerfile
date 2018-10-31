FROM node:alpine

WORKDIR /work
ADD . /work
RUN npm install
EXPOSE 8081
CMD npm start


