FROM ubuntu:24.04

# Setup

RUN apt-get update

RUN apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash -

RUN apt-get -y install nodejs git openjdk-21-jdk-headless dotnet-sdk-8.0 build-essential cmake python3

ENV DOTNET_NOLOGO=true
ENV DOTNET_SKIP_FIRST_TIME_EXPERIENCE=true

RUN git config --global user.name "Admin"
RUN git config --global user.email noemail@example.com

# Prep Shared

WORKDIR /app/shared
COPY ./shared/package*.json ./
RUN npm ci
COPY ./shared .

# Prep Sandbox

WORKDIR /app/sandbox
COPY ./sandbox/package*.json ./
RUN npm ci
COPY ./sandbox/ .

# Build/Run

WORKDIR /app/shared
RUN npm run build

WORKDIR /app/sandbox
RUN npm run build

RUN chmod +x ./docker/entry.sh
CMD ["./docker/entry.sh"]