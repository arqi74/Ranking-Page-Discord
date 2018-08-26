// === MODULES === //
const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const mysql = require('mysql');
const sync = require('sync-request');

const bot_token = require('./token.json').token;
const mysql_c = require('./mysql.json');

const app = express();

// === MYSQL CONNECTION === //
const sqlcon = mysql.createConnection({
    host: mysql_c.host, 
    user: mysql_c.user, 
    password: mysql_c.password,
    database: mysql_c.database,
    supportBigNumbers: true,
    bigNumberString: true
})

sqlcon.connect(e => {
    if(e) throw e;
    console.log("Połączono prawodłowo z bazą danych.");
})

// === LOADING PAGE === //

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(flash());

// === RANKING PAGE === //
const router = express.Router();

router.get('/ranking', (req, res) => {
    sqlcon.query("SELECT * FROM scoreboard ORDER BY xp DESC LIMIT 10", (e, result) => {
        if(e) {
            res.write("Błąd");
            res.send();
            return;
        }
        var data = {};
        data.xp = result;
        for(i=0; i<data.xp.length; i++) {
            var discordres = sync("GET", "https://discordapp.com/api/users/"+data.xp[i].userid, {
                headers: {
                    "Authorization": "Bot "+bot_token
                }
            })
            discordres = JSON.parse(discordres.getBody("utf8"));
            data.xp[i].name = discordres.username;
            data.xp[i].avatarurl = "https://cdn.discordapp.com/avatars/"+data.xp[i].userid+"/"+discordres.avatar+".png";
            data.xp[i].level = Math.floor(Math.sqrt(data.xp[i].xp)*0.5);
        }
        res.render('home', data);
    });
});


// === EXAMPLE PAGE === //
router.get('/ab', (req, res) => {
    res.render('example');
});

app.use('/', router);

module.exports = app;