# base image
FROM node:9.6.1

EXPOSE 3000

RUN mkdir /usr/src/app
WORKDIR /usr/src/app/ui

ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY package.json /usr/src/app/package.json

RUN npm install react-scripts@1.1.1 -g
RUN npm install

# start app
CMD ["npm", "start"]