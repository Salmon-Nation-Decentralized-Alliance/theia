# Setup Node

If you have a recent, working install of node + npm + babel, you may not have to do this. 

If your node version is out of date, or you don't feel like using the OS-installed node, 
perhaps this is useful. For programs like node, I prefer to use a local install 
so that updates are easier and not tied to my OS. 


1. Download nodejs from https://nodejs.org and un-tar it somewhere

    cd my/local/spot
    wget https://nodejs.org/dist/v17.5.0/node-v17.5.0-linux-x64.tar.xz
    xz --decompress node-v17.5.0-linux-x64.tar.xz 
    tar xvf node-v17.5.0-linux-x64.tar 

2. Add the node-vXX.X.X-linux-x64/bin/ directory to your path (or equivalent)

    export PATH=$PATH:my/local/spot/node-vXX.X.X-linux-x64/bin

3. Check your install

    which node
    which npm

4. Install required packages

    npm install
    
    # Or, if you want the latest goodness
    npm update

As a side note: this project was started with `npx create-react-app theia` and modified. 

# Run the Dashboard Locally

    npm start
    # your browser should auto-open to http://localhost:3000

# Build for Production

    npm run build
    # upload everything in the build/ directory to your web server.
    # NOTE: The application's path is assumed to be '/'. If this is not accurate, update
    # the 'homepage' field in package.json

