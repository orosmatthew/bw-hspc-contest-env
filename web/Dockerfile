FROM ubuntu:22.04

WORKDIR /app

RUN apt-get update

RUN apt-get install curl -y

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

RUN apt-get install git -y

RUN git config --global user.name "Admin"

RUN git config --global user.email noemail@example.com

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=3000

EXPOSE 3000

EXPOSE 7006

RUN npm run build

CMD ["node", "build"]