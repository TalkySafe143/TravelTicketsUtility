const readline = require("prompt-sync")()
const serAPI = require("serpapi")
const fetch = require("node-fetch")
require("dotenv").config()
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

const getAirports = async city => {
  const json = await (await fetch(`https://api.api-ninjas.com/v1/airports?city=${city}`, {
    headers: {
      'X-Api-Key': process.env.NINJAAPI_KEY
    }
  })).json();
  return json.map(value => value.iata).filter(element => element !== '');
}
  
const askDates = async (answer) => {
    console.log(`Ingrese las ${answer} ciudades.`)
    for (let i = 0; i < parseInt(answer); i++) {
        const city = readline(`Ingrese el nombre de la ${i+1} ciudad: `);

        cities.push({
          name: city,
          airports: await getAirports(city)
        })
    }

    console.log(cities)
}



(async function() {
  const numCities = readline("¿Cuantas ciudades se van a visitar? -> ")

await askDates(numCities)

let dates = new Array(parseInt(numCities))

console.log(`A continuación, escriba las fechas de salida y de llegada`)
console.log(`Las fechas no cuentan la primera ciudad. Va a ingresar ${parseInt(numCities)-1} fechas.`)
for (let i = 0; i < parseInt(numCities)-1; i++) {
  console.log(`Ingresando la fecha ${i+1}.`)
  const arrivalDay = readline("Ingrese el dia de llegada -> ")
  const arrivalMonth = readline("Ingrese el mes de llegada -> ")
  const arrivalYear = readline("Ingrese el año de llegada -> ")
  const arrivalDate = new Date(
    parseInt(arrivalYear), 
    parseInt(arrivalMonth)-1, 
    parseInt(arrivalDay)
  );
  console.log("--------------")
  const departureDay = readline("Ingrese el dia de salida -> ")
  const departureMonth = readline("Ingrese el mes de salida -> ")
  const departureYear = readline("Ingrese el año de salida -> ")
  const departureDate = new Date(
    parseInt(departureYear),
    parseInt(departureMonth)-1,
    parseInt(departureDay)
  );
  
  const departureString = departureDate.toISOString().split("T")[0];
  const arrivalString = arrivalDate.toISOString().split("T")[0];

  console.log("Las fechas ingresadas son: ")
  console.log(`Fecha de llegada: ${arrivalString}`)
  console.log(`Fecha de salida: ${departureString}`)
  
  dates[i+1] = {
    departureString,
    arrivalString,
    cityName: ""
  }

  if (i == 0) {
    dates[i] = {
      departureString: arrivalString,
      arrivalString: "",
      cityName: cities[0].name
    }
  } 
  
  if (i == parseInt(numCities)-2) {
    dates[0].arrivalString = departureString
  }
}

console.log(dates)
})();