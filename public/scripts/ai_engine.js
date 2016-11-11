// в этом файле разрабатываю новую версию ai, основанную на хитром алгоритме эволюции вариаций (nodes)
//	даю версию 0.1

/* Версия 0.1.2.0
		0.1.1.0 - тут долгая история, много всего было написано и переписано

		0.1.1.1 - position_hash.nodes[] -> position_hash.levels[][]
		18.03.2015 - довёл компьютер до такого уровня, что он не видит в глубину на два хода,
				  но очень умный позиционно; за счёт того, что считает ОЧЕНЬ много вариантов, оценку ставит тупо как среднее
				  изо всех; считаю такой алгоритм очень важной находкой, буду по нему сравнивать позиции
				  поэтому оставляю его за версией 0.1.1, дальше будет 0.1.2
				  планирую большое изменение Andrej_move(g) -> Andrej_player(g) + Andrej_engine(l)

		0.1.2.0 - готово, теперь есть корректный объект Andrej_player отдельно от Andrej_engine; большое дело!
		0.1.2.1 - такая глупая попытка скомбинировать два компьютера; забавно, но безрезультатно
		0.1.2.2 - (20.03.2015) исправил несколько глупейших и ужасных ошибок; где-то из-за простых опечаток могли происходить
		          страшные вещи; например, если последний ход был -Infinity, оценка всей позиции становилась -Infinity; и другие

		0.1.3.0 - (21.03.2015) внезапно нашёл лучший алгоритм статической оценки, основан на средне-квадратичном отклонении
		          оценок Andrej_estimates.
		          Он худо-бедно удовлетворяем свойствам, которым должен (во всяком случае в разы лучше предыдущих).
		          Свойства эти такие: острые оценки должны быть слабо положительны, "молоко" должно быть сильно отрицательно.
		          В связи с таким кардинальным изменением алгоритма (метод подсчёта статических оценок) именую новую версию 0.1.3
		0.1.3.1 - (21.03.2015) наконец обнаружил ошибку, почему плохо работало сохранение хэша между ходами;
		          вероятность-то я ставил в единицу, а список родителей не чистил, и вероятности пересчитывались в маленькие;
		          долго меня эта ошибка бесила. (Примечание 02.05.2015 - эта ошибка исправлена только в версии 0.1.6.4)
		21.03.2015 - большой кризис; вроде всё приходит в норму, а компьютер считает только до 3-его - 4-ого полухода в глубину - 
		          этого ОЧЕНЬ мало, надо как МИНИМУМ где-то 8. И вроде всё логично, просто вариантов много, что делать?
		          Самое противное, что все эти варианты мне кажутся возможными
		0.1.3.2 - (21.03.2015) введено variants_count_eq - типа, эквивалентное, со следующими свойствами
		          (отличиями от нормального variants_count):
		          - для статических ходов - 100/кол-во ходов (чтобы не зависело от количества рассмотренных ходов - в идеале
		            бесконечность, поле беск.)
		          - для ходов со 100%-ной победой - 100% или доля по probability, чтобы не казалось, что такие ходы слабо
		            просчитаны
		          исправлен ряд ошибок, в порой важных; если компьютер анализировал позицию и решил просчитать глубже выигрышный
		          ход (+Infinity по позиции static),
		          были перепутаны +Infinity и -Infinity
		0.1.3.3 - (21.03.2015) подправил коэффициенты; вынес лишние коэффициенты из collect_candidates в
		          evaluate_probabilities_with_weights, где им и место (давно задумано, иначе и некорректно). Но. Всё к чёрту.
		          Компьютер стал играть невероятно слабо. Еле находит решения глубиной в один ход.
		          Вижу две проблемы (и два решения):
		          1. Компьютер не то считает, надо заставить его считать в глубину, а оценки ставить
		             только по глубоко просчитанным вариантам, остальные игнорировать
		          2. Компьютер неправильно ставит оценки, надо заставить его считать только глубоко просчитанные варианты, тогда и
		             считать он их будет больше в глубину (наоборот причина-следствие с предыдущим пунктом)
		
		<s>0.1.4.0</s> - считаю свои алгоритмы неработоспособными, начинаю новую версию

		          Проблема: компьютер доходит до определенной глубины и видит сильное преимущество одной из сторон. Но он не
		          знает, что всё решает конкретика. Там может оказаться выигрыш любого. Надо досчитать. Но как его заставить? Не
		          ставить высокую статическую оценку? Мне кажется, неверно. Там объективно может быть преимущество в
		          пространстве. Глупо его не замечать, да и не факт, что это поможет решить проблему.
		          
		          Конкретный пример:
		          Игра: [ {x:0,y:0}, {x:1,y:0}, {x:0,y:-3}, {x:0,y:-2}, {x:-2,y:-2}, {x:1,y:-1}, {x:1,y:-2}, {x:1,y:1},
		          {x:-1,y:-3}, {x:3,y:1} ]
		          Ходы ( -2, -3 ) и ( -2, -5 ), судя по всему, выигрывают; ход ( 2, 0 ), судя по всему, проигрывает;
		          Компьютер не видит ( -2, -3 ), так как после {x:-2,y:-3}, {x:2,y:0}, {x:4,y:2}, {x:2,y:-1} (или последний ход
		          {x:1,y:-3} ) у ноликов значительно больше концентрация фигур. Таких продолжений достаточно много, если
		          компьютер некоторые просчитает, другие останутся. Но крестики дальше ставят (-2,-5) и выигрывают. Однако если бы
		          крестики ничего не нашли, у ноликов действительно потенциально выигрышный клубок.
		          Вариант ( 2, 0 ) - проигрышный - оказывается ещё длиннее, его мой компьютер за несколько дней не осилит :-)

		          Компьютер в своём поиске расползается в ширину, а достаточной глубины в конкретных вариантах достичь не может.

		          Идея: хочу считать оценку не для позиции (в целом), а для каждой глубины просчёта. То есть, у каждой
		          позиции оценка будет не число, а массив для больших глубин. Подсчитывая же оценку, я буду вычислять массив
		          дельта изменений оценки для следующих глубин, и добавлять значения этих дельта к оценкам, просчитанным не
		          достаточно глубоко, чтобы оценки всех ходов привести к одному эквиваленту (одной глубине). Тогда если
		          статически ход имеет большую оценку, чем следующий, он не опустится ниже, пока тот не будет просчитан.
	
		<s>0.1.4.1</s>   0.1.3.5 - сделан метод foreach для перебора position_hash; давно, очень давно хотел сделать
		
		0.1.3.6 - (29.03.2015) так как идеи со ступенчатой глубиной не реализованы, оставляю пока нумерацию 0.1.3; эту версию
		          именую 0.1.3.6 в порядке инкремента субверсии.
		          
		          Собственно, что изменено: в update_moves_probability сделано нормирование на единицу не через деление на общий
		          знаменатель, а через сдвиг estimate (в пять итераций - в нормальной ситуации даёт точность на 0.96). Это не
		          самое очевидное решение, но я потестировал, вроде даёт приемлемый результат. По крайней мере, прошлый способ
		          плохо работал, когда есть сдинственный возможный ход с низкой оценкой - тогда вероятность достоверно
		          проигрышных ходов поднималась выше нуля.
		          
		          Также подчищены некоторые ошибки (например, в collect_candidates), все костыли убираю, всё упрощаю. Исправлена
		          грубейшая ошибка в подсчете статической оценки ходов - там была переменная temp_val, которая задавалась как 0 -
		          это me, а 1 - это 1-me, а проверялась будто классически, 0 - это крестики, 1 - это нолики.
		          
		          Полностью убрал variants_count_eq - не то, чтоб я как-то разочаровался, но планирую всё-таки сделать нормальный
		          расчёт reliability.
		
		0.1.3.7 - (30.03.2015) сделаны reliabilities на модели трёх переменных X0, X1 и X2.
		          X0 - это нормально посчитанная оценка, то есть sum( k[i] * estimate[i] ), как и раньше.
		          X1 - это sum( k[i] * X1[i] ),
		          X2 - это sum( k[i] * X2[i] ).
		          Таким образом, X1 + A * X2 - максимально возможное значение оценки, X1 - A * X2 - минимально, где A - это
		          гипотетическая оценка по модели estimate = ( est * reliability + A * ( 1 - reliability ) ).
		          Тогда reliability - это 1 - X2. Проблема в том, что факт возможности гипотетически максимальной и минимальной
		          оценки становится возможным как один из всё большего и большего числа вариантов - вероятность сильно падает.
		          Иными словами, в моей модели reliability не падает с ростом числа вариантов, а должно.
		
		0.1.3.8 - (31.03.2015) reliabilities для отдельных статических ходов теперь учитываются в оценке, оценка теперь не
		          делится на двое, при подсчете estimate коэффициенты берутся из probabilities.
		
		0.1.4.0 - (05.04.2015) переделю файлы, движок -> ai_engine.js, nodes -> ai_nodes.js, functions -> ai_estimates_static.js
		          
		          Версии 0.1.4 как таковой выпущено не было, поэтому логично теперь дать этот номер версии
		          
		          Собственно, планирую глобальные изменения. Напишу позже.
		
		0.1.4.1 - (06.04.2015) сделал логичное наследование классов Andrej_node; сделал через __proto__, работать будет
		          только в Хроме и Файрфоксе; думаю, можно сделать через prototype, но муторно - каждый прототип создавать своим
		          конструктором, что ли? Почему нельзя объявить просто как объект, как во всех примерах в интернете?
		          
		          Доработал код перехвата ошибок.
		          Как помогает жить то, что я разделил код по файлам! Невероятно!
		0.1.4.2 - (08.04.2015) вернул (?) один из самых простых и старых алгоритмов - статическая оценка считается как разница
		          средневзвешенной угрозы игроков. Начудил с коэффициентами, calc_est вообще возвёл в экспоненту, теперь оценки из
		          ar перевожу просто вычитанием единицы, без всяких логаритмов. Невероятно, но компьютер стал очень умным. Даже
		          ничего больше колдовать не приходится - это чудо!
		          
		          Но:
		          - никаие reliability не реализованы, то есть реализованы в зародыше.
		          - оценка очень усредняется, если первый ход +1.46, средняя может быть +0.58, если лучший ход +0.31, средняя
		            может быть -0.41.
		          - ну хорошо, что работает; а если не будет? Если опять статическая оценка скажет, что вариант плохой (хороший),
		            а на самом деле будет наоборот, ибо вариант не досчитан? Нет никакого механизма
		          - собственно, как выбирать кандидаты для просчёта? Пока по-старинке, и, судя по всему, неоптимально
		          - одна из главных проблем: если компьютер создал новую позицию, он считает Estimates для каждого хода, а это
		            очень много и долго
		          
		          Пока версию заархивирую, а дальше буду думать.
		          
		          Кстати, прототипы переделал каждый в свой конструктор, свойство __proto__ не использую, должно работать и в ИЕ.
		
		0.1.4.3 - (10.04.2015) опять разделил по файлам)) - что ж, мне так легче работать
		          Переименовал Andrej_node_static в Andrej_node_lena. Алгоритм - частный случай, поэтому буду им давать имена.
		          Делаю для сравнения Andrej_node_patricia - не считать позицию по каждому ходу, а как раньше.
		          
		          Сделал reliabilities - в общем случае, просто берём долю по каждому, то есть нет прогресса.
		          
		          + Опять почистил код, переименовал ai_interface в ai_ui, сделал очистку функций после выгрузки движка, сделал
		          класс для ошибок, сделал остановку движка, если нет прогресса.
		
		0.1.4.4 - (10.04.2015)
		          Внесены изменения в алгоритм расчёта оценок. Чтобы оставить класс Andrej_node чистым от всяких экспериментов,
		          сделано в классе Andrej_node_recursive.
		          
		          - probability хода теперь возводится в некоторую степень в зависимости от reliability
		          - estimate теперь считается с коэффициентами от reliability (немного не так; сейчас напишу ниже)
		          - reliability стало приближаться к единице с глубиной
		          
		          Нехитрые, вроде бы, изменения, делают алгоритм "динамичнее". Собственно, что могу сказать:
		          - главная проблема всё та же: компьютер ищет только в ширину, а в глубину не умеет смотреть
		          - выигрышные варианты компьютер стал искать, может, чуть хуже;
		          - всё очень сильно зависит от коэффициентов (угадал/не угадал)
		          - компьютер стал намного лучше решать проигрышные позиции
		          - reliability растёт страшно медленно; пока всё не посчитается в ширину, наверное
		          
		          Теперь поясню, как я изменил estimate. Когда я складываю estimate отдельных ходов, я считаю по модели
		          estimate = Σ move[i].probability * ( move[i].estimate * move[i].reliability + 0 * ( 1-move[i].reliability ) )
		          Второй слагаемое для наглядности, 0 - это средневероятностная оценка.
		          Имена переменных упрощены, правильно не "move[i].estimate", а "-this.move[i].pos.estimate".
		          Так как reliability обычно порядка 0.2, общая оценка должна стремительно приближаться к нулю.
		          Поэтому в конце я её делю на reliability позиции.
	
		0.1.4.5 - (11.04.2015) По сути многочисленные танцы с коэффициентами. Изменение коэффициентов получения reliability,
		          отсюда и другие коэффициенты для оценок и probability. Исправлены многочисленные ошибки (и опять переименовал
		          пару файлов). Компьютер стал чуть лучше считать проигрышные позиции; может, хуже выигрышные, но это всё ни о
		          чём - он эти позиции просто не просчитывает - говорить не о чем.
		          
		          Пришла в голову гениальная мысль, которая должна решить все проблемы - не считать "оценку", а считать отдельно
		          угрозу крестиков и ноликов. Поэтому начну новую версию 0.1.5.
	
		0.1.5.0 - (11.04.2015) Сделано! Estimate теперь не число, а массив - не оценка, а угроза за крестики и за нолики. Все
		          методы переделаны соответствующим образом. Самый неочевидный - update_moves_probability - еще ожидает борьбы со
		          мной. Также надо заново подправлять коэффициенты - значения угроз (4..9) сильно превосходят значения оценок.
		          
		          Вторая проблема осталась старой - компьютер считает не те варианты. Надо копать evaluate_collect_candidates
		          (странно, оно выглядит простым и логичным).
		          
		0.1.5.1 - (13.04.2015) Сделал аццки сложную функцию update_moves_probability, решив очень длинные уравнения.
		
		          Причина: в версии 0.1.5.0 обнаружилась проблема: компьютер ставил веростность ходам по инициативе крестиков или
		          ноликов в зависимости от коэффициентов. Коэффициенты считались на основе оценки, получались такие
		          автоколебания: вероятность ставилась поровну всем ходам, и проигрышным -> общая оценка улетала в минус ->
		          вероятность ставилась только непроигрышным ходам -> общая оценка становилсь примерно равной -> снова
		          вероятность ставилась поровну всем ходам, и так далее.
		
		0.1.5.2 - (21.04.2015) Всё ковырял, ковырял... Всё неплохо, но работает так себе. Архивирую. Сейчас напишу чище и лучше.

		0.1.5.3 - (22.04.2015) Переписал... Та же проблема. "Ой, мне удар, я туда не пойду!"
		          Оценку ходов заменил на экспоненту - вместо +4 теперь +55б вместо +8 теперь +2981
	
		0.1.5.4 - (22.05.2015) Ввиду тотального упрощения объединил файлы ai_nodes.js и ai_nodes_named.js
		          Собственно, как решать названную выше проблему? Одно дело - сильная инициатива. Это значит, что варианты надо
		          просчитать. Но пока они не просчитаны, какую оценку ставить? Нельзя высокую, так как в этом и проблема ("мне
		          удар, я туда не пойду!") Удар - это ещё ничего не значит. И глупо ставить низкую оценку, так как ходы без
		          инициативы - это, конечно, слабые ходы.
		          
		          Собственно, "правильный" до занудства ответ очевиден. Эти ходы надо просчитать и найти оценку рекурсивно. Но
		          всегда возможна ситуация, что ходы "ещё" не просчитаны. Пусть на большей глубине, но оценку-то откуда-то брать
		          надо?
	
		0.1.6.0 - (25.04.2015) Насчитал математику, сейчас всё переедет на вероятностные рельсы, оценки будут от нуля до единицы.
	
		          Сделал вроде легко (пишу через 50 минут). +Ещё 40 минут исправил сразу найденные ошибки. Ищёт по-прежнему "на
		          широкую ногу".
	
		0.1.6.1 - (25.04.2015) Правлю коэффициенты и алгоритмы. Тупой комментарий. У меня такое к каждой версии написано. Если
		          более конкретно... Да долго описывать; много всего. Я заархивировал версии, смотрите diff`ы к файлам.
	
		0.1.6.2 - (29.04.2015) 1. Заменил функцию вычисления значения probability на математическое выражение по распределению
		          Гаусса. 2. Теперь collect_candidates_count считается как корень из размера хэша (хочу, чтобы оно
		          "эволюционировало" за несколько итераций). 3. Планирую реализовать тактику, я считаю, что нынешними методами
		          это невозможно - надо считать количество клеток с угрозами - для этого пока нет механизма. Иными словами, надо
		          что-то придумывать.
	
		0.1.6.3 - (29.04 - 01.05.2015) Посчитал коэффициенты. Компьютер ищет жутко медленно и широко, но это по сути первый
		          компьютер, который реально ищет решения, пусть долго, но не из-за случайных совпадений, а потому что "должен".
	
		0.1.6.4 - (01.05.2015) Наконец сделал "эволюцию" ходов-кандидатов в несколько итераций. Несложно получилось. Теперь можно
		          ставить большое число ходов-кандидатов, и компьютер не будет зависать. Уменьшил показатель степеньи
		          достоверности в evaluate_collect_candidates - теперь компьютер выбирает ходы для просчёта логично. Но пропала
		          глубина, хоть какая ни была. Зато всё стало честно, не стало ходов, грубо обделённых вниманием. Пришлось снова
		          пересчитать коэффициенты. Надо бы запилить функцию autotune.
		          
		          Обноружилось, что evaluate_collect_candidates недопустимо медленная - может думать считанные минуты. Переписал
		          намного тупее, брутально пихая всё в один стек и иногда сортируя; ф-ция ускорилась в 20 раз.
		          
		          Компьютер стал выдавать намного меньше "детских неожиданностей".
		          
		          Ещё немного нормализовал поведение zero_position_node - без костылей - всё-таки особая позиция, и в отчёте
		          рисуется чуть по-другому, и вероятности ходов не возводятся в степень. Но теперь компьютер занижает общую
		          оценку. Думаю, это не буда, главное, чтобы ходы правильные выбирал.
		          
		          Другие мелкие изменения - форма отчёта, reliability в terminate_condition, отрезал выбор ходов в
		          Andrej_estimates.get_moves (правило квадрата и только ход в (0,0), если это первый ход.
		          
		          Исправлена старая грубая ошибка со странным поведением после сохрания хэша (хэш большой, вариаций мало и ничего
		          не считает).
		          
		          + в ту же версию: подчистил названия коэффициентов и комментарии, сделал andrej_move.autotune()
	
		0.1.6.5   Начинаю делать тактику.
		          Поправил Andrej_estimates - ввёл ещё один массив вместо нескольких повторяющихся переборов. Думал, не окупится,
		          но ошибся - получил 10,77% прирост скорости (4.965 мс вместо 5.564). Оказалось, это и так была довольно быстрая
		          операция. На общем процессе поиска решения почти не заметно. На что же я тогда трачу время?!
		          
		          Исправлена ошибка - хэш очищался, то есть позиции убирались из хэша, но оставались хвостами среди parents других
		          позиций. Теперь всё подчищаю.
		          
		          andrej_move.translate.forward(backward) заменено на posindex_probability_to_score
		          collect_candidates_count вынесено как функция в utils и уменьшено
		          
		          Переписано Andrej_move.update_moves_probability, теперь немного хитрее, рассматривая три случая, если есть
		          победный ход, если вообще нет ходов или "типичный" (обычный) случай) - сделан как медиана и отклонение от неё
		          по логарифмической. Получилось отлично, не надо нескольких итераций, как в старых версиях, то есть никакого
		          моделирования, при этом сумма получается почти единица - идеально. Только все вероятности почти равны, но это не
		          проблема вероятностей - у меня просто все оценки почти равны.
		          
		          Update: всё-таки сделано в три итерации, иначе не получилось: всё равно есть условно среднее значение, всё
		          больше него получало "единицу" (вероятность), меньше него нули, то есть мир красился в такой чёрно-белый цвет.
		          Если это среднее значение ("медиану") поправить в три итерации - результат совершенно нормальный. Что ж, видимо,
		          от этого не уйти. Потестировал в Маткаде (ну и гавно программа, имхо).
		          
		          Версия как-бы работает, но я решил, что она сырая. Однако оставляю такую, будем кушать слона по частям.

		0.1.6.6 - (04.05.2015) Переделал LL в иерархическую структуру со своими классами, а не просто массивами, поэтому буду
		          адаптировать и механизм движка. Главное - теперь i_min, i_max, j_min, j_max вычисляются сразу и заполняются как
		          свойства объектов-рядов, а не пересчитываются каждый раз заново. Жаль, сегодня перестали работать все старые
		          алгоритмы. Вот она, проблема совместимости!
		          
		          (05.05.2015) Переделал Andrej_estimates в более общий случай, теперь анализируется объект-ряд. Всё
		          объектненько, красивенько. Очень много всего переписал, по сути, создал новый механизм. Исправил найденные
		          ошибки.
		0.1.6.7 - делаю тактику, не так, как хотел изначально, а просто оценками. Работает плохо. Надо смотреть подробнее.
		
		0.1.6.8 - Вариант не прокатил, делаю пока тактику "в лоб". Работает плохо.
		          
		          Слегка переделал Andrej_report, теперь есть только один вариант, который содержит всё (оценки, вероятности...
		          много всего); Зато всему добавляются css классы, через стили можно управлять, что показывать и как.
	
		0.1.6.9 - (08.05.2015) отлаживаю тактику

		<!--   после большого перерыва   -->

		0.1.6.10 - (19.12.2015) Пытаюсь разобраться, как же всё работает. Нахожу море ошибок. Ужас(((
*/




