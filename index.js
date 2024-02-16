const readline = require('node:readline');
const { stdin: input, stdout: output } = require('node:process');

const rl = readline.createInterface({ input, output });

const cities = []

const permutations = arr => {
    if (arr.length <= 2) return arr.length === 2 ? [arr, [arr[1], arr[0]]] : arr;
    return arr.reduce(
      (acc, item, i) =>
        acc.concat(
          permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(val => [
            item,
            ...val,
          ])
        ),
      []
    );
  };
  

const addCity = (answer) => {
    cities.push(answer)
}

const askDates = (answer) => {
    console.log(`Ingrese las ${answer} ciudades.`)
    for (let i = 0; i < parseInt(answer); i++) {
        rl.question(`Ingrese el nombre de la ciudad ${i+1}: `, addCity)
    }

    cities.push()
}

rl.question('¿Cuantas ciudades se va a visitar?', askDates);
