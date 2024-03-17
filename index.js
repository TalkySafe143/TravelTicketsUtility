const readline = require("prompt-sync")();
const serAPI = require("serpapi");
const fs = require("node:fs/promises");
const fetch = require("node-fetch");
require("dotenv").config();
const cities = [];

const permutations = (arr) => {
    if (arr.length <= 2)
        return arr.length === 2 ? [arr, [arr[1], arr[0]]] : arr;
    return arr.reduce(
        (acc, item, i) =>
            acc.concat(
                permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(
                    (val) => [item, ...val]
                )
            ),
        []
    );
};

const memoAirports = {
    Madrid: ["MAD"],
    London: ["LYC", "LHR"],
    Paris: ["CDG"],
    Berlin: ["BER"],
    Barcelona: ["BCN"],
};

const getAirports = async (city) => {
    if (memoAirports[city]) return memoAirports[city];
    const json = await (
        await fetch(`https://api.api-ninjas.com/v1/airports?city=${city}`, {
            headers: {
                "X-Api-Key": process.env.NINJAAPI_KEY,
            },
        })
    ).json();
    return json.map((value) => value.iata).filter((element) => element !== "");
};

const askDates = async (answer) => {
    console.log(`Ingrese las ${answer} ciudades.`);
    for (let i = 0; i < parseInt(answer); i++) {
        const city = readline(`Ingrese el nombre de la ${i + 1} ciudad: `);

        cities.push({
            name: city,
            airports: await getAirports(city),
        });
    }

    console.log(cities);
};

const queryTickets = async (departure_id, arrival_id, outbound_date) => {
    const options = {
        engine: "google_flights",
        hl: "es-419",
        gl: "co",
        departure_id,
        arrival_id,
        outbound_date,
        currency: "COP",
        type: "2",
        api_key: process.env.SERAPI_KEY,
    };

    //    console.log(options)

    try {
        const data = await serAPI.getJson(options);
        //     console.log(data);
        if (Object.keys(data).includes("error")) return [10000000000, null];
        return [data.best_flights[0].price, data.best_flights[0].booking_token];
    } catch (e) {
        console.log(`Ups, algo ocurrió`);
        console.log(e);
    }
};

/*
 * @param arr
 * {
            departureString,
            arrivalString: "",
            cityName: cities[i].name,
            airports: cities[i].airports,
            urlForBooking: "",
            bookingTok: ""
    };
 * */

const getBookingURL = async (c1, c2) => {
    const options = {
        engine: "google_flights",
        hl: "es-419",
        gl: "co",
        departure_id: c1.selectedAirportFrom,
        arrival_id: c2.selectedAirportTo,
        outbound_date: c1.departureString,
        currency: "COP",
        type: "2",
        booking_token: c1.bookingTok,
        api_key: process.env.SERAPI_KEY,
    };

    try {
        const data = await serAPI.getJson(options);
        c2.arrivalString =
            data.selected_flights[0].flights[
                data.selected_flights[0].flights.length - 1
            ].arrival_airport.time;
        c1.urlForBooking =
            data.booking_options[0].together.booking_request.url +
            "?" +
            data.booking_options[0].together.booking_request.post_data;
        c1.googleFlightsURL = data.search_metadata.google_flights_url;
    } catch (e) {
        console.log(`Ups, algo ocurrió`);
        console.log(e);
    }
};

const memo = {};

const getTourCost = async (input) => {
    const arr = new Array(...input);
    let sum = 0;
    for (let i = 0; i < arr.length - 1; i++) {
        let best = [10000000000, null];
        for (let j = 0; j < arr[i].airports.length; j++) {
            for (let k = 0; k < arr[i + 1].airports.length; k++) {
                let cost, token;
                if (memo[arr[i].airports[j] + " " + arr[i + 1].airports[k]]) {
                    cost =
                        memo[
                            arr[i].airports[j] + " " + arr[i + 1].airports[k]
                        ][0];
                    token =
                        memo[
                            arr[i].airports[j] + " " + arr[i + 1].airports[k]
                        ][1];
                } else {
                    const res = await queryTickets(
                        arr[i].airports[j],
                        arr[i + 1].airports[k],
                        arr[i].departureString
                    );
                    cost = res[0];
                    token = res[1];
                    memo[arr[i].airports[j] + " " + arr[i + 1].airports[k]] = [
                        cost,
                        token,
                    ];
                    if (!token) continue;
                }
                if (cost < best[0]) {
                    best = [cost, token];
                    arr[i].bookingTok = token;
                    arr[i].selectedAirportFrom = arr[i].airports[j];
                    arr[i + 1].selectedAirportTo = arr[i + 1].airports[k];
                }
            }
        }
        sum += best[0];
    }

    return [sum, arr];
};

(async function () {
    const numCities = readline("¿Cuantas ciudades se van a visitar? -> ");

    await askDates(numCities);

    let dates = new Array(parseInt(numCities));

    console.log(`A continuación, escriba las fechas de salida y de llegada`);
    console.log(
        `Las fechas no cuentan la primera ciudad. Va a ingresar ${parseInt(numCities) - 1} fechas.`
    );
    for (let i = 0; i < parseInt(numCities); i++) {
        console.log(`Ingresando la fecha ${i + 1} para ${cities[i].name}.`);
        console.log("--------------");
        const departureDay = readline("Ingrese el dia de salida -> ");
        const departureMonth = readline("Ingrese el mes de salida -> ");
        const departureYear = readline("Ingrese el año de salida -> ");
        const departureDate = new Date(
            parseInt(departureYear),
            parseInt(departureMonth) - 1,
            parseInt(departureDay)
        );

        const departureString = departureDate.toISOString().split("T")[0];

        dates[i] = {
            departureString,
            arrivalString: "",
            cityName: cities[i].name,
            airports: cities[i].airports,
            urlForBooking: "",
        };
    }
    dates.push(Object.assign({}, dates[0]));
    dates[dates.length - 1].departureString = "";
    let possibleWays = new Array(...dates);
    console.log("Calculando las posibles permutaciones y sus costos...")
    possibleWays = permutations(possibleWays.slice(1, possibleWays.length - 1));

    let bestPermutation;
    let minimumCost = 10000000000;
    for (let perm of possibleWays) {
        const [cost, arr] = await getTourCost([
            dates[0],
            ...perm,
            dates[dates.length - 1],
        ]);
        if (cost < minimumCost) {
            bestPermutation = arr;
            minimumCost = cost;
        }
    }

    //console.log(minimumCost)

    for (let i = 0; i < bestPermutation.length - 1; i++) {
        await getBookingURL(bestPermutation[i], bestPermutation[i + 1]);
    }

    //console.log(bestPermutation)

    await fs.writeFile(
        "./result.json",
        JSON.stringify({
            minimumCost,
            bestPermutation,
        })
    );
    console.log("El archivo result.json fue escrito")
})();
