import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.routes.js";
import restrictedZonesRoutes from "./routes/restricted-zones.routes.js";
import {
  authenticateJWT,
  authorizeRole,
  AuthRequest,
} from "./middleware/auth.js";
import { startNotificationWorker } from "./workers/notification.worker.js";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/restricted-zones", restrictedZonesRoutes);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- SEEDING LOGIC ---
async function seed() {
  const airportCount = await prisma.airport.count();
  if (airportCount === 0) {
    console.log("Seeding initial airports...");
    await prisma.airport.createMany({
      data: [
        // --- ESPAÑA (Red Principal Aena) ---
        {
          id: "MAD",
          name: "Adolfo Suárez Madrid-Barajas",
          city: "Madrid",
          country: "España",
          lat: 40.4936,
          lng: -3.5668,
        },
        {
          id: "BCN",
          name: "Josep Tarradellas Barcelona-El Prat",
          city: "Barcelona",
          country: "España",
          lat: 41.2971,
          lng: 2.0785,
        },
        {
          id: "PMI",
          name: "Palma de Mallorca",
          city: "Palma",
          country: "España",
          lat: 39.5486,
          lng: 2.7301,
        },
        {
          id: "AGP",
          name: "Málaga-Costa del Sol",
          city: "Málaga",
          country: "España",
          lat: 36.6749,
          lng: -4.4991,
        },
        {
          id: "ALC",
          name: "Alicante-Elche Miguel Hernández",
          city: "Alicante",
          country: "España",
          lat: 38.2822,
          lng: -0.5582,
        },
        {
          id: "TFS",
          name: "Tenerife Sur",
          city: "Tenerife",
          country: "España",
          lat: 28.0445,
          lng: -16.5725,
        },
        {
          id: "VLC",
          name: "Valencia",
          city: "Valencia",
          country: "España",
          lat: 39.4893,
          lng: -0.4816,
        },
        {
          id: "SVQ",
          name: "Sevilla",
          city: "Sevilla",
          country: "España",
          lat: 37.418,
          lng: -5.8931,
        },
        {
          id: "TFN",
          name: "Tenerife Norte-C. La Laguna",
          city: "Tenerife",
          country: "España",
          lat: 28.4827,
          lng: -16.3415,
        },
        {
          id: "BIO",
          name: "Bilbao",
          city: "Bilbao",
          country: "España",
          lat: 43.3011,
          lng: -2.9106,
        },
        {
          id: "ACE",
          name: "César Manrique-Lanzarote",
          city: "Lanzarote",
          country: "España",
          lat: 28.9455,
          lng: -13.6052,
        },
        {
          id: "LPA",
          name: "Gran Canaria",
          city: "Gran Canaria",
          country: "España",
          lat: 27.9319,
          lng: -15.3866,
        },
        {
          id: "FUE",
          name: "Fuerteventura",
          city: "Fuerteventura",
          country: "España",
          lat: 28.4527,
          lng: -13.8638,
        },
        {
          id: "SCQ",
          name: "Santiago-Rosalía de Castro",
          city: "Santiago",
          country: "España",
          lat: 42.8963,
          lng: -8.4151,
        },
        {
          id: "IBZ",
          name: "Ibiza",
          city: "Ibiza",
          country: "España",
          lat: 38.8729,
          lng: 1.3731,
        },
        {
          id: "MAH",
          name: "Menorca",
          city: "Menorca",
          country: "España",
          lat: 39.8626,
          lng: 4.2186,
        },
        {
          id: "VGO",
          name: "Vigo",
          city: "Vigo",
          country: "España",
          lat: 42.2318,
          lng: -8.6268,
        },
        {
          id: "LCG",
          name: "A Coruña",
          city: "A Coruña",
          country: "España",
          lat: 43.3021,
          lng: -8.3773,
        },
        {
          id: "OVD",
          name: "Asturias",
          city: "Oviedo",
          country: "España",
          lat: 43.5636,
          lng: -6.0346,
        },
        {
          id: "SDR",
          name: "Santander",
          city: "Santander",
          country: "España",
          lat: 43.4271,
          lng: -3.82,
        },
        {
          id: "GRX",
          name: "Federico García Lorca Granada-Jaén",
          city: "Granada",
          country: "España",
          lat: 37.1887,
          lng: -3.7774,
        },
        {
          id: "XRY",
          name: "Jerez",
          city: "Jerez",
          country: "España",
          lat: 36.7446,
          lng: -6.0601,
        },
        {
          id: "VLL",
          name: "Valladolid",
          city: "Valladolid",
          country: "España",
          lat: 41.7061,
          lng: -4.8519,
        },
        {
          id: "ZAZ",
          name: "Zaragoza",
          city: "Zaragoza",
          country: "España",
          lat: 41.6662,
          lng: -1.0416,
        },
        {
          id: "PNA",
          name: "Pamplona",
          city: "Pamplona",
          country: "España",
          lat: 42.77,
          lng: -1.6464,
        },
        {
          id: "LEI",
          name: "Almería",
          city: "Almería",
          country: "España",
          lat: 36.8439,
          lng: -2.3701,
        },
        {
          id: "BJZ",
          name: "Badajoz",
          city: "Badajoz",
          country: "España",
          lat: 38.8913,
          lng: -6.8213,
        },
        {
          id: "EAS",
          name: "San Sebastián",
          city: "San Sebastián",
          country: "España",
          lat: 43.3564,
          lng: -1.7906,
        },
        {
          id: "VIT",
          name: "Vitoria",
          city: "Vitoria",
          country: "España",
          lat: 42.8828,
          lng: -2.7245,
        },
        {
          id: "LEN",
          name: "León",
          city: "León",
          country: "España",
          lat: 42.589,
          lng: -5.6553,
        },
        {
          id: "RJL",
          name: "Logroño-Agoncillo",
          city: "Logroño",
          country: "España",
          lat: 42.4626,
          lng: -2.3232,
        },
        {
          id: "HSK",
          name: "Huesca-Pirineos",
          city: "Huesca",
          country: "España",
          lat: 42.0809,
          lng: -0.3227,
        },
        // --- EUROPA (Top 3 por País) ---
        // Portugal
        {
          id: "LIS",
          name: "Humberto Delgado",
          city: "Lisboa",
          country: "Portugal",
          lat: 38.7813,
          lng: -9.1359,
        },
        {
          id: "OPO",
          name: "Francisco Sá Carneiro",
          city: "Oporto",
          country: "Portugal",
          lat: 41.2481,
          lng: -8.6814,
        },
        {
          id: "FAO",
          name: "Faro",
          city: "Faro",
          country: "Portugal",
          lat: 37.0144,
          lng: -7.9659,
        },
        // Francia
        {
          id: "CDG",
          name: "París-Charles de Gaulle",
          city: "París",
          country: "Francia",
          lat: 49.0097,
          lng: 2.5479,
        },
        {
          id: "ORY",
          name: "París-Orly",
          city: "París",
          country: "Francia",
          lat: 48.7262,
          lng: 2.3652,
        },
        {
          id: "NCE",
          name: "Niza-Costa Azul",
          city: "Niza",
          country: "Francia",
          lat: 43.6653,
          lng: 7.215,
        },
        // Alemania
        {
          id: "FRA",
          name: "Fráncfort del Meno",
          city: "Fráncfort",
          country: "Alemania",
          lat: 50.0333,
          lng: 8.5705,
        },
        {
          id: "MUC",
          name: "Múnich",
          city: "Múnich",
          country: "Alemania",
          lat: 48.3537,
          lng: 11.7861,
        },
        {
          id: "BER",
          name: "Berlín-Brandeburgo",
          city: "Berlín",
          country: "Alemania",
          lat: 52.3667,
          lng: 13.5033,
        },
        // Reino Unido
        {
          id: "LHR",
          name: "Londres-Heathrow",
          city: "Londres",
          country: "Reino Unido",
          lat: 51.47,
          lng: -0.4543,
        },
        {
          id: "LGW",
          name: "Londres-Gatwick",
          city: "Londres",
          country: "Reino Unido",
          lat: 51.1481,
          lng: -0.1903,
        },
        {
          id: "MAN",
          name: "Manchester",
          city: "Manchester",
          country: "Reino Unido",
          lat: 53.3537,
          lng: -2.275,
        },
        // Italia
        {
          id: "FCO",
          name: "Roma-Fiumicino",
          city: "Roma",
          country: "Italia",
          lat: 41.8003,
          lng: 12.2389,
        },
        {
          id: "MXP",
          name: "Milán-Malpensa",
          city: "Milán",
          country: "Italia",
          lat: 45.63,
          lng: 8.7231,
        },
        {
          id: "VCE",
          name: "Venecia-Marco Polo",
          city: "Venecia",
          country: "Italia",
          lat: 45.5053,
          lng: 12.3519,
        },
        // Países Bajos
        {
          id: "AMS",
          name: "Ámsterdam-Schiphol",
          city: "Ámsterdam",
          country: "Países Bajos",
          lat: 52.3086,
          lng: 4.7639,
        },
        {
          id: "EIN",
          name: "Eindhoven",
          city: "Eindhoven",
          country: "Países Bajos",
          lat: 51.4589,
          lng: 5.3922,
        },
        {
          id: "RTM",
          name: "Róterdam-La Haya",
          city: "Róterdam",
          country: "Países Bajos",
          lat: 51.9569,
          lng: 4.4372,
        },
        // Suiza
        {
          id: "ZRH",
          name: "Zúrich",
          city: "Zúrich",
          country: "Suiza",
          lat: 47.4581,
          lng: 8.5481,
        },
        {
          id: "GVA",
          name: "Ginebra",
          city: "Ginebra",
          country: "Suiza",
          lat: 46.2381,
          lng: 6.1089,
        },
        {
          id: "BSL",
          name: "Basilea-Mulhouse-Friburgo",
          city: "Basilea",
          country: "Suiza",
          lat: 47.59,
          lng: 7.5292,
        },
        // Irlanda
        {
          id: "DUB",
          name: "Dublín",
          city: "Dublín",
          country: "Irlanda",
          lat: 53.4214,
          lng: -6.27,
        },
        {
          id: "ORK",
          name: "Cork",
          city: "Cork",
          country: "Irlanda",
          lat: 51.8413,
          lng: -8.4911,
        },
        {
          id: "SNN",
          name: "Shannon",
          city: "Shannon",
          country: "Irlanda",
          lat: 52.7019,
          lng: -8.9247,
        },
        // Bélgica
        {
          id: "BRU",
          name: "Bruselas-Zaventem",
          city: "Bruselas",
          country: "Bélgica",
          lat: 50.9014,
          lng: 4.4844,
        },
        {
          id: "CRL",
          name: "Bruselas Sur Charleroi",
          city: "Charleroi",
          country: "Bélgica",
          lat: 50.4592,
          lng: 4.4538,
        },
        {
          id: "OST",
          name: "Ostende-Brujas",
          city: "Ostende",
          country: "Bélgica",
          lat: 51.1989,
          lng: 2.8622,
        },
        // Austria
        {
          id: "VIE",
          name: "Viena-Schwechat",
          city: "Viena",
          country: "Austria",
          lat: 48.1103,
          lng: 16.5697,
        },
        {
          id: "SZG",
          name: "Salzburgo-W.A. Mozart",
          city: "Salzburgo",
          country: "Austria",
          lat: 47.7933,
          lng: 13.0044,
        },
        {
          id: "INN",
          name: "Innsbruck",
          city: "Innsbruck",
          country: "Austria",
          lat: 47.2603,
          lng: 11.3439,
        },
        // Grecia
        {
          id: "ATH",
          name: "Atenas-Eleftherios Venizelos",
          city: "Atenas",
          country: "Grecia",
          lat: 37.9364,
          lng: 23.9445,
        },
        {
          id: "HER",
          name: "Heraclión-Nikos Kazantzakis",
          city: "Creta",
          country: "Grecia",
          lat: 35.3397,
          lng: 25.1803,
        },
        {
          id: "SKG",
          name: "Tesalónica",
          city: "Tesalónica",
          country: "Grecia",
          lat: 40.5197,
          lng: 22.9708,
        },
        // Noruega
        {
          id: "OSL",
          name: "Oslo-Gardermoen",
          city: "Oslo",
          country: "Noruega",
          lat: 60.1975,
          lng: 11.1004,
        },
        {
          id: "BGO",
          name: "Bergen-Flesland",
          city: "Bergen",
          country: "Noruega",
          lat: 60.2933,
          lng: 5.2181,
        },
        {
          id: "SVG",
          name: "Stavanger-Sola",
          city: "Stavanger",
          country: "Noruega",
          lat: 58.8767,
          lng: 5.6378,
        },
        // Suecia
        {
          id: "ARN",
          name: "Estocolmo-Arlanda",
          city: "Estocolmo",
          country: "Suecia",
          lat: 59.6519,
          lng: 17.9186,
        },
        {
          id: "GOT",
          name: "Gotemburgo-Landvetter",
          city: "Gotemburgo",
          country: "Suecia",
          lat: 57.6628,
          lng: 12.2797,
        },
        {
          id: "BMA",
          name: "Estocolmo-Bromma",
          city: "Estocolmo",
          country: "Suecia",
          lat: 59.3544,
          lng: 17.9417,
        },
        // Dinamarca
        {
          id: "CPH",
          name: "Copenhague-Kastrup",
          city: "Copenhague",
          country: "Dinamarca",
          lat: 55.618,
          lng: 12.6508,
        },
        {
          id: "BLL",
          name: "Billund",
          city: "Billund",
          country: "Dinamarca",
          lat: 55.7403,
          lng: 9.1517,
        },
        {
          id: "AAL",
          name: "Aalborg",
          city: "Aalborg",
          country: "Dinamarca",
          lat: 57.0928,
          lng: 9.8492,
        },
        // Finlandia
        {
          id: "HEL",
          name: "Helsinki-Vantaa",
          city: "Helsinki",
          country: "Finlandia",
          lat: 60.3172,
          lng: 24.9633,
        },
        {
          id: "OUL",
          name: "Oulu",
          city: "Oulu",
          country: "Finlandia",
          lat: 64.93,
          lng: 25.355,
        },
        {
          id: "RVN",
          name: "Rovaniemi",
          city: "Rovaniemi",
          country: "Finlandia",
          lat: 66.5647,
          lng: 25.8303,
        },
        // Polonia
        {
          id: "WAW",
          name: "Varsovia-Chopin",
          city: "Varsovia",
          country: "Polonia",
          lat: 52.1658,
          lng: 20.9671,
        },
        {
          id: "KRK",
          name: "Cracovia-Juan Pablo II",
          city: "Cracovia",
          country: "Polonia",
          lat: 50.0777,
          lng: 19.7847,
        },
        {
          id: "GDN",
          name: "Gdansk-Lech Walesa",
          city: "Gdansk",
          country: "Polonia",
          lat: 54.3775,
          lng: 18.4661,
        },
        // República Checa
        {
          id: "PRG",
          name: "Praga-Václav Havel",
          city: "Praga",
          country: "República Checa",
          lat: 50.1008,
          lng: 14.26,
        },
        {
          id: "BRQ",
          name: "Brno-Tuřany",
          city: "Brno",
          country: "República Checa",
          lat: 49.1514,
          lng: 16.6944,
        },
        {
          id: "OSR",
          name: "Ostrava-Leoš Janáček",
          city: "Ostrava",
          country: "República Checa",
          lat: 49.6961,
          lng: 18.1108,
        },
        // Hungría
        {
          id: "BUD",
          name: "Budapest-Ferenc Liszt",
          city: "Budapest",
          country: "Hungría",
          lat: 47.4369,
          lng: 19.2356,
        },
        {
          id: "DEB",
          name: "Debrecen",
          city: "Debrecen",
          country: "Hungría",
          lat: 47.4889,
          lng: 21.6153,
        },
        {
          id: "SOB",
          name: "Hévíz-Balaton",
          city: "Sármellék",
          country: "Hungría",
          lat: 46.6864,
          lng: 17.1592,
        },
        // Rumanía
        {
          id: "OTP",
          name: "Bucarest-Henri Coandă",
          city: "Bucarest",
          country: "Rumanía",
          lat: 44.5711,
          lng: 26.085,
        },
        {
          id: "CLJ",
          name: "Cluj-Napoca",
          city: "Cluj",
          country: "Rumanía",
          lat: 46.785,
          lng: 23.6861,
        },
        {
          id: "TSR",
          name: "Timisoara-Traian Vuia",
          city: "Timisoara",
          country: "Rumanía",
          lat: 45.8094,
          lng: 21.3378,
        },
        // Bulgaria
        {
          id: "SOF",
          name: "Sofía",
          city: "Sofía",
          country: "Bulgaria",
          lat: 42.6967,
          lng: 23.4114,
        },
        {
          id: "VAR",
          name: "Varna",
          city: "Varna",
          country: "Bulgaria",
          lat: 43.2322,
          lng: 27.825,
        },
        {
          id: "BOJ",
          name: "Burgas",
          city: "Burgas",
          country: "Bulgaria",
          lat: 42.5697,
          lng: 27.5153,
        },
        // Turquía (Parte Europea y Principales)
        {
          id: "IST",
          name: "Estambul",
          city: "Estambul",
          country: "Turquía",
          lat: 41.2753,
          lng: 28.7519,
        },
        {
          id: "SAW",
          name: "Estambul-Sabiha Gökçen",
          city: "Estambul",
          country: "Turquía",
          lat: 40.8986,
          lng: 29.3092,
        },
        {
          id: "AYT",
          name: "Antalya",
          city: "Antalya",
          country: "Turquía",
          lat: 36.8987,
          lng: 30.8005,
        },
        // Malta
        {
          id: "MLA",
          name: "Malta",
          city: "Luqa",
          country: "Malta",
          lat: 35.8575,
          lng: 14.4775,
        },
        // Chipre
        {
          id: "LCA",
          name: "Lárnaca",
          city: "Lárnaca",
          country: "Chipre",
          lat: 34.8789,
          lng: 33.6247,
        },
        {
          id: "PFO",
          name: "Pafos",
          city: "Pafos",
          country: "Chipre",
          lat: 34.7183,
          lng: 32.4858,
        },
        // Islandia
        {
          id: "KEF",
          name: "Keflavík",
          city: "Reykjavík",
          country: "Islandia",
          lat: 63.985,
          lng: -22.6056,
        },
        {
          id: "RKV",
          name: "Reykjavík",
          city: "Reykjavík",
          country: "Islandia",
          lat: 64.1294,
          lng: -21.9406,
        },
        {
          id: "AEY",
          name: "Akureyri",
          city: "Akureyri",
          country: "Islandia",
          lat: 65.66,
          lng: -18.0728,
        },
        // Luxemburgo
        {
          id: "LUX",
          name: "Luxemburgo-Findel",
          city: "Luxemburgo",
          country: "Luxemburgo",
          lat: 49.6233,
          lng: 6.2044,
        },
        // Croacia
        {
          id: "ZAG",
          name: "Zagreb",
          city: "Zagreb",
          country: "Croacia",
          lat: 45.7428,
          lng: 16.0689,
        },
        {
          id: "SPU",
          name: "Split",
          city: "Split",
          country: "Croacia",
          lat: 43.5389,
          lng: 16.2981,
        },
        {
          id: "DBV",
          name: "Dubrovnik",
          city: "Dubrovnik",
          country: "Croacia",
          lat: 42.5614,
          lng: 18.2681,
        },
        // Serbia
        {
          id: "BEG",
          name: "Belgrado-Nikola Tesla",
          city: "Belgrado",
          country: "Serbia",
          lat: 44.8184,
          lng: 20.3091,
        },
        // Eslovaquia
        {
          id: "BTS",
          name: "Bratislava-M.R. Štefánik",
          city: "Bratislava",
          country: "Eslovaquia",
          lat: 48.1703,
          lng: 17.2128,
        },
        // Eslovenia
        {
          id: "LJU",
          name: "Liubliana-Jože Pučnik",
          city: "Liubliana",
          country: "Eslovenia",
          lat: 46.2236,
          lng: 14.4575,
        },
        // Estonia
        {
          id: "TLL",
          name: "Tallin",
          city: "Tallin",
          country: "Estonia",
          lat: 59.4133,
          lng: 24.8328,
        },
        // Letonia
        {
          id: "RIX",
          name: "Riga",
          city: "Riga",
          country: "Letonia",
          lat: 56.9236,
          lng: 23.9711,
        },
        // Lituania
        {
          id: "VNO",
          name: "Vilna",
          city: "Vilna",
          country: "Lituania",
          lat: 54.6342,
          lng: 25.2858,
        },
      ],
    });
  } else if (airportCount < 20) {
    console.log(
      "Faltan aeropuertos, limpiando e insertando la lista completa...",
    );
    await prisma.flight.deleteMany();
    await prisma.airport.deleteMany();
    seed(); // Llamar recursivamente tras limpiar
    return;
  }
  const flightCount = await prisma.flight.count();
  if (flightCount === 0) {
    console.log("Seeding initial flights...");
    await prisma.flight.createMany({
      data: [
        {
          id: "IB3012",
          originId: "MAD",
          destinationId: "BCN",
          departureTime: "07:30",
          durationMinutes: 75,
        },
        {
          id: "IB3110",
          originId: "MAD",
          destinationId: "VLC",
          departureTime: "15:10",
          durationMinutes: 60,
        },
        {
          id: "FR7542",
          originId: "VLC",
          destinationId: "FCO",
          departureTime: "10:20",
          durationMinutes: 120,
        },
      ],
    });
  }
}

