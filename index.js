/*jshint esversion: 6 */
const express = require('express');
const bps = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const app = express();
const upload = require('express-fileupload');
let db = new sqlite3.Database(__dirname + '/database/database.db', (err) => {
	if (err) return console.error(err.message);
	console.log('connected to database successfully!');
});

app.set('view engine', 'ejs');

app.use(
	bps.urlencoded({
		extended: true
	})
);

app.use(
	session({
		name: 'sid',
		secret:
			'jotato! Dio! hoho! ora ora ora ora ora muda muda muda muda muda muda nani!!!! za wardu!!! tomare toki o.',
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 30,
			sameSite: true,
			secure: false
		}
	})
);
app.use(
	upload({
		createParentPath: true
	})
);
app.use('/', express.static('public'));
app.use('/home', express.static('public'));
app.use('/search/', express.static('public'));
app.use('/game/', express.static('public'));
app.use('/login', express.static('public'));
app.use('/signup', express.static('public'));
app.use(function(req, res, next) {
	res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	next();
});

let topbar_links = [];

let game_images = [];
//let game_ids = [];

function shuffleArray(array) {
	for (var i = array.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}
}

app.get('/', function(req, res) {
	res.redirect('/home');
});

app.get('/home', function(req, res) {
	//if (req.session.userId) {
	topbar_links = [];
	if (req.session.userId) {
		topbar_links = [ 'Profile', 'Library', 'SignOut' ];
		if (req.session.userType === 1.0) {
			topbar_links.push('AddGame');
		}
	} else {
		topbar_links = [ 'Login', 'SignUp' ];
	}
	game_images = [];
	db.all('Select * from games', (err, rows) => {
		if (err) return console.error(err.message);
		rows.forEach((row) => {
			//game_ids.push(row.id);
			game_images.push('Images/' + row.id + '/0.jpg');
		});
		shuffleArray(game_images);
		res.render('main', {
			links: topbar_links,
			gl: game_images
		});
	});

	//}  else {
	//res.redirect('/login');
	//}
});

app.get('/login', function(req, res) {
	if (req.session.userId) res.redirect('/home');
	else res.render('login', { erms: '' });
});
app.post('/login', function(req, res) {
	let qry = 'select * from users where id="' + req.body.userid + '" and password= "' + req.body.password + '" ;';
	console.log(qry);
	db.all(qry, function(err, row) {
		if (err) {
			console.log(err.message);
			res.render('login', { erms: 'login' });
			return;
		} else {
			if (row.length) {
				req.session.userId = req.body.userid;
				req.session.userType = row[0].type;
				res.redirect('/home');
			} else res.render('login', { erms: 'login' });
		}
	});
});

app.get('/signup', function(req, res) {
	if (req.session.userId) {
		res.redirect('/home');
	} else {
		res.render('signup', { erms: '' });
	}
});
app.post('/signup', function(req, res) {
	console.log(req.body);
	const { name, userid, email, dob, password, cpassword } = req.body;
	let qry =
		'insert into users values("' + name + '","' + userid + '","' + email + '","' + dob + '","' + password + '",0);';
	console.log(qry);
	db.run(qry, [], function(err) {
		if (err) {
			console.log(err);
			res.render('signup', { erms: 'error' });
		} else {
			res.redirect('/login');
		}
	});
});

app.get('/signout', function(req, res) {
	req.session.destroy();
	res.redirect('/');
});

app.get('/search/:val', function(req, res) {
	topbar_links = [ 'Home' ];
	if (req.session.userId) {
		topbar_links.push('Profile');
		topbar_links.push('Library');
		topbar_links.push('SignOut');
	} else {
		topbar_links.push('Login');
		topbar_links.push('SignUp');
	}
	let sid = req.params.val;
	let query =
		'select * from games where upper(name) like "%' +
		sid.toUpperCase() +
		'%" or upper(id) like "%' +
		sid.toUpperCase() +
		'%";';
	let search_img = [];
	console.log(query);

	db.all(query, (err, rows) => {
		if (err) return console.error(err.message);
		rows.forEach((row) => {
			search_img.push('Images/' + row.id + '/0.jpg');
		});
		console.log(search_img);
		res.render('main', {
			links: topbar_links,
			gl: search_img
		});
	});
});

