// TODO: всё переписать или хотя бы проверить

function Game_viewer( m, activate ) {
	this.moves = m;
	this.activated = false;
	if( activate )
		this.activate();
	var g = this;
	var cb = function() {
		g.new_game_started_event.call(g);
	}
	if( typeof(Game_viewer.callback_ongamestart_id)=='undefined' )
		Game_viewer.callback_ongamestart_id = Game.onstart.push( cb ) - 1;
	else
		Game.onstart[Game_viewer.callback_ongamestart_id] = cb;
}

Game_viewer.prototype = {
	activate: function() {
		var old = game;
		game = new Game(Game_viewer_empty,Game_viewer_empty);
		this.activated = (old!=game);
	},
	deactivate: function() {
		this.activated = false;
		this.moves = [];
	},
	new_game_started_event: function() {
		if( (game.players[0].hasOwnProperty('title') && game.players[0].title=='gameviewer stub') && (game.players[1].hasOwnProperty('title') && game.players[1].title=='gameviewer stub') )
			return;
		this.deactivate();
	},
	next: function() {
		if( !this.activated )
			return false;
		if( !game.checkfinish() )
			game.move( this.moves[game.moves.length] );
		return true;
	},
	prev: function() {
		if( !this.activated )
			return false;
		if( game.moves.length == 0 )
			return false;
		game.moves.splice(-1,1);
		l = new LL(this);
		// надо заново вызвать callback`и
		$('.img-move:last').remove();
		if( game.moves.length > 0 ) {
			$('.img-move:last').remove();
			Game.onmovemade.fire_events( game.moves[game.moves.length-1].x, game.moves[game.moves.length-1].y, game.moves.length-1 );
		};
		return true;
	}
}

function Game_viewer_empty() {
}

Game_viewer_empty.title='gameviewer stub';