// класс уже имеет множество свойств, от которых зависит его поведение; нужно эти свойства документировать
// для начала,
//	version (по умолчанию Andrej_engine.version) - версия алгоритма, она же версия файла
//	status (строка) - пометки о том, чем программа занимается; она уже загрузилась, думает или ждёт, или что другое
//	zero_position_node - вариация, соответсвующая текущей ситуации на доске, то есть "нулевой" глубине
//	position_hash - это хэш, он создается при создании объекта Andrej_engine и
//				не должен полностью создаваться с нуля между ходами;
//				предполагается, что будут только "отрезаться" "неактуальные" ходы, оставшаяся структура будет дополняться


// параметры:
//	param_multi_pv (по ум. Andrej_engine.param_multi_pv) - сколько вариантов ходов (principal variations) выводит в отчёт (report)

// параметры по аналогии с andrej_move.xxx...
//	Andrej_engine.posindex_variants_to_probability (функция) - перевести variants_count в сомножитель для probability


// TODO: добавить недостающие


//	Andrej_engine.oncreate и ondestroy - события, добавляйте коллбэки (функции) методом push
//		внимание: oncreate - свойство класса, ondestroy - свойство конкретного экземпляра
//		параметр, который будет передан обоим коллбэкам, - объект Andrej_move



