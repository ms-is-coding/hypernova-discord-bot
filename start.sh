clear
git fetch --all
git reset --hard origin/main
/usr/local/bin/npm install -g yarn
yarn install
/usr/local/bin/node NODE_ENV=production deploy.js
/usr/local/bin/node index.js
