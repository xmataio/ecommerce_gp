# 467-group-project


## Prerequisites

You will need to host the website on your own computer. Node.js (and related packages) are not available on NIU's system, nor will they let you install it on those. However, we can still access NIU's mariadb server from local machine.

### Install Node.js

- Windows: https://nodejs.org/en/download

After you install Node.js, confirm it successfully downloaded by doing: ```node -v```

Confirm node package manager (npm) has also installed by doing ```npm -v```




## Installation

1. Clone the repository by doing `git clone https://github.com/jnomikos/467-group-project.git`

2. Go into the folder `cd 467-group-project`

3. Now you will need to install all the packages used. Simply do ```npm i```

4. To run the server, just type ```npm run devStart```
This uses a package called nodemon which automatically will update your website while you are programming. No need to manually close it using "CTRL+C" and reopening. Some changes still will require it. Like probably HTML changes.




## Guide

I highly recommend checking out this video. Even if you are not planning on directly working with this stuff, it is good to know what things do and where they are when working in express.js. 

https://www.youtube.com/watch?v=SccSCuHhOw0



If you plan on working on HTML stuff, it is in the views folder. Notice they have the ".ejs" extension instead of ".html". EJS stands for (Embedded JavaScript Templating) and it is one of the ways to embed HTML into Node JS with express. 