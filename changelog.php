<?php

require( "includes/header.php" );
head( 'история версий', array( 'public/css/style.css' ), array(/*js*/) );
?>

<table>

<tr><td>15.02.2014</td><td>0.0.0.0</td><td>	<p>базовый интерфейс, реализация игрового процесса</p>
						<p>отлажены методы lines - основа всего</p></td></tr>

<tr><td>16.02.2014</td><td>0.0.0.1</td><td>	<p>более общая схема, ход игрока можно сделать любой функцией, а не только "по клику"</p></td></tr>

<tr><td>17.02.2014</td><td>0.0.0.2</td><td>	<p>оценка позиций работает прекрасно. Пора что-то допилить, чтобы можно было писать рекурсию. Это непросто (все данные как локальные переменные, и копировать их каждый раз при вызове функции я не собираюсь - абсурд)</p></td></tr>

<tr><td>20.02.2014</td><td>0.0.0.2</td><td>	<p>сделан поиск до глубины 2, но "в лоб" (без рекурсии). Дофига времени убил на отладку, исправлено множество неаккуратностей</p></td></tr>

<tr><td>21.02.2014</td><td>0.0.0.3</td><td>	<p>замечена странность в проставленных оценках (легкая несимметричность). После написания кода, контролирующего процесс выставления оценок, обнаржена неприятная ошибка (забыл проверять одну переменную). Теперь оценки работают безупречно. На этом закончено развитие версии 0.0.0.x . Буду реализовывать рекурсию в версии 0.0.1.x</p></td></tr>

<tr><td>21.02.2014</td><td>0.0.1.0</td><td>	<p>делать мне нечего, потратил время на оформление, появилась правая панелька</p></td></tr>

<tr><td>21.02.2014</td><td>0.0.1.1</td><td>	<p>метод оценки ходов теперь происходит по другому уравнению. Теперь можно сказать, что он безупречен. На этом сохраняю версию 1.0.1.x</p>
						<p>Дело в том, что раньше уравнение было не совсем справедливым. Позиция, где не может стоять пятерка, принималась за единицу, а позиция на пустом поле была чуть больше. Так как я не могу прогонять все пустые поля, появлялась разница между полями где я побывал, и полями, где не был. Она составляла 20%, что очень много. К тому же, новое уравнение стало ещё проще, теперь 5/(5-n). Люблю, когда всё становится проще</p></td></tr>

<tr><td>22.02.2014</td><td>0.0.2.0</td><td>	<p>конкретно всё переписываю под рекурсию. Обнаружил, что формула меня всё-таки не удовлетворяет. Раньше, когда формула была "нечестная", компьютер выигрывал у меня постоянно и играл совсем неплохо. Сейчас нет. Стал смотреть графики разных функций. Странно, но ничего убедительного за прошлую формулу не увидел. Растёт примерно так же, и, вообще, всё похоже.</p>
						<p>Теперь компьютер стал играть очень слабо. Всегда и везде меня глушит, аж что играть не интересно. И потом зевает. Если посмотреть, что было раньше, можно было идти по главной линии (это без поиска в глубину!) и не ругаться.</p></td></tr>

<tr><td>22.02.2014</td><td>0.0.2.1</td><td>	<p>выделение последнего хода, отмена ходов, оформление кнопочек. Исправлены две ошибки</p></td></tr>

<tr><td>22.02.2014</td><td>0.0.2.2</td><td>	<p>сделаны выпадающие менюшки вместо &lt;select>. Всё обобщено и работает эквивалентно</p></td></tr>

<tr><td>24.02.2014</td><td>0.0.3.0</td><td>	<p>появилась нормальная рекурсия. Для этого почти не потребовалось усилий, я долго всё подготавливал (см. описание предыдущих версий)</p></td></tr>