app.get('/library', function(req, res) {
	if (req.session.userId) {
		topbar_links = [ 'Home', 'Profile', 'SignOut' ];
		if (req.session.userType === 1.0) topbar_links.push('AddGame');
		let uid = req.session.userId;
		let qry = 'select gid from owns where id ="' + uid + '";';
		console.log(qry);
		let simg = [];
		db.all(qry, function(err, rows) {
			if (err) {
				res.redirect('/home');
			} else {
				rows.forEach((row) => {
					simg.push('Images/' + row.gid + '/0.jpg');
				});
				res.render('main', { links: topbar_links, gl: simg });
			}
		});
	} else res.redirect('/login');
});

app.get('/buy/:val', function(req, res) {
	if (req.session.userId) {
		let qry = 'insert into owns values ("' + req.session.userId + '","' + req.params.val + '");';
		db.run(qry, [], function() {
			res.redirect('/library');
		});
	} else {
		res.redirect('/login');
	}
});

app.get('/game/:val', function(req, res) {
	//if (req.session.userId) {
	topbar_links = [ 'Home' ];
	if (req.session.userId) {
		topbar_links.push('Profile');
		topbar_links.push('Library');
		topbar_links.push('SignOut');
	} else {
		topbar_links.push('Login');
		topbar_links.push('SignUp');
	}
	if (req.session.userType === 1.0) topbar_links.push('AddGame');
	let gid = req.params.val;
	let log = '';
	if (!req.session.userId) log = 'You must be logged in to do this!';
	//let name='';
	//let rating=0.0;
	//let val=59.99;
	//let desc='';

	let query = 'select * from games where ID="' + gid + '";';

	db.all(query, function(err, r) {
		if (err) throw err;
		else {
			let qry2 = 'select id,review,rating from reviews where game_id ="' + gid + '";';
			console.log(qry2);
			db.all(qry2, function(err, r2) {
				if (err) throw err;
				else {
					console.log(r2);
					res.render('game', {
						links: topbar_links,
						g_img: 'Images/' + gid + '/1.jpg',
						vid: 'Images/' + gid + '/trailer.mp4',
						heading: r[0].name,
						rate: r[0].rating,
						description: r[0].description,
						price: r[0].price,
						dev: r[0].developer,
						gen: r[0].genres,
						comm: r2,
						lin: log
					});
				}
			});
		}
	});
	//} else {
	//		res.redirect('/login');
	//	}
});

app.post('/game/:val', function(req, res) {
	let gid = req.params.val;
	let uid = req.session.userId;
	let qry =
		'insert into reviews values("' + uid + '","' + gid + '","' + req.body.review + '",' + req.body.rating + ');';
	console.log(qry);
	db.run('delete from reviews where id="' + uid + '" and game_id="' + gid + '";', []);
	db.run(qry, [], function(err) {
		res.redirect('/game/' + gid);
	});
});

app.get('/AddGame', function(req, res) {
	topbar_links = [ 'Home', 'Profile', 'Library', 'Signout' ];
	if (req.session.userId && req.session.userType === 1.0) {
		res.render('addgame', { links: topbar_links });
	} else res.redirect('/login');
});

app.post('/AddGame', function(req, res) {
	if (req.session.userId && req.session.userType === 1.0) {
		let uid = req.session.userId;
		let title = req.body.gameTitle;
		let gid = req.body.gameId;
		let desc = req.body.description;
		let genres = req.body.genre;
		let i1 = req.files.himage;
		let i2 = req.files.gimage;
		let trailer = req.files.trailer;
		let price = req.body.price;

		let qry =
			'insert into games values("' +
			gid +
			'","' +
			title +
			'",1,"' +
			desc +
			'",' +
			price +
			',"' +
			genres +
			'",+"Gamer\'s Heaven");';
		db.run(qry, [], function(err) {
			if (err) console.log(err);
		});

		i1.mv(__dirname + '/public/Images/' + gid + '/0.jpg');
		i2.mv(__dirname + '/public/Images/' + gid + '/1.jpg');
		trailer.mv(__dirname + '/public/Images/' + gid + '/trailer.mp4');

		res.redirect('/home');
	} else res.redirect('/login');
});

app.listen(3000, function() {
	console.log('Listening at port 3000.');
});