//	param_sort_moves (по ум. ложь) - надо ли сортировать ходы - все ходы(!); только для наглядности, на решение влиять не должно

//	param_report_update_interval (по ум. Andrej_engine.param_report_update_interval, 1000) - время между посыланием отчёта
//								 (милисекунд)



// terminate_condition - объект, содержит условия, когда прекратить думать и сделать ход
//	можно передать не объект, а просто булево значение, это будет эквивалентно {force_stop:значение}; сокращение записи
//	является первым (необязательным) параметром start_search()
//	может содержать следующие поля:
//	- force_stop (закончить просчёт при первом удобном случае)
//  - func (пользовательская функция, будет вызвана в контексте engine;
//	- variants_count (если значение zero_position_node.variants_count превысит это)
//	- variants_count_eq ???
//	- iterations (лимит на количество итераций; например, задать единицу, чтобы посмотреть "чистый" вывод после одной итерации)
//	- hash_limit (лимит на размер хэша)
//	- time (время на ход, милисекунд)
//	- reliability (достоверность анализа позиции)

// приоритет проверки условий:
//	1. если ошибка
//	2. force_stop
//	3. пользовательская функция
//	4. остальные условия


// TODO: обновить описание



// send_report_cb - сюда задать callback-функцию, чтобы получать отчёты

