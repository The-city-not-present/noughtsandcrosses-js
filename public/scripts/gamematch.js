/*
	возможные действия :
	- начать игру
	- закончена игра
*/


function match( participants, positions ) {
	if(match.running!='idle'){
		match.log('нельзя начать игру, match.running != \'idle\'');
		return;
	}
	match.running = 'preparing';
	match.table = [];
	match.positions = positions;
	match.pairings = [];
	for( var i=0; i<participants.length; i++ )
		if( typeof(participants[i])=='function' )
			participants[i] = [participants[i]];
	// сгенерировать пары
	for( i=0; i<participants.length; i++ )
		for( var j=i+1; j<participants.length; j++ )
			for( var k = 0; k<participants[i].length; k++ )
				for( var l = 0; l<participants[j].length; l++ ) {
					match.pairings.push([participants[i][k],participants[j][l]]);
					match.pairings.push([participants[j][l],participants[i][k]]);
				}
	setTimeout( match.next_game, 0 );
	match.time_start = new Date();
	//game.verbose = 0;
	match.running = 'running';
}

match.running = 'idle';

match.next_game = function() {
	var n = match.table.length;
	i_pairing = n % match.pairings.length;
	i_position = n / match.pairings.length | 0;
	if( i_position>=match.positions.length ) {
		match.running = 'idle';
		match.log('все партии сыграны');
		return;
	}
	if( typeof(match.pairings[i_pairing][0].title)=='undefined' )
		match.pairings[i_pairing][0].title = match.pairings[i_pairing][0].name;
	if( typeof(match.pairings[i_pairing][1].title)=='undefined' )
		match.pairings[i_pairing][1].title = match.pairings[i_pairing][1].name;
	match.log('началась игра (позиция '+(i_position+1)+'/'+match.positions.length+', пара '+(i_pairing+1)+'/'+match.pairings.length+') : '+match.pairings[i_pairing][0].title+' vs '+match.pairings[i_pairing][1].title);
	match_game( match.pairings[i_pairing][0], match.pairings[i_pairing][1], {position: match.positions[i_position]} )
}

match.log = function( arg ) {
	console.log('match_game :   ' + arg);
}

// TODO: здесь криво, если задана начальная позиция
function match_game( pl0, pl1, opts ) {
	if(match.running!='running')
		return;
	var setup_start_position = ( (typeof(opts)=='object') && opts.hasOwnProperty('position') );
	if( setup_start_position ) {
		match_game_stub.cb0 = pl0;
		match_game_stub.cb1 = pl1;
		match_game_stub.position = opts.position;
		game = new Game(match_game_stub,match_game_stub);
	} else {
		game = new Game( pl0, pl1 );
	}
}

function match_game_stub() {
	if(game.moves.length<match_game_stub.position.length) {
		game.move( match_game_stub.position[game.moves.length] );
		return;
	};
	game.players[0] = new Player(match_game_stub.cb0)
	game.players[1] = new Player(match_game_stub.cb1)
	game.move_now();
}

match_game.finish = function( arg ) {
	if(match.running!='running')
		return;
	var val = -10000;
	if( arg == 0 )
		val = game.moves.length;
	if( arg == 1 )
		val = -game.moves.length;
	match.table.push( { players: [game.players[0].cb,game.players[1].cb], result: game.moves.length * (1-arg*2) } );
	if( arg == 0 )
		match.log('победа крестиков  :   +'+val+',   в ролях : '+game.players[0].cb.title+' и '+game.players[1].cb.title+"\n"+match.percent_avg_time_end());
	if( arg == 1 )
		match.log('победа ноликов    :   '+val+',   в ролях : '+game.players[0].cb.title+' и '+game.players[1].cb.title+"\n"+match.percent_avg_time_end());
	if( (arg!=0) && (arg!=1) )
		match.log('ничья             :   '+val+',   в ролях : '+game.players[0].cb.title+' и '+game.players[1].cb.title+"\n"+match.percent_avg_time_end());
	setTimeout( match.next_game, 1000 );
};

Game.onwin.push( match_game.finish );




match.percent = function() {
	return ''+Math.round(match.table.length*10000/(match.pairings.length*match.positions.length))/100+' %';
};
match.avg = function() {
	return (new Date()-match.time_start)/match.table.length;
}
match.time_end = function() {
	return new Date(match.time_start.valueOf()+(match.pairings.length*match.positions.length)*match.avg());
}
match.avg_human = function() {
	var res = Math.round(match.avg()/1000);
	return ''+(res/60|0)+'m '+(res%60)+'s';
}

match.percent_avg_time_end = function() {
	return match.percent()+'     ('+match.avg_human()+')     '+match.time_end();
}

// вычисляет вероятность победы
//	d1, d2 - рейтинги
var elo_e = function( d1, d2 ) {
	return (2/elo_fora)*(-.5+1/(1+Math.pow(10,(d2-d1)/400)));
}

var elo_fora = 50;