seed();

// --- AEROPUERTOS ---
app.get("/api/airports", async (req, res) => {
  const airports = await prisma.airport.findMany();
  res.json(airports);
});

app.post("/api/airports", async (req, res) => {
  try {
    const airport = await prisma.airport.create({ data: req.body });
    res.json(airport);
  } catch (error) {
    res.status(400).json({ error: "Error creating airport" });
  }
});

// --- VUELOS ---
app.get("/api/flights", async (req, res) => {
  const flights = await prisma.flight.findMany();
  res.json(flights);
});

app.post(
  "/api/flights",
  authenticateJWT,
  authorizeRole(["RESPONSABLE"]),
  async (req, res) => {
    try {
      const {
        id,
        originId,
        destinationId,
        departureTime,
        durationMinutes,
        isDaily,
        isActive,
        specificDate,
      } = req.body;
      const flight = await prisma.flight.create({
        data: {
          id,
          originId,
          destinationId,
          departureTime,
          durationMinutes,
          isDaily,
          isActive,
          specificDate,
        },
      });
      res.json(flight);
    } catch (error) {
      console.error(`Error al insertar vuelo ${req.body?.id}:`, error);
      res.status(400).json({ error: "Error creating flight" });
    }
  },
);

app.put(
  "/api/flights/:id",
  authenticateJWT,
  authorizeRole(["RESPONSABLE"]),
  async (req, res) => {
    const { id } = req.params;
    try {
      const flight = await prisma.flight.update({
        where: { id: id as string },
        data: {
          ...req.body,
          specificDate: req.body.specificDate,
        },
      });
      res.json(flight);
    } catch (error) {
      res.status(400).json({ error: "Error updating flight" });
    }
  },
);

