FROM ubuntu:22.04

WORKDIR /app

RUN apt-get update

RUN apt-get install curl -y

RUN apt-get install -y ca-certificates curl gnupg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
ENV NODE_MAJOR=20
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update
RUN apt-get install nodejs -y

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