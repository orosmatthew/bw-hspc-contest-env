FROM ubuntu:22.04

# Setup

RUN apt-get update

RUN apt-get install curl -y
RUN apt-get install -y ca-certificates curl gnupg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
ENV NODE_MAJOR=20
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update

RUN apt-get install nodejs git openjdk-17-jdk-headless dotnet-sdk-7.0 build-essential cmake -y

ENV DOTNET_NOLOGO=true
ENV DOTNET_SKIP_FIRST_TIME_EXPERIENCE=true

RUN git config --global user.name "Admin"
RUN git config --global user.email noemail@example.com

# Prep Shared

WORKDIR /app
RUN mkdir shared
WORKDIR /app/shared
COPY ./shared/package*.json ./
RUN npm ci
COPY ./shared .

# Prep Sandbox

RUN mkdir sandbox
WORKDIR /app/sandbox
COPY ./sandbox/package*.json ./
RUN npm ci
COPY ./sandbox/ .


# Build/Run

WORKDIR /app/sandbox
RUN npm run build
RUN chmod +x ./docker/entry.sh
CMD ["./docker/entry.sh"]