<tr><td>06.03.2014</td><td>0.0.3.1</td><td>	<p>рекурсия была не совсем нормальная. Исправлено множество ошибок, связанных с улетанием оценок в бесконечность при неожиданных победах. Разобрался со знаками. Теперь всё хорошо, за исключением того, что компьютер играет очень слабо.</p>
						<p>Стал разбираться. Оказывается, что от одного хода оценки улетают то в плюс, то в минус - никакого постоянства. Это нормально. Верю, что так действительно можно оценить ситуацию. Тем более, в расчетах я прибавляю пол хода тому, чей ход. Это слегка нивелирует разброс, иначе от одного хода всё менялось бы вообще непредсказуемо. Но в результате в поиске в глубину компьютер натыкается на случайные значения оценок, то плюс, то минус. Для адекватного решения этого недостаточно.</p>
						<p>Вижу несколько выходов.<br />1. Когда возвращаю оценку из рекурсивной функции, возвращать среднее арифметическое со статической оценкой. Идея: если они сильно далеко, итоговое значение будет ближе к нулю. Попытка защититься от разброса. Сначала думал просто о минимальном значении, среднем геометрическом или квадратичном, но всё это катит только для положительных оценок, а у меня и плюс, и минус. Недостатки: значение глубокого поиска будет сведено к нулю, намного больший вес в итоговой оценке будут иметь мелкие глубины. А, может, это и к лучшему? Ведь чем больше глубина, тем больше непредсказуемость?<br />2. Попробовать по-другому считать оценку ситуации. Например, не как сумма значений полей, а как произведение, то есть по логарифмической шкале. Идея: если везде оценки только положительные и "ноль" - это единица, то почему здесь по-другому? Например, у нас есть четвёрка, открытая с двух сторон. Какого будет итоговое значение? Сумма? Здесь теряется вся логика, по которой ищу оценку. Суть везде - это произведение.</p></td></tr>

<tr><td>07.03.2014</td><td>0.0.3.2</td><td>	<p>Компьютер играет слабо. Что делать? Попробовал сделать оценки как произведение. Вообще жуть, улетает в небеса. Нормировать на их количество? Стал складывать логарифмы оценок. Все равно играет слабо.</p>
						<p>Тогда я вернул прежнюю формулу. Нулевой уровень стал играть хорошо. А любая рекурсия ему проигрывала. Я поставил глубину 7, все равно, гад, проиграл. Попробовал вернуть общую оценку как сумму. Идея: если оценка поля - это вероятность победы, то надо бы перемножать обратные величины. Мы не знаем, какое значение выражает вероятность единица, поэтому аналогично действует сложение прямых величин. Но ничего не помогло. Вывод: формула для ценности полей отличная, а для оценки позиции - надо придумывать.</p>
						<p>Upd: замечена ошибка, или, по крайней мере, неточность. Компьютер нечётной глубины сильнее играет за крестики, чем чётной.</p></td></tr>

<tr><td>08.03.2014</td><td>0.0.3.3</td><td>	<p>Погулял, решил отталкиваться от того, что ценность полей выражает вероятность. Тупо вычел из значения единицу, обрезал отрицательные и нормировал на единицу с помощью арктангенса. И стал считать как вероятности, то есть перемножать обратные величины.</p>
						<p>Моя цель - чтобы выполнялось правило: компьютер большей глубины должен обыгрывать компьютер меньшей. К сожалению, пока и близко такого добиться не удавалось.</p>
						<p>Попробовал. Компьютер играет плохо, совершенно глупо и зевает. Оказалось, что для него значение "близко единице" (почти победа) == "очень близко к единице" (победа горит). Хотел обратить значения обратно на нормальную шкалу через тангенс, но решил, что не принципиально, можно через деление.</p>
						<p>По крайней мере, компьютер стал вразумительно играть. Не скажу, что меня восхищает его стиль, но по крайней мере без глупостей. Кстати, всё равно компьютер нечётной глубины хуже играет за нолики, чем компьютер меньшей чётной глубины. Кстати, : 10 : 5 : 4 : 0, кстати, проиграл нулевому уровню за нолики.</p></td></tr>

