# BW Contest Web

## Development Environment Setup for Windows

First install WSL on windows by going to the terminal and entering

```powershell
wsl --install
```

Then you will need to restart your computer. More details about WSL can be found [here](https://learn.microsoft.com/en-us/windows/wsl/). WSL is essentially an Ubuntu VM on windows, this is where all development will be done. Once WSL is installed, you should be able to open it by searching for Ubuntu in the start menu which will then open a terminal into the Ubuntu VM. First you will need to install NodeJS. We want NodeJS 20 but the current version on Ubuntu is outdated so we will use the NodeSource repository to download a later version. Run these command to do so.

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt update
sudo apt install nodejs -y
```

More details can be found [here](https://github.com/nodesource/distributions).

You can verify you then have the right version by running

```bash
node --version
# You should get back 20.x.x
```

You will need a database to work with so you need to install Postgres.

```bash
sudo apt install postgresql
```

Then start and enable it

```bash
sudo service postgresql start
sudo service postgresql enable
```

We will now create a database and user to work with


```
sudo -u postgres psql
```

This will open the postgres terminal, run these commands

```postgres
CREATE ROLE bwcontest WITH LOGIN PASSWORD 'pass123';
CREATE DATABASE bwcontest;
ALTER DATABASE bwcontest OWNER TO bwcontest;
GRANT ALL PRIVILEGES ON DATABASE bwcontest TO bwcontest;
```

Then type `\q` to exit. Feel free to change the role name, database name, and password to whatever you want. Just make sure to remember them. This is only for local development so it doesn't need to be very secure.

Now we can clone the repo. Remember, all development must be in WSL so we will clone the repo in WSL. So inside of WSL, I like to create a folder called `dev` inside my home folder, but feel free to clone it anywhere else inside of WSL. Ensure git is installed in WSL with `sudo apt install git -y`

```bash
cd ~/dev # or wherever else
git clone https://github.com/orosmatthew/bw-hspc-contest-env
```

Next, you want to use VSCode for development which can be downloaded [here](https://code.visualstudio.com/)

Make sure you have the WSL extension installed. You can then connect WSL by opening VSCode and pressing `ctrl+shift+p` and searching for `Connect to WSL` and pressing enter. You can now press `File -> Open Folder` and it will now show the WSL file directories instead of Windows. Find and open the `web` directory in the `bw-hspc-contest-env` repo. You can now open the terminal in VSCode by pressing `ctrl+j`. This should be the terminal inside of WSL. This can be verifies by running `uname` and it should return `Linux`. Install node dependencies by running...

```bash
# make sure you are in the bw-hspc-contest-env/web dir
npm install
```

Now you need to fill out an environment file for local development. Create a `.env` file in `web/.env`. Add this information or changed with the relevant details related to how you set up your database.

```env
DATABASE_URL=postgresql://bwcontest2:pass123@127.0.0.1:5432/bwcontest2
```


You now need to push the schema generated via the Prisma ORM to set up the tables in the database. This can be done by running...

```bash
npx prisma db push
```

This should be run anytime you change the database schema. Next I would recommend trying to build the entire project to make sure you don't get any errors by running...

```bash
npm run build
```

If everything was set up correctly, this should succeed.

For local development, you can start the development server by running...

```bash
INIT=true npm run dev
```

The `INIT=true` environment variable indicates that the git server should start and that the default login account of username `admin` and password `bw123` should be created. Note that the development server should always be running when programming as it generates types for proper intellisense even if you don't necessarily need to look at the browser output.






## Build Instructions

### For all builds

You must fill out a `.env` file. An example is provided in `.env.example`. This is used for dev, production, and docker.

Build dependencies:

- NodeJS
- Docker (for docker build)

### For Development

```bash
npm i
npm run dev
```

### For Production

```bash
npm i
npm run build
node build
```

### Docker

Copy the example docker compose file

```bash
# pwd web/
cp docker/docker-compose.example.yml ./docker-compose.yml
```

Fill out `.env` file

```bash
cp .env.example .env
```

Run the container

```bash
docker compose up --build
```