// также опишу те, что не задаются прямо:
//	search_time_start, search_time_end - служебное поле, время, когда начался просчёт (и когда прекратился)
//	search_last_iteration_time - время последней итерации, в милисекундах
//	search_iterations - сколько произведено итераций с начала анализа
//	search_iteration_timeout_id - техническое, ай-ди таймаута
//	report_interval_id - id, возвращённый функцией setInterval, установившей разсылку отчёта раз в секунду
//	report_update_manual - равняется ( search_last_iteration_time > param_report_update_interval )




/*
	вычисления идут в следующем порядке:
	- перед началом удаляются все неактуальные объекты Andrej_node из "хэша" (см. Andrej_engine.position_hash.purge)
	- сначала создаётся Andrej_engine.zero_position_node - объект Andrej_node, соответствующий ситуации на доске
	- при создании каждого объекта Andrej_node указывается объект LL - объект-массив, позиция на доске (см. lines.js)
	- при создании каждого объекта Andrej_node заполняются базовые поля и вызывается
	  andrej_move.position_get_moves_by_position_static()
	- заполняются возможные ходы-кандидаты для позиции, для каждого существует оценка (см.
	  andrej_move.position_get_moves_by_position_static)
	- примечание: возможность andrej_move.position_get_moves_by_position_static с параметром {index_for:true} не используется;
	  всё сами, мы с усами
	- вызывается update_estimate - вычисляется оценка позиции
	- если andrej_move.position_get_moves_by_position_static() вернёт пустой список ходов, оценка позиции будет undefined - пока
	  не знаю, насколько это возможно, предупреждаю
	- каждый созданный объект Andrej_node добавляется в так называемый "хэш"
	- вызывается эволюция системы, просматриваются все позиции в "хэше"
	- всем позициям обновляются значения
	- для каждой позиции в хэше просматриваются все возможные ходы, выбирается param_split_candidates_count наиболее вероятных
	- позиции, к которым ведут выбранные ходы, заменяются на новые объекты Andrej_node
	- для всех Andrej_node пересчитываются значения estimate, probability, variants_count
	- примечание: раньше были поля probability и probability_local; теперь имеем отдельно Andrej_node.probability -
	  вероятность, что позиция настанет - и Andrej_nodemove.probability - вероятность, что будет выбран именно этот ход
	- примечание: слово "ходы" здесь везде обозначает объекты Andrej_nodemove
	- заново производится "эволюция системы", и так далее
*/




// == класс игрока, соответствует объекту Game ==

// необходимо создать для каждой игры