<tr><td>17.05.2014</td><td>0.0.4.0</td><td>	<p>Выпускаю новую версию. Даю номер 4 просто из-за большого промежутка времени, который прошел. На самом деле ничего сильно нового. Хочу не выпендриваться и считать оценку в static как в recursive. Результат - все проблемы с оценками решены, компьютер маленькой глубины стал играть во много раз лучше.</p></td></tr>

<tr><td>19.05.2014</td><td>0.0.4.1</td><td>	<p>Исправлены коэффициенты в оценках. А то программа играла неправильно. Также заново определены уровни сложности.</p>
						<p>TODO : сделать width как вложенные массивы. Не будет лишних копирований.</p>
						<p>TODO : вынести определения уровней сложности в отдельный файл. Чтобы не создавать кучу и легче редактировать.</p>
						<p>TODO : динамическую задержку перед ходом, у нас же везде интеллектуальные системы, надо идти в ногу.</p></td></tr>

<tr><td>20.05.2014</td><td>0.0.4.2</td><td>	<p>Только малые правки, где-то что-то добавлено/убрано/прокомментировано, подправлена пара коэффициентов.</p></td></tr>

<tr><td>03.06.2014</td><td>0.0.4.3</td><td>	<p>Добавлен старый ИИ, который считал оценку с арктангенсами; оказывается, он намного умнее. Варианты уровня компьютера, наконец-то, вынесены в отдельный файл, чтобы было легче редактировать. Добавлена ссылка на чешскую версию и на обсуждение (оно само пока не создано). Site_notice тоже вынесен в отдельный файл.</p></td></tr>

<tr><td>04.06.2014</td><td>0.0.4.4</td><td>	<p>Width переделано в многомерный массив (параметр в рекурсивную функцию).Какие-то копейки времени сэкономлю.</p></td></tr>

<tr><td>06.06.2014</td><td>0.0.4.5</td><td>	<p>Создал галерею картинок "процесс работы" и страницу обсуждения (комментарии Вконтакте). Курю оценки.</p></td></tr>

<tr><td>06.02.2015</td><td>0.0.4.6</td><td>	<p>Изменяю формулу, многочисленные правки вычислений. Теперь статическая оценка постепенно добавляется к рекурсивной. Сначала в зависимости от коэффициента, потом сделал коэффициент, зависящий от глубины. Кстати, функция теперь возвращает однм из параметров число просчитанных комбинаций, впоследствии это окажется очень важно. Уже сейчас заметно, компьютер стал заметно умнее и на маленьких глубинах уже переигрывает старую верстю (aka версию "по арктангенсу").</p></td></tr>

<tr><td>08.02.2015</td><td>0.0.4.7</td><td>	<p>Исправлена ошибка оценки числа операций (bench.js). Реализована динамическая задержка перед ходом (gameplay.js). Оформительство: сделан интерфейс загрузки и просмотра игры. Работаю над панелькой справа ai_analysis_sidebar.</p></td></tr>

<tr><td>08.02.2015</td><td>0.0.4.8</td><td>	<p>Закончил работу над панелькой справа, теперь она показывает актуальный список из ai_options (я сделал это, поизвращавшись с регэкспами; знаю, несмешно). Реализовал графическую отрисовку рекурсивных оценок. Дико рад.</p></td></tr>

<tr><td>08.02.2015</td><td>0.0.4.9</td><td>	<p>Теперь при подсчете общей оценки весовые коэффициенты зависят от количества рассмотренных вариантов. Пока особо не тестировал, но возлагаю на этот маленький, но важный шаг большие надежды.</p></td></tr>

<tr><td>10.02.2015</td><td>0.0.4.10</td><td>	<p>Компьютер стал официально уважать параметр про правило квадрата (галочка на главной панели). Незначительное изменение, но номер к версии добавил. Странно, наверно это мой новодел, ни в каких правилах в Википедии такого не нашел.</p></td></tr>

