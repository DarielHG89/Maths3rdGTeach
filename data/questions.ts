import type { Question, CategoryId } from '../types';

export const questions: Record<CategoryId, Record<number, Question[]>> = {
    numeros: {
        1: [
            { type: 'mcq', question: '¿Qué número es "ciento veintitrés"?', options: ['132', '123', '213'], answer: '123', explanation: 'El número ciento veintitrés se escribe con un 1 en las centenas, un 2 en las decenas y un 3 en las unidades.' },
            { type: 'input', question: 'Escribe el número que va después de 99', answer: '100', hint: 'Es el número que sigue al contar.', explanation: 'Después de 99, completamos una centena, por lo que el siguiente número es 100.' },
            { type: 'mcq', question: '¿Cuál es mayor, 89 o 98?', options: ['89', '98'], answer: '98', explanation: 'Ambos números tienen dos cifras, pero 98 tiene 9 decenas, que es más que las 8 decenas de 89.' },
            { type: 'input', question: 'Escribe con cifras: "doscientos cincuenta"', answer: '250', explanation: 'Doscientos es 200 y cincuenta es 50. Juntos forman el 250.' },
            { type: 'mcq', question: '¿Qué número está entre 45 y 47?', options: ['44', '48', '46'], answer: '46', explanation: 'Al contar, el número que está justo en medio de 45 y 47 es el 46.' }
        ],
        2: [
            { type: 'input', question: 'Escribe con cifras: "Dos mil quince"', answer: '2015', explanation: 'El número "dos mil quince" tiene un 2 en los millares y un 15 al final. Se necesita un 0 en las centenas.' },
            { type: 'mcq', question: 'En 3,456, ¿qué valor tiene el 4?', options: ['40', '400', '4000'], answer: '400', hint: 'Piensa en la posición: unidades, decenas, centenas...', explanation: 'El 4 está en la posición de las centenas, por lo que su valor es 400.' },
            { type: 'input', question: 'Descompón 1,205 (ej: 1000+200+5)', answer: '1000+200+5', explanation: 'El número 1,205 está formado por 1 millar (1000), 2 centenas (200) y 5 unidades (5).' },
            { type: 'mcq', question: '¿Cuál es menor, 5,010 o 5,100?', options: ['5,010', '5,100'], answer: '5,010', explanation: 'Ambos tienen 5 millares, pero 5,010 tiene 0 centenas mientras que 5,100 tiene 1 centena, por lo tanto 5,010 es menor.' },
            { type: 'input', question: 'Escribe con letras: 1,500', answer: 'mil quinientos', explanation: 'El número 1,500 se lee como "mil quinientos".' }
        ],
        3: [
            { type: 'mcq', question: 'Ordena de menor a mayor: 8190, 8910, 8091', options: ['8190, 8910, 8091', '8091, 8190, 8910', '8910, 8190, 8091'], answer: '8091, 8190, 8910', explanation: 'Para ordenar, comparamos las cifras de izquierda a derecha. El menor es 8091, luego 8190 y el mayor es 8910.' },
            { type: 'input', question: 'Tengo 5 millares, 0 centenas, 3 decenas y 2 unidades. ¿Qué número soy?', answer: '5032', hint: 'Coloca cada cifra en su posición correcta.', explanation: 'Juntando cada valor posicional, formamos el número 5,032.' },
            { type: 'input', question: 'Escribe el número anterior a 7,000', answer: '6999', explanation: 'Justo antes de completar el millar 7,000, está el número 6,999.' },
            { type: 'mcq', question: '¿Qué número se forma con 9000 + 50 + 8?', options: ['9580', '9058', '9508'], answer: '9058', explanation: 'Sumamos los valores: 9000 en los millares, 50 en las decenas (necesita un 0 en las centenas) y 8 en las unidades.' },
            { type: 'input', question: 'Redondea 3,870 a la centena más cercana', answer: '3900', hint: '¿Está más cerca de 3,800 o de 3,900?', explanation: 'El número 70 en las decenas está más cerca de la siguiente centena (100) que de 0, por lo que redondeamos hacia arriba a 3,900.' }
        ]
    },
    suma_resta: {
        1: [
            { type: 'input', question: '15 + 20 = ?', answer: '35', explanation: 'Sumamos las decenas (10+20=30) y luego las unidades (5+0=5), dando un total de 35.' },
            { type: 'mcq', question: '30 - 10 = ?', options: ['10', '20', '40'], answer: '20', explanation: 'Restar 10 es como quitar una decena. 3 decenas menos 1 decena son 2 decenas, es decir, 20.' },
            { type: 'input', question: 'Si tienes 10 galletas y te comes 3, ¿cuántas quedan?', answer: '7', explanation: 'Esta es una resta simple: 10 - 3 = 7.' },
            { type: 'input', question: '25 + 8 = ?', answer: '33', explanation: 'Puedes sumar 25 + 5 para llegar a 30, y luego sumar los 3 restantes. 30 + 3 = 33.' },
            { type: 'mcq', question: '50 - 5 = ?', options: ['40', '45', '55'], answer: '45', explanation: 'Quitar 5 a 50 nos deja en 45.' }
        ],
        2: [
            { type: 'input', question: '125 + 200 = ?', answer: '325', hint: 'Suma solo las centenas.', explanation: 'Sumar 200 es añadir 2 a las centenas. 125 se convierte en 325.' },
            { type: 'mcq', question: '500 - 150 = ?', options: ['250', '350', '450'], answer: '350', explanation: 'Puedes restar 100 primero (500-100=400) y luego restar 50 (400-50=350).' },
            { type: 'input', question: '89 + 11 = ?', answer: '100', explanation: 'Esta es una suma que completa una centena. 89 + 1 = 90, y 90 + 10 = 100.' },
            { type: 'input', question: 'Calcula 345 + 155', answer: '500', explanation: 'Sumando las unidades (5+5=10), decenas (40+50+10=100) y centenas (300+100+100=500), obtenemos 500.' },
            { type: 'mcq', question: 'De 200, quita 75. ¿Cuánto queda?', options: ['125', '150', '175'], answer: '125', explanation: '200 menos 75 es 125. Puedes pensar: 200 - 100 = 100, y luego devuelves 25.' }
        ],
        3: [
            { type: 'input', question: '4,250 + 1,850 = ?', answer: '6100', hint: 'Suma primero los miles, luego los cientos.', explanation: '4000+1000=5000. 250+850=1100. 5000+1100=6100.' },
            { type: 'mcq', question: '8,000 - 1,250 = ?', options: ['6750', '7250', '7750'], answer: '6750', explanation: '8000 menos 1000 es 7000. 7000 menos 250 es 6750.' },
            { type: 'input', question: 'Un libro tiene 300 páginas. Si he leído 125, ¿cuántas me faltan?', answer: '175', explanation: 'La operación es una resta: 300 - 125 = 175 páginas.' },
            { type: 'input', question: 'Calcula 2,005 - 999', answer: '1006', hint: 'Restar 999 es casi como restar 1000.', explanation: 'Es más fácil restar 1000 (2005-1000=1005) y luego sumar 1, porque restaste uno de más. El resultado es 1006.' },
            { type: 'mcq', question: 'Juan tenía 500 cromos, perdió 150 y luego ganó 100. ¿Cuántos tiene ahora?', options: ['250', '450', '550'], answer: '450', explanation: 'Primero restamos: 500 - 150 = 350. Luego sumamos: 350 + 100 = 450.' }
        ]
    },
    multi_divi: {
        1: [
            { type: 'input', question: '2 x 8 = ?', answer: '16', explanation: 'Multiplicar 2 por 8 es lo mismo que sumar 8 dos veces (8+8=16).' },
            { type: 'mcq', question: '10 ÷ 2 = ?', options: ['2', '5', '8'], answer: '5', explanation: 'Dividir 10 entre 2 es repartir 10 en dos grupos iguales. Cada grupo tendría 5.' },
            { type: 'input', question: '3 cajas con 4 lápices cada una. ¿Cuántos lápices hay?', answer: '12', explanation: 'Para saber el total, multiplicamos 3 cajas por 4 lápices: 3 x 4 = 12.' },
            { type: 'input', question: '5 x 5 = ?', answer: '25', explanation: 'La tabla del 5 nos dice que 5 veces 5 es 25.' },
            { type: 'mcq', question: 'Reparte 9 galletas entre 3 amigos. ¿Cuántas para cada uno?', options: ['3', '6', '9'], answer: '3', explanation: 'La operación es una división: 9 ÷ 3 = 3 galletas para cada amigo.' }
        ],
        2: [
            { type: 'input', question: '15 x 10 = ?', answer: '150', hint: 'Multiplicar por 10 es muy fácil.', explanation: 'Para multiplicar cualquier número por 10, simplemente le añadimos un cero al final. 15 se convierte en 150.' },
            { type: 'mcq', question: '60 ÷ 6 = ?', options: ['6', '10', '12'], answer: '10', explanation: 'Dividir 60 entre 6 nos da 10, porque 10 x 6 = 60.' },
            { type: 'input', question: 'Repartir 20 caramelos entre 4 amigos. ¿Cuántos para cada uno?', answer: '5', explanation: 'Dividimos el total de caramelos entre el número de amigos: 20 ÷ 4 = 5.' },
            { type: 'input', question: '25 x 3 = ?', answer: '75', explanation: 'Puedes pensar en 3 monedas de 25 céntimos. Son 75 céntimos.' },
            { type: 'mcq', question: '¿Cuánto es 45 ÷ 5?', options: ['8', '9', '10'], answer: '9', explanation: 'Según la tabla de multiplicar del 5, sabemos que 5 x 9 = 45.' }
        ],
        3: [
            { type: 'input', question: '125 x 5 = ?', answer: '625', explanation: 'Podemos multiplicar por partes: 100x5=500, 20x5=100, 5x5=25. Sumamos todo: 500+100+25=625.' },
            { type: 'mcq', question: '100 ÷ 4 = ?', options: ['20', '25', '30'], answer: '25', hint: 'Piensa en repartir 100 euros entre 4 personas.', explanation: 'Dividir 100 en 4 partes iguales nos da 25 en cada parte.' },
            { type: 'input', question: 'Un bus tiene 50 asientos. Si hay 5 filas, ¿cuántos asientos por fila?', answer: '10', explanation: 'Dividimos el total de asientos entre el número de filas: 50 ÷ 5 = 10.' },
            { type: 'input', question: 'Calcula 350 x 2', answer: '700', explanation: 'Multiplicar por 2 es lo mismo que sumar el número a sí mismo: 350 + 350 = 700.' },
            { type: 'mcq', question: 'Si divides 32 entre 5, ¿cuánto sobra (resto)?', options: ['0', '1', '2'], answer: '2', explanation: '5 cabe 6 veces en 32 (5x6=30). Desde 30 hasta 32, sobran 2. El resto es 2.' }
        ]
    },
    problemas: {
        1: [
            { type: 'input', question: 'Si tienes 3 bolsas con 5 manzanas cada una, ¿cuántas manzanas tienes en total?', answer: '15', explanation: 'Para encontrar el total, multiplicamos el número de bolsas por las manzanas en cada una: 3 x 5 = 15.' },
            { type: 'mcq', question: 'Ana tiene 20 euros y gasta 8. ¿Cuánto le queda?', options: ['10', '12', '15'], answer: '12', explanation: 'La operación es una resta: 20 - 8 = 12 euros.' },
            { type: 'input', question: 'Un perro tiene 4 patas. ¿Cuántas patas tienen 3 perros?', answer: '12', explanation: 'Multiplicamos el número de perros por el número de patas de cada uno: 3 x 4 = 12.' }
        ],
        2: [
            { type: 'input', question: 'Compro un libro de 15€ y un lápiz de 2€. Si pago con 20€, ¿cuánto me devuelven?', answer: '3', hint: 'Primero suma lo que gastaste.', explanation: 'Paso 1: Sumar el gasto total (15+2=17€). Paso 2: Restar el gasto del dinero que tenías (20-17=3€ de cambio).' },
            { type: 'mcq', question: 'En un parking hay 10 coches y 5 motos. ¿Cuántas ruedas hay en total? (Coche=4, Moto=2)', options: ['50', '60', '30'], answer: '50', explanation: 'Ruedas de coches: 10x4=40. Ruedas de motos: 5x2=10. Total: 40+10=50 ruedas.' },
            { type: 'input', question: 'Cada día ahorro 2 euros. ¿Cuánto ahorraré en una semana (7 días)?', answer: '14', explanation: 'Multiplicamos el ahorro diario por el número de días: 2 x 7 = 14 euros.' }
        ],
        3: [
            { type: 'input', question: 'Un tren tiene 8 vagones con 50 asientos cada uno. Si viajan 350 personas, ¿cuántos asientos quedan libres?', answer: '50', hint: 'Calcula el total de asientos primero.', explanation: 'Paso 1: Total de asientos (8x50=400). Paso 2: Restar las personas (400-350=50 asientos libres).' },
            { type: 'mcq', question: 'Laura lee 25 páginas cada día. Si el libro tiene 200 páginas, ¿en cuántos días lo terminará?', options: ['6', '7', '8'], answer: '8', explanation: 'Dividimos el total de páginas entre las páginas que lee por día: 200 ÷ 25 = 8 días.' },
            { type: 'input', question: 'Una caja de galletas cuesta 3€. Si tengo 10€ y compro 3 cajas, ¿cuánto dinero me queda?', answer: '1', explanation: 'Paso 1: Gasto total (3x3=9€). Paso 2: Restar el gasto del dinero que tenías (10-9=1€ restante).' }
        ]
    },
    geometria: {
        1: [
            { type: 'mcq', question: '¿Qué figura tiene 3 lados?', options: ['Cuadrado', 'Círculo', 'Triángulo'], answer: 'Triángulo', explanation: 'La palabra "Triángulo" significa "tres ángulos", y tiene 3 lados.' },
            { type: 'input', question: '¿Cuántos lados tiene un rectángulo?', answer: '4', explanation: 'Un rectángulo es una figura de 4 lados, con lados opuestos iguales.' },
            { type: 'mcq', question: 'Una pelota tiene forma de...', options: ['Cubo', 'Esfera', 'Pirámide'], answer: 'Esfera', explanation: 'La esfera es el cuerpo geométrico redondo como una pelota.' }
        ],
        2: [
            { type: 'mcq', question: 'Un dado tiene forma de...', options: ['Cilindro', 'Prisma', 'Cubo'], answer: 'Cubo', explanation: 'Un cubo es un cuerpo geométrico con 6 caras cuadradas iguales, como un dado.' },
            { type: 'input', question: '¿Cuántos vértices (esquinas) tiene un cuadrado?', answer: '4', explanation: 'Un cuadrado tiene 4 esquinas donde se unen sus lados, llamadas vértices.' },
            { type: 'mcq', question: '¿Cómo se llaman las líneas de una vía de tren?', options: ['Perpendiculares', 'Paralelas', 'Secantes'], answer: 'Paralelas', hint: 'Son líneas que nunca se tocan.', explanation: 'Las rectas paralelas son aquellas que mantienen siempre la misma distancia entre sí y nunca llegan a cruzarse.' }
        ],
        3: [
            { type: 'input', question: 'Un cuadrado tiene un lado de 5 cm. ¿Cuál es su perímetro (la suma de sus lados)?', answer: '20', explanation: 'El perímetro es la suma de todos los lados. Como un cuadrado tiene 4 lados iguales, sumamos 5+5+5+5, o multiplicamos 5x4, que es 20 cm.' },
            { type: 'mcq', question: 'Si un rectángulo mide 6 cm de largo y 4 cm de ancho, ¿cuál es su perímetro?', options: ['10', '16', '20'], answer: '20', explanation: 'El perímetro es la suma de sus cuatro lados: 6 + 4 + 6 + 4 = 20 cm.' },
            { type: 'input', question: '¿Cómo se llama un triángulo con todos sus lados iguales?', answer: 'equilátero', explanation: 'La palabra "equilátero" significa "lados iguales".' }
        ]
    },
    medidas: {
        1: [
            { type: 'mcq', question: '¿Qué es más largo, 1 metro o 1 centímetro?', options: ['1 metro', '1 centímetro'], answer: '1 metro', explanation: 'Un metro es mucho más grande, contiene 100 centímetros.' },
            { type: 'input', question: '¿Cuántos gramos hay en 1 kilogramo?', answer: '1000', explanation: 'La palabra "kilo" significa mil, por lo tanto, un kilogramo son 1000 gramos.' },
            { type: 'mcq', question: 'Para medir el agua en una botella, usamos...', options: ['Metros', 'Gramos', 'Litros'], answer: 'Litros', explanation: 'Los litros son la unidad de medida para la capacidad o el volumen de los líquidos.' }
        ],
        2: [
            { type: 'input', question: 'Si una mesa mide 2 metros, ¿cuántos centímetros son?', answer: '200', hint: 'Recuerda que 1 metro son 100 centímetros.', explanation: 'Si 1 metro son 100 cm, entonces 2 metros son 2 x 100 = 200 cm.' },
            { type: 'mcq', question: '¿Qué pesa más, 1 kg de algodón o 1 kg de hierro?', options: ['Algodón', 'Hierro', 'Pesan lo mismo'], answer: 'Pesan lo mismo', explanation: 'Aunque el hierro ocupe menos espacio, un kilogramo es un kilogramo. Ambos pesan exactamente lo mismo.' },
            { type: 'input', question: 'Medio litro de agua, ¿cuántos mililitros son?', answer: '500', explanation: 'Un litro completo tiene 1000 mililitros. La mitad de 1000 es 500.' }
        ],
        3: [
            { type: 'input', question: 'Un camino mide 3 kilómetros. ¿Cuántos metros son?', answer: '3000', explanation: 'La palabra "kilo" significa mil. Un kilómetro son 1000 metros, por lo que 3 kilómetros son 3000 metros.' },
            { type: 'mcq', question: 'Si corro 1,500 metros, ¿cuántos kilómetros y metros he corrido?', options: ['15 km y 0 m', '1 km y 500 m', '1 km y 50 m'], answer: '1 km y 500 m', explanation: 'Como 1000 metros son 1 km, los 1,500 metros se separan en 1 km (1000m) y 500 metros restantes.' },
            { type: 'input', question: 'Una tarta pesa 1.5 kilogramos. ¿Cuántos gramos son?', answer: '1500', hint: '1.5 es lo mismo que uno y medio.', explanation: '1 kilogramo son 1000 gramos, y medio kilogramo son 500 gramos. En total, 1000 + 500 = 1500 gramos.' }
        ]
    },
    reloj: {
        1: [
            { type: 'input', question: 'Si son las 3 en punto, ¿qué número señala la aguja grande (minutero)?', answer: '12', explanation: 'Cuando es una hora "en punto", el minutero siempre está en el 12.' },
            { type: 'mcq', question: '¿Cuántos minutos hay en una hora?', options: ['30', '60', '90'], answer: '60', explanation: 'Una hora se compone de 60 minutos.' },
            { type: 'input', question: 'Escribe con números: "Las cinco y media"', answer: '5:30', explanation: '"Y media" significa que han pasado 30 minutos de la hora.' }
        ],
        2: [
            { type: 'input', question: 'El recreo empieza a las 10:45 y dura 20 minutos. ¿A qué hora termina?', answer: '11:05', hint: 'Suma 15 minutos para llegar a las 11:00 y luego suma los 5 minutos que faltan.', explanation: '10:45 más 15 minutos son las 11:00. Como eran 20 minutos en total, añadimos los 5 minutos restantes. Termina a las 11:05.' },
            { type: 'mcq', question: '¿Cuántos segundos hay en un minuto?', options: ['30', '60', '100'], answer: '60', explanation: 'Un minuto se compone de 60 segundos.' },
            { type: 'input', question: 'Si la película empieza a las 5:00 y dura 2 horas, ¿a qué hora acaba?', answer: '7:00', explanation: 'Simplemente sumamos 2 horas a la hora de inicio: 5 + 2 = 7. Acaba a las 7:00.' }
        ],
        3: [
            { type: 'input', question: 'Un viaje en tren dura 90 minutos. ¿Cuántas horas y minutos son?', answer: '1 hora y 30 minutos', explanation: 'Como una hora son 60 minutos, podemos quitar 60 minutos de los 90 (90-60=30). Eso nos da 1 hora y los 30 minutos que sobran.' },
            { type: 'mcq', question: 'Son las 14:00. ¿Qué hora es en formato de 12 horas?', options: ['2:00 AM', '12:00 PM', '2:00 PM'], answer: '2:00 PM', explanation: 'Para convertir horas después del mediodía, restamos 12. 14 - 12 = 2. Como es después del mediodía, es PM.' },
            { type: 'input', question: 'Salí de casa a las 8:30 y volví a las 10:00. ¿Cuánto tiempo estuve fuera?', answer: '1 hora y 30 minutos', hint: 'Cuenta el tiempo de 8:30 a 9:00, y luego de 9:00 a 10:00.', explanation: 'De 8:30 a 9:00 hay 30 minutos. De 9:00 a 10:00 hay 1 hora. En total, 1 hora y 30 minutos.' }
        ]
    }
};
