FROM ubuntu:22.04

# Setup

RUN apt-get update
RUN apt-get install curl -y 

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install nodejs git -y

RUN git config --global user.name "Admin"
RUN git config --global user.email noemail@example.com

# Prep Shared

WORKDIR /app
RUN mkdir shared
WORKDIR /app/shared
COPY ./shared/package*.json ./
RUN npm ci
COPY ./shared/ .
RUN npm run build

# Prep Web

RUN mkdir web
WORKDIR /app/web
COPY ./web/package*.json ./
RUN npm ci
COPY ./web/ .

# Env/Build/Run

ENV PORT=3000
EXPOSE 3000
EXPOSE 7006

RUN npm run build
RUN chmod +x ./docker/entry.sh
CMD ["./docker/entry.sh"]