// вычисляет прибавку к рейтингу
//	points - набранные очки, желательно массив (по результатам неск. игр; но можно число - после одной игры
//	d1     - свой рейтинг
//  d2     - рейтинг соперника, можно массив
var elo_diff = function( points, d1, d2 ) {
	var sum_p = 0;
	var sum_e = 0;
	if( typeof(points)=='number' )
		points = [ points ];
	if( !(points instanceof Object)|| !points.hasOwnProperty('length') )
		return;
	if( typeof(d1)!='number' )
		return;
	if( typeof(d2)=='number' ) {
		var temp = d2;
		d2 = [];
		for(var i=0; i<points.length; i++ )
			d2.push( temp );
	}
	if( !(d2 instanceof Object)|| !d2.hasOwnProperty('length') )
		return;
	var p2 = [];
	for( var i=0; i<points.length; i++ ) {
		p2[i] = 1/10000;
		if( points[i]>0 )	p2[i] = 1 / ( points[i] + elo_fora );
		if( points[i]<0 )	p2[i] = 1 / ( points[i] - elo_fora );
		sum_p += p2[i];
		sum_e += elo_e( d1, d2[i] );
	}
	return elo_diff.k * ( sum_p - sum_e );
}

elo_diff.k = 600;


// скачать список участников из пар
var ratings = function() {
	var result = [];
	for( var i=0; i<match.table.length; i++ ) {
		var found0 = -1;
		var found1 = -1;
		for( var j=0; j<result.length; j++ ) {
			if( typeof(match.table[i].players[0].title)=='undefined' )
				match.table[i].players[0].title = match.table[i].players[0].name;
			if( typeof(match.table[i].players[1].title)=='undefined' )
				match.table[i].players[1].title = match.table[1].players[0].name;
			if( match.table[i].players[0].title == result[j].me )
				found0 = j;
			if( match.table[i].players[1].title == result[j].me )
				found1 = j;
		}
		if( found0>=0 ) {
			result[found0].games.push( { opponent: match.table[i].players[1].title, result: match.table[i].result } );
		} else {
			result.push( { me: match.table[i].players[0].title, games: [ { opponent: match.table[i].players[1].title, result: match.table[i].result } ] } );
		};
		if( found1>=0 ) {
			result[found1].games.push( { opponent: match.table[i].players[0].title, result: -match.table[i].result } );
		} else {
			result.push( { me: match.table[i].players[1].title, games: [ { opponent: match.table[i].players[0].title, result: -match.table[i].result } ] } );
		};
	};
	ratings.result = result;
	return ratings.renew();
};

// вычислить рейтинги
ratings.renew = function() {
	var d_new = [];
	for( var i=0; i<ratings.result.length; i++ ) {
		var d1 = ratings.result[i].elo;
		if( typeof(d1)=='undefined' )
			d1 = ratings.default_value( ratings.result[i].me );
		var points = [];
		var d2 = [];
		for( var j=0; j<ratings.result[i].games.length; j++ ) {
			points.push( ratings.result[i].games[j].result );
			var found = -1;
			for( var k=0; k<ratings.result.length; k++ )
				if( ratings.result[i].games[j].opponent == ratings.result[k].me )
					found = k;
			d2.push( found>=0 ? ratings.result[found].elo : 1200 );
			if( typeof(d2[j])=='undefined' )
				d2[j] = ratings.default_value( ratings.result[i].games[j].opponent );;
		};
		d_new[i] = d1 + elo_diff( points, d1, d2 );
	};
	for( var i=0; i<ratings.result.length; i++ )
		ratings.result[i].elo = d_new[i];
	ratings.to_string();
	return ratings.result;
};

ratings.default_value = function( arg ) {
	for( var i=0; i<ratings.default_values.length; i++ )
		if( arg == ratings.default_values[i].title )
			return ratings.default_values[i].elo;
	return 1200;
}

ratings.default_values = [
	{ title: 'ai_0_0_4_6s', elo: 1301 },
	{ title: 'ai_0_0_4_10s', elo: 1304 },
	{ title: 'ai_0_0_4_60s', elo: 1329 },
	{ title: 'ai_0_0_4_10_static', elo: 1038 },
	{ title: 'ai_0_0_3_6s', elo: 1124 },
	{ title: 'ai_0_0_3_10s', elo: 1235 }
];

// экспортировать таблицу рейтингов как текст, разделитель - знаки табуляции
// только рейтинги, без списка игр
ratings.to_string = function() {
	var s='';
	for( var i=0; i<ratings.result.length; i++ ) {
		s += ratings.result[i].me + "\t" + ratings.result[i].elo + "\n";
	};
	console.log(s)
	return s;
};

// экспортировать всех участников как текст, разделитель - знаки табуляции
// то есть участник \t противник \t результат
ratings.to_string_full = function() {
	var s='';
	for( var i=0; i<ratings.result.length; i++ )
		for( var j=0; j<ratings.result[i].games.length; j++ ) {
			s += ratings.result[i].me + "\t" + ratings.result[i].games[j].opponent + "\t" + ratings.result[i].games[j].result + "\n";
		};
	console.log(s)
	return s;
};