function Andrej_player( g ) {
	if( typeof(g)=='undefined' ) g = window['game'];
	if( !( g instanceof Game ) )
		throw new Andrej_error( 'Andrej_player : !Game' );
	this.game = g;
	var q = this;
	this.engine = new Andrej_engine( game.l );
	this.version = this.engine.version;
	this.title = this.engine.title;
	this.author = this.engine.author;
	this.country = this.engine.country;
	this.ondestroy = new Event_callback_list;
	this.game.onmovemade.push( function(){ q.engine.l = new LL(q.game); } );
	// события ondestroy будут вызваны из коллбэка engine на случай, если engine будет уничтожена раньше, чем player
	var q = this;
	this.engine.ondestroy.push(
		function() {
			q.ondestroy.fire_events( q );
		}
	);
	Andrej_player.oncreate.fire_events( q );
}

Andrej_player.prototype = {
	status : function() {
		return this.engine.status;
	},

	move_now : function() {
		this.engine.l = new LL(this.game);
		if( this.game.empty() )
			return game.move( Infinity, Infinity );
		if( this.param_clear_hash )
			this.engine.clear_hash();
		var q = this;
		var cb = function( arg1, arg2 ) {
			var ref_move = ( q.game.empty() ? { x: Infinity, y: Infinity } : q.game.moves[0] );
			arg1 += ref_move.x;
			arg2 += ref_move.y;
			return q.game.move( arg1, arg2 );
		}
		this.engine.analyze( this.terminate_condition, cb );
	},

	destroy : function() {
		this.engine.destroy();
		// события ondestroy будут вызваны из коллбэка engine на случай, если engine будет уничтожена раньше, чем player
	},

	terminate_condition : { time: 70000 },
	param_clear_hash : false

}

Andrej_player.oncreate = new Event_callback_list;




// == класс движка, соответствует позиции, объекту LL ==

// не надо пересоздавать для каждой позиции, он сам решит, чистить ли хэш

function Andrej_engine( l ) {
	// загрузимся
	this.status = 'not initialized';
	this.version = Andrej_engine.version;
	this.title = 'Andrej_move engine';
	this.author = 'Andrej Putilov';
	this.country = 'Russia';
	this.ondestroy = new Event_callback_list;
// неважные параметры
	this.param_multi_pv = Andrej_engine.param_multi_pv;
	this.param_sort_moves = false;
	this.param_report_update_interval = Andrej_engine.param_report_update_interval;
	this.terminate_cb = false;
	this.terminate_condition = {};
	// инитиализация
	this.l = new LL(l);
	this.position_hash = new Andrej_node_position_hash;
	// вызвать коллбэки
	var q=this;
	Andrej_engine.oncreate.fire_events( q );
	// готово!
	this.status = 'engine loaded';
}

Andrej_engine.version = '0.1.6.10';

Andrej_engine.param_multi_pv = 10;
Andrej_engine.param_report_update_interval = 1000; // каждую секунду



//	события
Andrej_engine.oncreate = new Event_callback_list;