<tr><td>12.02.2015</td><td>0.0.5.0</td><td>	<p>Мудрил, мудрил с коэффициентами. Пытался как лучше, чтобы все было логичнее, чтобы в пограничных ситуациях у компьютера на первом месте бело правильное решение. Теперь компьютер играет крайне странно.</p><p>Всю мою аналитику надо переделывать. Все коэффициенты надо считать заново. К такой большой работе назначил новый номер версии, 0.0.5. Теперь легче будет сравнивать силу старого и нового алгоритма.</p><p>Сделал большую работу по менеджменту версий, теперь везде цифорки стоят аккуратнее, подписал файлы.</p></td></tr>

<tr><td>12.02.2015</td><td>0.0.5.1</td><td>	<p>Реализовал алгоритм матча, теперь можно запускать несколько компьютеров соревноваться, результаты заносятся в таблицу и печатаются в консоль.</p></td></tr>

<tr><td>21.02.2015</td><td>0.0.5.2</td><td>	<p>Кое-что чуть покультурнее, мелкие правки. Главное - реализовал возможность сдаться. Это звучит глупо, но если компьютер видит, что его оценки всегда ноль, он сдается, это ускоряет время проведения матчей.</p><p>Также мелкими правками доработал алгоритм матча, теперь автоматически считаются рейтинги Эло, чтобы сразу было ясно, кто сильнее.</p><p>Также сделал принципиальное изменение в оценках. Сделал два алгоритма, один назвал "tactical", другой "positional" (условно). Tactical - считаю среднюю оценки из статически клеток с учетом их веса. Positional - перевожу статическую оценку в вероятность с помощью логистической функции ([[:en:Logistic curve]]), вычитаю значение из единицы (типа получаю вероятность поражения), потом все такие значения перемножаю (вероятность победы противника), опять вычитаю из единицы и обратной функцией перевожу из вероятности в оценку. Сделано это было по аналогии с первым алгоритмом (вместо логистической функции использовал арктангенс), но первый алгоритм играет умно, а то, что я теперь написал - вообще без логики.</p><p>Курю оценки. Сильно разочаровался. Никакого объективного значения оценки они не показывают. То плюс, то минус, а по сути всегда около нуля. Хоть вешайся. Версия 0.0.5 признана неудачной.</p><p>TODO: есть проблема, когда игру я закончил, а компьютер еще думает и сделает ход, когда ситуация уже будет неактуально. Я вроде научился работать с объектами в Javascript, если все покультурнее переделаю, как объекты, все будет чики-пуки.</p><p>TODO: у меня грандиозные идеи насчет оценок. Что, если (см. в тетрадке Чана, как говорится).</p></td></tr>

<tr><td>23.02.2015</td><td>0.0.6.0</td><td>	<p>Все переделал в объекты (см. прошлый TODO). Уфх, аццкая работа! Оценки пока прежние, но в версии 0.0.6.1 сделаю по-новому.</p></td></tr>

<tr><td>25.02.2015</td><td>0.0.6.1</td><td>	<p>Реализовал новую формулу поиска коэффициента. Очень просто. Ищу среднее с учетом весовых коэффициентов. Собственно, вес - это значение в вероятность (по функции, основанной на [[:en:Logistic curve]], которую я недавно реализовал).</p></td></tr>

<tr><td>27.02.2015</td><td>0.0.6.2</td><td>	<p>Исправлены мелкие ошибки, связанные с переходом на объектную модель (см. что нового в вер. 0.0.6.0). Некорректно передавались callback-функции, в результате чего игра визуально "зависала" (только не рисовалась на экране, на самом деле игра шла).</p><p>Понял, что я все-таки плохо считаю коэффициенты. Результат слишком похож на "среднее", а не на "максимум". Если есть ход с вероятностью единица (скажем, почти единица), он теряется в общей массе. Поанализировал, пока увеличил k_static в 15 раз.</p><p>Позже обнаружил, что аналитика совершенно неверная. Компьютер начинает играть "умнее", только когда оценки улетают в бесконечноть. Иными словами, он растет в силе до уровня статического))).</p></td></tr>

</table>


<?php
require( "includes/footer.php" );

?>