app.delete(
  "/api/flights/:id",
  authenticateJWT,
  authorizeRole(["RESPONSABLE"]),
  async (req, res) => {
    const { id } = req.params;
    await prisma.flight.delete({ where: { id: id as string } });
    res.json({ success: true });
  },
);

// --- RESERVAS ---
app.get("/api/reservations", authenticateJWT, async (req: AuthRequest, res) => {
  try {
    // Limpiar suscripciones específicas que ya pasaron
    const todayDate = new Date().toLocaleDateString("sv-SE", {
      timeZone: process.env["TZ"] || "Europe/Madrid",
    });

    await prisma.reservation.deleteMany({
      where: {
        type: "SPECIFIC_DATE",
        specificDate: {
          lt: todayDate,
        },
      },
    });

    const reservations = await prisma.reservation.findMany({
      where: req.user?.role === "RESPONSABLE" ? {} : { userId: req.user?.id },
      include: { flight: { include: { origin: true, destination: true } } },
    });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: "Error fetching reservations" });
  }
});

app.post(
  "/api/reservations",
  authenticateJWT,
  async (req: AuthRequest, res) => {
    try {
      const { flightId, type, specificDate } = req.body;
      const userId = req.user?.id;

      if (!userId) return res.status(401).json({ error: "No autorizado" });

      // Verificar si ya existe
      const existing = await prisma.reservation.findFirst({
        where: { userId, flightId },
      });
      if (existing) {
        // En lugar de error, podemos actualizarla si cambia el tipo,
        // pero para mantenerlo simple, borramos la vieja y creamos la nueva
        await prisma.reservation.delete({ where: { id: existing.id } });
      }

      const reservation = await prisma.reservation.create({
        data: {
          userId,
          flightId,
          type: type || "DAILY",
          specificDate: type === "SPECIFIC_DATE" ? specificDate : null,
        },
      });
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ error: "Error creating reservation" });
    }
  },
);

app.delete(
  "/api/reservations/:id",
  authenticateJWT,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (req.user?.role !== "RESPONSABLE") {
        const resv = await prisma.reservation.findUnique({
          where: { id: id as string },
        });
        if (resv?.userId !== userId)
          return res.status(403).json({ error: "No autorizado" });
      }

      await prisma.reservation.delete({ where: { id: id as string } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Error deleting reservation" });
    }
  },
);

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
  startNotificationWorker();
});
