setup:
    cd server && npm install

run:
    browser: firefox --private-window app/index.html 
    server: cd server && node .