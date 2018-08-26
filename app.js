const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const mysql = require('mysql');
const bot_token = require('./token.json').token;
const sync = require('sync-request');

const app = express();
const sqlcon = mysql.createConnection({
    host: "localhost", 
    user: "root", 
    password: "",
    database: "zbigniew-bot",
    supportBigNumbers: true,
    bigNumberString: true
})

sqlcon.connect(e => {
    if(e) throw e;
    console.log("Połączono prawodłowo z bazą danych.");
})

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(flash());

// === DATABASE CONTROLLER === //
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

router.get('/ab', (req, res) => {
    res.render('test');
});

app.use('/', router);

module.exports = app;