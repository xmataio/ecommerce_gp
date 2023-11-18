# E-Commerce Group Project

## Overview
This application is an E-Commerce website for a theoretical power plant industry. The website was created by myself and three other NIU students as part of a group project that was assigned towards the end of the semester.

## Tools
The website was implemented using the following:
- Express.js
- HTML
- JavaScript
- MariaDB
- MySQL
- Node.js

## How to Access
### Preconditions
This website can only be run on your local machine due to NIU's servers not allowing the installation of Node.js and its related packages. NIU's MariaDB servers however, can still be accessed through your local machine.
### Installing Node.js / npm
The following link will bring you to the installation page for Node.js; download the installer for your respective OS and follow the instructions.
- Node.js Installation Page: https://nodejs.org/en/download
To check and see if the installation was successful, run the following command in your terminal: `node -v`
To ensure that npm was installed also, run the following command: `npm -v`
### Setting Up the Website
1. To host the website on your machine, clone this repository with the following command: `git clone https://github.com/xmataio/ecommerce_gp.git`
2. Go into the project folder with the following command: `cd 467gp`
3. Install all of the necessary packages used in this project with the following command: `npm i`
4. Run the server by typing in: `npm run devStart`. Note that there's a package called nodemon that automatically updates the website should there be any programming changes.
5. If at any point you want to restart the server for any possible changes that may not have updated while you're programming, use `CTRL + C` in the terminal to close the server and then retype `npm run devStart` to start it up again.