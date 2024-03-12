FROM ubuntu:22.04

# Setup

RUN mkdir web
WORKDIR /app/web

RUN apt-get update
RUN apt-get install curl -y 

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install nodejs git -y

RUN git config --global user.name "Admin"
RUN git config --global user.email noemail@example.com

# Prep Web

COPY ./web/package*.json ./
RUN npm install
COPY ./web/ .

# Prep Shared

WORKDIR /app
RUN mkdir shared
WORKDIR /app/shared
COPY ./shared/ .

# Env/Build/Run

WORKDIR /app/web

ENV PORT=3000
EXPOSE 3000
EXPOSE 7006

RUN npm run build
RUN chmod +x ./docker/entry.sh
CMD ["./docker/entry.sh"]