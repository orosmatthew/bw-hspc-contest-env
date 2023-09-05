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

WORKDIR /opt

RUN apt-get install wget -y

RUN wget -O java.tar.gz https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.7%2B7/OpenJDK17U-jdk_x64_linux_hotspot_17.0.7_7.tar.gz

RUN tar -xzvf java.tar.gz

RUN rm java.tar.gz

ENV JAVA_PATH=/opt/jdk-17.0.7+7/bin

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["node", "build"]