Andrej_engine.prototype = {
	// == публично доступные методы ==

	// начать поиск хода (то есть анализ)
	// первый параметр (необязательный) - условие, когда закончить работать
	// второй параметр (необязательный) - нада ли сделать ход по окончании анализа
	// см. terminate_condition
	// функция создаёт объект zero_position_node (нулевой объект позиции)
	// и запускает "эволюцию системы"
	// возвращает созданный zero_position_node, но возвращаемое значение не используется
	analyze : function( terminate_condition, cb ) {
		// разбор параметров
		//if( this.status == 'search' )
		//	return false;
		if( this.status=='unloaded' )
			return this.interrupt();
		this.status = 'starting search';
		this.terminate_condition = (
			typeof(terminate_condition)!='undefined' ?
			( typeof(terminate_condition)!='boolean' ? terminate_condition : {force_stop:arg} ) :
			{}
		);
		this.terminate_cb = null;
		if( typeof(cb)=='string' )
			cb = window[cb];
		if( typeof(cb)=='function' )
			this.terminate_cb = cb;

		this.search_iterations = 0;
		clearInterval( this.report_interval_id );
		this.search_error = false;
		this.search_no_progress = false;
		this.search_error_msg = '???';
		this.search_time_start = new Date();
		this.search_last_iteration_time = 0;
		var q = this;
		this.report_interval_id = setInterval( function(){ q.send_report.call(q) }, this.param_report_update_interval );
		this.report_update_manual = false;
		this.candidates = [];

		try {
			// уберем все, что уже кануло в Лету
			this.position_hash.purge( this.l );
			var node = this.position_hash.search_or_create( this.l, function(){return new Andrej_node(new LL(this.l))} );
			node.probability = 1;
			node.parents = [];
			this.zero_position_node = node;
			this.position_hash.set_zero_node( node );
			this.evaluate_update_values();
			this.next_iteration();
		} catch(e) {
			this.search_error = true;
			this.search_error_msg = e;
			throw e;
		} finally {
			// посылаем отчёт
			setTimeout( function(){ q.send_report.call(q) }, 50 );
		}

		return this.zero_position_node;
	},

	interrupt : function() {
		this.terminate_cb = null;
		this.terminate_condition = { force_stop: true };
	},

	// эту функцию вызываем мы каждую секунду
	// идентификатор таймера this.report_interval_id
	send_report : function() {
		// проверим, что вообще есть callback
		if( typeof(this.send_report_cb)!='function' )
			return;
		// обновим
		this.position_hash.evaluate_depths();
		// посчитаем время
		var ftime = this.search_time_start;
		if( typeof(ftime)!='undefined' ) {
			if( (typeof(this.search_time_end)!='undefined') && (this.search_time_end>this.search_time_start) )
				ftime = this.search_time_end - this.search_time_start;
			else
				ftime = new Date() - this.search_time_start;
		}

		// result - то, что будет послано в ответ;
		if( !this.search_error )
			var result = new Andrej_report( this.zero_position_node, this.param_multi_pv );
		else {
			if( this.zero_position_node instanceof Andrej_node ) {
				result = new Andrej_report( this.zero_position_node, this.param_multi_pv );
				result.push_er_msg( ''+this.search_error_msg );
			} else {
				if( this.search_error_msg instanceof Error )
					result = new Andrej_report( this.search_error_msg );
				else
					result = new Andrej_report( new Error(this.search_error_msg) );
			}
		}

		// добавим информацию о ходе процесса
		result['info'] = [
			''+Math.round(ftime/1000)+' с',
			'итераций: '+this.search_iterations,
			'хэш : '+this.position_hash.size()
		];
		if( this.search_no_progress )
			result.push_msg( 'поиск остановлен &mdash; нет прогресса' );
		// готово, посылаем отчёт
		this.send_report_cb(result);
		// что-то возвращать необязательно
		return result;
	},

	// очистить хэш
	clear_hash : function() {
		this.position_hash.clear();
		var al = this.l;
		var node = this.position_hash.search_or_create( al, function(){return new Andrej_node(new LL(al))} );
		node.probability = 1;
		this.zero_position_node = node;
		this.position_hash.set_zero_node( node );
		this.search_error = false;
		this.search_no_progress = false;
		return true;
	},

	destroy : function() {
		// условие остановки
		this.interrupt();
		this.status = 'unloaded';
		this.report_update_manual = true;
		clearInterval( this.report_interval_id );
		// вызвать коллбэки
		this.ondestroy.fire_events( this );
	},




	// == технические операции ==

	// пересчитать все значения - оценки, вероятности, достоверности
	evaluate_update_values : function() {
		this.position_hash.evaluate_local_values();
		if( this.param_sort_moves )
			this.position_hash.evaluate_sort_all_moves();
	},

	// провести итерацию "эволюции системы"
	iterate : function() {
		// 0. если все ходы рассмотрены - пересчитать оценки
		if( this.candidates.need_to_update ) {
			this.candidates.need_to_update = false;
			this.evaluate_update_values();
			this.search_iterations++;
			return;
		};
		// 1. если нет ходов-кандидатов - составить список
		if( this.candidates.length==0 ) {
			this.reduce_zero_node_moves_probability(); // такой костылёк, чтобы из начальной позиции считалось всё понемногу
			this.position_hash.evaluate_position_probabilities();
			var param_split_candidates_count = andrej_move.k_collect_candidates_count( this.position_hash.size() );
			this.candidates = this.position_hash.evaluate_collect_candidates( param_split_candidates_count );
			if( this.candidates.length == 0 )
				this.search_no_progress = true;
			return;
		};
		// 2. иначе просто считать ходы
		var c = this.candidates.splice(0,20); // для примера берём 10 штук - не важно
		for( var i=0; i<c.length; i++ )
			this.position_hash.evaluate_move( c[i] )
		if( this.candidates.length==0 )
			this.candidates.need_to_update = true;
	},

	next_iteration : function() {
		this.status = 'search';
		if( this.report_update_manual )
			try {
				this.send_report();
			} catch(e) { console.error(e) }
		else
			if( this.search_last_iteration_time > this.param_report_update_interval ) {
				this.report_update_manual = true;
				clearInterval( this.report_interval_id );
			}
		if( this.time_to_move() )
			this.end_of_search();
		else {
			var q = this;
			this.search_iteration_timeout_id = setTimeout(
				function() {
					if( q.time_to_move() ) { // надо проверить ещё раз, а том переменная могла быть установлена только
					//							во время перерыва между итерациями, а таймаут в этот момент уже вызван
						q.end_of_search();
						return;
					}
					var temp_time_start = new Date;
					try {
						q.iterate.call(q);
					} catch(e) {
						q.search_error = true;
						q.search_error_msg = e;
						throw e;
					} finally {
						q.search_last_iteration_time = new Date - temp_time_start;
						q.next_iteration.call( q );
					}
				},
				( Math.random() >= 1/this.search_iterations ? Math.round( this.search_last_iteration_time * 0.05 ) : 0 )
			);
		};
	},

	// вызывается один раз перед position_hash.evaluate_collect_candidates
	// такой костылёк, чтобы из начальной позиции считалось всё понемногу
	reduce_zero_node_moves_probability : function() {
		for( var i=0; i<this.zero_position_node.moves.length; i++ )
			this.zero_position_node.moves[i].probability =
				this.zero_position_node.reliability * this.zero_position_node.moves[i].probability +
				(1-this.zero_position_node.reliability) / this.zero_position_node.moves.length;
	},



	// условие закончить поиск - истекло время хода, просмотрено достаточно вариаций, достигнута глубина...
	time_to_move : function() {
		if( this.search_error || this.search_no_progress )
			return true;
		if( this.terminate_condition.force_stop )
			return true;
		// если задано terminate_condition.func - другие условия проверяться не будут; исключение force_stop с высшим приоритетом
		if( this.terminate_condition.hasOwnProperty('func') && (typeof(this.terminate_condition.func)=='function') )
			return this.terminate_condition.func.call(this);
		if( this.terminate_condition.hasOwnProperty('variants_count') && ( this.zero_position_node.variants_count>=this.terminate_condition.variants_count ) )
			return true;
		if( this.terminate_condition.hasOwnProperty('iterations') && ( this.search_iterations>=this.terminate_condition.iterations ) )
			return true;
		if( this.terminate_condition.hasOwnProperty('hash_limit') && ( this.position_hash.size()>=this.terminate_condition.hash_limit ) )
			return true;
		if( this.terminate_condition.hasOwnProperty('time') && ( (new Date() - this.search_time_start)>=this.terminate_condition.time ) )
			return true;
		if( this.terminate_condition.hasOwnProperty('reliability') && ( this.zero_position_node.reliability>=this.terminate_condition.reliability ) )
			return true;
		return false;
	},


	// если пора прекратить просчёт, будет вызван этот код
	// когда остановлен цикл, но его вызов не приводит к остановке
	// установите поле this.terminate_condition и компьютер сам дойдёт сюда
	end_of_search : function() {
		this.status = 'stopping search';
		clearTimeout( this.search_iteration_timeout_id );
		this.search_time_end = new Date();
		// прекратить посылать уг
		clearInterval( this.report_interval_id );
		// но послать последний раз
		try {
			this.send_report();
		} catch(e) { console.error(e) }
		if( !this.search_error )
			this.evaluate_update_values;
		if( this.search_error ) {
			this.status = 'error';
			return;
		}
		// может, надо автоматически сделать ход?
		if( this.terminate_cb ) {
			if( this.zero_position_node.moves.length>0 ) {
				var best_move = this.zero_position_node.best_move();
				this.status = (
					this.terminate_cb( best_move.x, best_move.y ) ?
					'move done' :
					'illegal move'
				);
			} else
				this.status = 'no move candidates';
			this.terminate_cb = null;
		} else
			this.status = 'idle';
	},
}




