# Theia Dashboard

The Theia dashboard is a javascript web client using react. 

## For Devs: Setup your Local Environment

For programs like node, I prefer to use a local install 
so that updates are easier and not tied to my OS. 
If you have a recent, working install of node + npm + babel, you may not have to do this. 
If your node version is out of date, or you don't feel like using the OS-installed node,
the following should work. 

1. Download nodejs from https://nodejs.org and un-tar it somewhere. 
   As of the time of this writing, there are issues with some versions of node. 
   Known-working version: 16.15.1

    cd my/local/spot
    wget https://nodejs.org/dist/vXX.X.X/node-vXX.X.X-linux-x64.tar.xz
    xz --decompress node-vXX.X.X-linux-x64.tar.xz 
    tar xvf node-vXX.X.X-linux-x64.tar 


2. Add the node-vXX.X.X-linux-x64/bin/ directory to your path (or equivalent)

    export PATH=$PATH:my/local/spot/node-vXX.X.X-linux-x64/bin

3. Check your install

    which node
    which npm

## Local Development

Install required packages

    git clone https://github.com/Salmon-Nation-Decentralized-Alliance/theia.git
    cd theia
    cd dashboard

    npm install
    # Or, if you want the latest goodness
    npm update

As a side note: this project was started with `npx create-react-app theia` and modified. 


Run the dashboard locally: 

    npm start
    # your browser should auto-open to http://localhost:3000

## Build for Production

    npm run build
    # upload everything in the build/ directory to your web server.
    # NOTE: The application's path is assumed to be '/'. If this is not accurate, update
    # package.json, the 'homepage' field.

