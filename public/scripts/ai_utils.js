
// общие параметры для скрипта ai_estimates_static.js

andrej_move = {
	version : 'version property is depricated from 05.04.2015',

	// два коэффициента для Andrej_node.update_estimate
	k_estimate_me		: 0.9, // (при создании позиции)
	//в какой мере угроза берётся от максимальной з позциии, а в какой мере от оценки хода

	// для файла ai_engine.js
	// там есть такой метод, Andrej_position_hash.evaluate_collect_candidates, туда смотри
	k_engine_candidates_reliability_power : 4,

	precision				: 0.136, // коэффициента для diff
	precision_move_order	: 0.05441, // коэффициента для diff
	reliability_default		: 0.38, // начальное значение reliability для ходов в новой позиции
	k_reduce_mediana		: 0.2, // для update_moves_probability

	// параметры движка для правил
	// как-то наоборот
	// я кажется, не очень по-русски сказал, но да кого волнует?
	rule_square : true
}




// параметр для engine - collect_candidates_count
andrej_move.k_collect_candidates_count = function( arg ) {
	var result = Math.round( 6*Math.sqrt( arg ) );
	return ( result>20 ? result : 20 );
}




// данные для calc_est
// чтобы посчитать оценку для набора из n своих знаков
andrej_move.calc_est_data = [
	[
		0,
		0.037037037037037035,
		0.14,
		0.38,
		1,
		1
	],
	[
		0,
		0.023148148148148147,
		0.06944444444444445,
		0.25,
		0.9999,
		1
	]
];
andrej_move.calc_est_data[0][false] = 0;
andrej_move.calc_est_data[1][false] = 0;
/*andrej_move.calc_est_data_alt0 = [
	[ 1/81,  1/27, 1/9,  1/2, 1,   1 ],
	[ 1/100, 1/36, 1/12, 1/3, 0.8, 1 ]
];
andrej_move.calc_est_data_alt1 = [ // это исходные, посчитанные на бумажке, другие варианты - отсебятина
	[ 1/81,  1/27, 1/9,  1/3, 1,   1 ],
	[ 1/162,  1/54, 1/18, 1/6, 1/2, 1 ]
];
andrej_move.calc_est_data_alt2 = [
	[ 1/81,     1/27,    1/9,     1/3,    1,      1 ],
	[ 1.45/162, 1.45/54, 1.45/18, 1.45/6, 1.45/2, 1 ]
];*/

// ключевая функция, возвращающая оценку для клетки в линии для Andrej_estimates
andrej_move.calc_est = function( n, kk ) {
	if( !(kk>=0) )
		throw new Andrej_error( 'andrej_move.calc_est : !( kk>=0 )' );
	return andrej_move.calc_est_data[kk][n];
}




// ключевая функция
// Andrej_estimates возвращает оценки по какой-то своей шкале
// а у нас оценки по своей шкале
// сейчас нет разницы, ибо и то, и то - вероятности от нуля до единицы
// но раньше тут было одно по логарифмической шкале, а другое - обычная оценка +/-
// функцию не удаляю, так как символически она жестко логична - это как перевод единиц измерения
andrej_move.ar_estimate_to_val = function( est ) {
	return ( est>0 ? est : 0 );
}




// ключевое для подсчёта reliabilities
// см. Andrej_node.update_estimate
andrej_move.reduce_reliabilities_by_depth = function( val ) {
	return 1 - 0.8 * ( 1 - val );
}




// Как считается общая оценка? Все с весовыми коэффициентами отображаются на другое пространство, потом считается среднее, потом
// обратно; раньше это было, чтобы считать среднюю квадратичную угрозу, но потом, как сейчас вижу, переделал на четвёртую степень
andrej_move.translate = {
	forward : function( arg ) {
		var val = andrej_move.posindex_probability_to_score(arg);
		return ( val>300 ? 300 : ( val<-300 ? -300 : val ) );
	},
	backward : function( arg ) {
		return andrej_move.posindex_score_to_probability(arg);
	}
};




// a - вероятность, что ход приведёт к победе игрока А
// b - вероятность, что ход приведёт к победе игрока В, a+b != 1
// rel - достоверность информации
// вернёт что-то типа "вероятность, что победа А настанет раньше" ( val + (1-val) == 1 )
// я не шибко вникал в теорию, потыкал в разные уравнения в Маткаде, вроде, это даёт оч. хороший результат
andrej_move.diff = function( a, b, rel ) {
	var a = andrej_move.posindex_expectancy_to_score(a);
	if( a==Infinity ) a=1000;
	if( a==-Infinity ) a=-1000;
	var b = andrej_move.posindex_expectancy_to_score(b);
	if( b==Infinity ) b=1000;
	if( b==-Infinity ) b=-1000;
	var x = a - b;
	var u = -4.481420117724551*andrej_move.precision*Math.log(rel);
	return 1/(1+Math.exp(-x/(2*u*u)));
}
// то же, но выдаст не выроятность, а эквивалентное значение оценки
andrej_move.diff_to_score = function( a, b, rel ) {
	return andrej_move.posindex_expectancy_to_score( andrej_move.diff(a,b,rel) );
}




// преобразование оценок в вероятности - всё понятно по названиям
// типа как в Гудини, +1 - 80% вероятности, +2 - 95%, +3 - 99%

andrej_move.posindex_score_to_expectancy = function( R ) {
	var k = 0.7213475204444817; // 2;
	return 1 / ( 1 + Math.exp(-R/k) );
}

andrej_move.posindex_expectancy_to_score = function( E ) {
	var k = 0.7213475204444817; // 2;
	return -k * Math.log( 1/E - 1 );
}

andrej_move.posindex_score_to_probability = function( val ) {
	if( val<0 ) return 0;
	var k = 1.4426950408889634 / 1.5849625007211565;
	return 2 / ( 1 + Math.exp(-val/k) ) - 1;
}

andrej_move.posindex_probability_to_score = function( E ) {
	var k = 1.4426950408889634 / 1.5849625007211565;
	return -k * Math.log( -1 + 2 / (E+1) );
}