// Andrej_report class
function Andrej_report( anode, multi_pv ) {
	//	report рисуется на экране в виде таблицы
	//	поэтому посылаем данные двумерным массивом
	
	this.msg = [];

	// тупая проверочка
	if( anode instanceof Error ) {
		this.push_er_msg( ''+anode );
		return;
	}

	// тупая проверочка 2
	if( typeof(anode) == 'undefined' ) {
		this.push_msg( '(пусто)' );
		return;
	}

	// тупая проверочка 3
	if( !(anode instanceof Andrej_node) ) {
		this.push_er_msg( '!Andrej_node' );
		return;
	}

	if( typeof(multi_pv)=='undefined' )
		multi_pv = Andrej_engine.param_multi_pv;

	var r = function( val, classname ) {
		function to_obj( val ) {
			// это может показаться костылями, но так я посылаю classname в качестве свойства объекта
			// на производительность плевать - один раз за секунду
			// никаких операций с этими числами я больше делать не буду, только выведу на экран
			// поэтому проблем быть не должно
			if( val instanceof Object )
				return val;
			if( typeof(val)=='number' )
				return new Number(val);
			if( typeof(val)=='string' )
				return new String(val);
			return new String(''+val);
		};
		val = to_obj( val );
		val.classname = classname;
		return val;
	};

	// я принял решение сортировать ходы только при выводе; оно же и более оптимально будет для engine.zero_position_move
	anode.update_moves_probability();
	anode.sort_moves();

	// перебираем возможные ходы из позиции anode
	var me = anode.l.moves_count&1;
	var length = ( anode.moves.length<multi_pv ? anode.moves.length : multi_pv);
	// для каждого хода (из первых multi_pv)
	if( length==0 )
		this.push_msg( '(список ходов пустой)' );
	for( var i=0; i<length; i++ ) {
		// reliability позиции
		var rel = '' + Math.round( (anode.moves[i].pos.reliability) *100 ) /100;
		// соберём оценку позиции - общую
		var est = andrej_move.diff_to_score( anode.moves[i].pos.estimate[me], anode.moves[i].pos.estimate[1-me], rel );
		est = '' + ( est>0 ? '+'+Math.round(est*100)/100 : Math.round(est*100)/100 );
		// соберём оценку позиции - по-отдельности
		var est0 = Math.round( anode.moves[i].pos.estimate[0] *100 ) /100;
		var est1 = Math.round( anode.moves[i].pos.estimate[1] *100 ) /100;
		if( est0>0 ) est0 = '+'+est0;
		if( est1>0 ) est1 = '+'+est1;
		var est_split = '(' + est0 + ',  ' + est1 + ')';
		// probability хода
		var prob = '' + Math.round( anode.moves[i].probability *100 ) /100;
		// глубина
		var depth =
			'' + ( anode.moves[i].pos.depth + 1 )+
			' / '+
			anode.moves[i].pos.variants_count;
		// координаты хода
		var moves = [ {
			x: anode.moves[i].x,
			y: anode.moves[i].y,
			id: ( ( ( anode.moves[i].pos instanceof Andrej_node ) && !( anode.moves[i].pos instanceof Andrej_node_leaf ) ) ? anode.moves[i].pos.id : false )
		} ];
		// и последующие ходы
		var move_cur = anode.moves[i].pos; // move_cur - это позиция
		while(
			(move_cur instanceof Andrej_node) &&
			!(move_cur instanceof Andrej_node_leaf) &&
			(move_cur.moves.length>0)
		) {
			move_cur = move_cur.best_move(); // теперь move_cur - это ход, объект Andrej_nodemove
			moves.push( {
				x: move_cur.x,
				y: move_cur.y,
				id: ( ( ( move_cur.pos instanceof Andrej_node ) && !( move_cur.pos instanceof Andrej_node_leaf ) ) ? move_cur.pos.id : false )
			} );
			move_cur = move_cur.pos; // теперь снова move_cur - это позиция
		};
		var temp = [
			r( (i+1)+'.', 'movenumber' ),
			r( est, 'estimate' ),
			r( est_split, 'estimatesplit' ),
			r( prob, 'probability' ),
			r( rel, 'reliability' ),
			r( depth, 'depth' ),
			r( moves, 'movelist' ),
		];
		temp.message_type = 'output';
		this.push( temp );
	}
	var est0 = Math.round( anode.estimate[0] *100 ) /100;
	var est1 = Math.round( anode.estimate[1] *100 ) /100;
	if( est0>0 ) est0 = '+'+est0;
	if( est1>0 ) est1 = '+'+est1;
	var est_split = '' + est0 + ',  ' + est1;
	var prob = anode.probability;
	var prob_e = Math.floor(Math.log(prob)/Math.log(10)); // В осле Math.log10 не оказалось
	if( (prob>0) && (prob<0.015) )
		prob = ''+Math.round(prob/Math.pow(10,prob_e)*100)/100+'∙10<sup>'+prob_e+'</sup>';
	else
		prob = Math.round(prob*100)/100;
	var rel = anode.reliability;
	var est = andrej_move.diff_to_score( anode.estimate[me], anode.estimate[1-me], rel );
	var est = '' + ( est>0 ? '+'+Math.round(est*100)/100 : Math.round(est*100)/100 );
	rel = Math.round(rel*100)/100;
	this['nodeinfo'] = [
		r( 'оценка: '+est, 'estimate' ),
		r( '('+est_split+')', 'estimatesplit' ),
		r( 'вариаций: '+anode.variants_count, 'depth' ),
		r( 'вероятность: '+prob, 'probability' ),
		r( 'достоверность: '+rel, 'reliability' ),
	];
	this['nodeinfo']['id'] = 'позиция #'+anode.id;
}

function Andrej_report_prototype() {
	this.push_msg = function( arg ) {
		var temp = [arg];
		temp.message_type = 'message';
		this.splice( 0, 0, temp );
	};
	this.push_er_msg = function( arg ) {
		var temp = [arg];
		temp.message_type = 'message error';
		this.splice( 0, 0, temp );
	};
}

Andrej_report_prototype.prototype = Array.prototype;

Andrej_report.prototype = new Andrej_report_prototype;




function Andrej_error( str ) {
	if( typeof(str)=='string' )
		this.message = str;
	else
		return new Error( str );
}

function Andrej_error_prototype() {
	this.toString = function() {
		return this.message;
	}
}

Andrej_error_prototype.prototype = Error.prototype;

Andrej_error.prototype = new Andrej_error_prototype;




// Andrej_node_position_hash class
function Andrej_node_position_hash() {
	this.levels = [];
	this.max_id = -1;
}

Andrej_node_position_hash.prototype = {
	// == общие - как для работы со списком ==

	// убрать все, что уже кануло в Лету
	// вроде порядок должен сохраниться (поздние в конце), но на всякий случай отсортирую
	// ведь это важно - для порядка обхода, то есть для функций evaluate_smth
	purge : function( al ) {
		function delete_node( anode ) { // стереть с лица Земли
			for( var i=0; i<anode.moves.length; i++ ) {
				if( !anode.moves[i].pos.hasOwnProperty('parents') )
					continue;
				for( var l=0; l<anode.moves[i].pos.parents.length; l++ )
					if( anode.moves[i].pos.parents[l]==anode.moves[i] ) // ссылка на объект
						anode.moves[i].pos.parents.splice(l,1);
			};
			anode.moves = [];
			anode.parents = [];
		};
		for( var i in this.levels ) {
			if( Number(i)==NaN )
				continue;
			else
				i = Number(i);
			if( i<al.moves_count-1 ) {
				for( var j=0; j<this.levels[i].length; j++ )
					delete_node( this.levels[i][j] );
				delete this.levels[i];
				continue;
			}
			for( var j=0; j<this.levels[i].length; j++ )
				if( !al.compare_part( this.levels[i][j].l ) ) {
					delete_node( this.levels[i][j] );
					this.levels[i].splice(j,1);
				}
		}	;
		this.foreach( function() { this.probability = 0; } );
	},

	// поиск по эквивалентности позиции-объекта LL
	// функция вернёт элемент, если найдёт его, иначе null
	// первый параметр - позиция (объект LL)
	search_for_position : function( al ) {
		if( typeof(this.levels[al.moves_count-1])!='undefined' )
			for( var i=0; i<this.levels[al.moves_count-1].length; i++ )
				//if( typeof(this.levels[al.moves_count-1][i])!='undefined' )
				if( al.compare( this.levels[al.moves_count-1][i].l ) )
					return this.levels[al.moves_count-1][i];
		return null;
	},

	// поиск по эквивалентности позиции-объекта LL
	// функция вернёт элемент, если найдёт его, или СОЗДАСТ НОВЫЙ
	// первый параметр - позиция (объект LL), второй - параметры
	// второй параметр - коллбэк, которым создаётся объект позиции
	search_or_create : function( al, create_cb ) {
		var node = this.search_for_position( al );
		if( node )
			return node;
		node = create_cb();
		node.id = ++this.max_id;
		this.push( node );
		return node;
	},

	// добавить элемент
	// по сути он добавляется из search_for_position, поэтому отдельно вызывать не надо
	push : function( arg ) {
		if( typeof(this.levels[ arg.l.moves_count-1 ])=='undefined' )
			this.levels[ arg.l.moves_count-1 ] = [];
		this.levels[ arg.l.moves_count-1 ].push( arg );
	},

	// clear
	clear : function() {
		this.foreach(
			function() {
				this.moves = [];
				this.parents = [];
			}
		);
		this.levels = [];
	},

	// length
	size : function() {
		var len = 0;
		for( var i in this.levels )
			if( Number(i)!=NaN )
				len += this.levels[i].length;
		return len;
	},

	set_zero_node : function( anode ) {
		this.foreach(
			function() {
				/*if( this.is_zero_node ) {
				};*/
				this.is_zero_node = false;
			}
		);
		anode.is_zero_node = true;
	},

	// вернёт элемент по id
	node_by_id : function( aid ) {
		for( var i in this.levels ) {
			if( Number(i)==NaN )
				continue;
			for( var j=0; j<this.levels[i].length; j++ )
				if( this.levels[i][j].id == aid )
					return this.levels[i][j];
		}
	},

	// метод для перебора всех node
	// этот - в прямом порядке, следующий (reverse) - в обратном
	// аргумент - функция, которая будет вызвана в контексте того node
	// то есть можно использовать this - объект node
	// следующие аргументы будут переданы той функции - пока не используется
	foreach : function( cb, arg1, arg2, arg3, arg4, arg5 ) {
		var levels = [];
		for( var i in this.levels )
			if( Number(i)!=NaN )
				levels.push( Number(i) );
		levels.sort( function(a,b){return a-b} );
		for( var ii=0; ii<levels.length; ii++ )
			for( var i=0; i<this.levels[levels[ii]].length; i++ )
				cb.call( this.levels[levels[ii]][i], arg1, arg2, arg3, arg4, arg5 );
	},

	// перебор в обратном порядке, см. выше
	foreach_reverse : function( cb, arg1, arg2, arg3, arg4, arg5 ) {
		var levels = [];
		for( var i in this.levels )
			if( Number(i)!=NaN )
				levels.push( Number(i) );
		levels.sort( function(a,b){return b-a} );
		for( var ii=0; ii<levels.length; ii++ )
			for( var i=0; i<this.levels[levels[ii]].length; i++ )
				cb.call( this.levels[levels[ii]][i], arg1, arg2, arg3, arg4, arg5 );
	},



	// == функции evaluate_smth... ==

	// то есть методы, которые обрабатывают все элементы хэша

	// найти самые вероятные ходы (среди всех ходов, и будущих), которые будут сделаны, но пока оценены только статически
	// n - количество ходов-кандидатов, которые будут возвращены
	// будут возвращены только ходы, без вероятностей
	evaluate_collect_candidates : function( n_count ) {
		var result = []; // список ходов-кандидатов, который потом вернём
		// заполняем как массив объектов { move: obj, probability: val }, потом вернём только массив объектов Andrej_nodemove
		var cens = 0; // ценз - минимальный элемент
		var n = ( !isNaN(n_count) ? n_count : 10 );
		var splice_count = 20;
		// сначала сформируем его в таком формате { move: ход ,probability: вероятность }
		// потом перед концом функции оставим только ходы

		// вспомогательная функция
		// добавляет ход obj, если его вероятность val уместна в массиве result
		function insert_candidate( obj, val ) {
			if( !(val>0) ) return;
			if( val>cens )
				result.push( { move: obj, probability: val } );
			if( result.length>splice_count*n ) {
				result.sort( function(a,b) { return b.probability-a.probability; } );
				result.splice( n, Infinity );
				cens = ( result.length<n ? 0 : result[n-1] );
			};
		}

		// собственно, перебор
		this.foreach(
			function() {
				for( var j=0; j<this.moves.length; j++ ) {
					// ищем только ходы на концах дерева
					if( ( this.moves[j].pos instanceof Andrej_node_leaf ) ) {
						// 1. вероятность, что настанет сама позиция
						var position_prob = this.probability;
						// 2. умножить на вероятность, что будет выбран этот ход
						var move_prob = this.moves[j].probability;
						// 3. добавка 10.04.2015
						// reliability
						var rel = Math.pow( 1-this.moves[j].pos.reliability, andrej_move.k_engine_candidates_reliability_power );
						insert_candidate( this.moves[j], position_prob * move_prob * rel );
					}
				}
			}
		);
		// убираем длинный хвост
		result.sort( function(a,b) { return b.probability-a.probability; } );
		result.splice( n, Infinity );
		// оставим только ходы
		for( var i=0; i<result.length; i++ )
			result[i] = result[i].move;
		// вернём
		return result;
	},

	// порядок вызова:
	// - update_variants_count
	// - update_moves_probability
	// - update_estimate
	// - update_position_probability
	// - update_depth

	// пересчитать probabilities
	evaluate_local_values : function() {
		this.foreach_reverse(
			function() {
				this.update_variants_count();
				this.update_moves_probability();
				this.update_estimate();
			}
		);
	},

	evaluate_depths : function() {
		this.foreach_reverse(
			function() { this.update_depth(); }
		);
	},

	evaluate_position_probabilities : function() {
		this.foreach(
			function() { this.update_position_probability(); }
		);
	},

	// просто отсортировать ходы в каждом Andrej_node
	//	сортируется только для пользователя - для компьютера всё равно, в каком порядке ходы
	//	условие сортировки - см. функцию Andrej_node.compare_moves
	evaluate_sort_all_moves : function() {
		this.foreach(
			function() { this.sort_moves(); }
		);
	},	



	// == функция evaluate_move ==

	// заменить позицию, на которую ссылается ход, объектом Andrej_node
	// вызывается из Andrej_engine.evaluate_moves
	evaluate_move : function( amove ) {
		var temp_l = new LL( amove.parent.l );
		temp_l.modify_lines( amove.x, amove.y );
		var node = this.search_or_create( temp_l, function(){return new Andrej_node(temp_l)} );
		node.parents.push( amove );
		amove.parent.variants_count += node.variants_count - amove.pos.variants_count;
		amove.pos = node;
	}

}


