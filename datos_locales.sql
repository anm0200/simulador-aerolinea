--
-- PostgreSQL database dump
--

\restrict FzFLzhSxFlpbHCMKH59tf9nfafEGFhVWvkoctdEAWxqzYCcc9KHdKHIbWToIQeU

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Airport; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public."Airport" VALUES ('MAD', 'Adolfo Suárez Madrid-Barajas', 'Madrid', 'España', 40.4936, -3.5668);
INSERT INTO public."Airport" VALUES ('BCN', 'Josep Tarradellas Barcelona-El Prat', 'Barcelona', 'España', 41.2971, 2.0785);
INSERT INTO public."Airport" VALUES ('PMI', 'Palma de Mallorca', 'Palma', 'España', 39.5486, 2.7301);
INSERT INTO public."Airport" VALUES ('AGP', 'Málaga-Costa del Sol', 'Málaga', 'España', 36.6749, -4.4991);
INSERT INTO public."Airport" VALUES ('ALC', 'Alicante-Elche Miguel Hernández', 'Alicante', 'España', 38.2822, -0.5582);
INSERT INTO public."Airport" VALUES ('TFS', 'Tenerife Sur', 'Tenerife', 'España', 28.0445, -16.5725);
INSERT INTO public."Airport" VALUES ('VLC', 'Valencia', 'Valencia', 'España', 39.4893, -0.4816);
INSERT INTO public."Airport" VALUES ('SVQ', 'Sevilla', 'Sevilla', 'España', 37.418, -5.8931);
INSERT INTO public."Airport" VALUES ('TFN', 'Tenerife Norte-C. La Laguna', 'Tenerife', 'España', 28.4827, -16.3415);
INSERT INTO public."Airport" VALUES ('BIO', 'Bilbao', 'Bilbao', 'España', 43.3011, -2.9106);
INSERT INTO public."Airport" VALUES ('ACE', 'César Manrique-Lanzarote', 'Lanzarote', 'España', 28.9455, -13.6052);
INSERT INTO public."Airport" VALUES ('LPA', 'Gran Canaria', 'Gran Canaria', 'España', 27.9319, -15.3866);
INSERT INTO public."Airport" VALUES ('FUE', 'Fuerteventura', 'Fuerteventura', 'España', 28.4527, -13.8638);
INSERT INTO public."Airport" VALUES ('SCQ', 'Santiago-Rosalía de Castro', 'Santiago', 'España', 42.8963, -8.4151);
INSERT INTO public."Airport" VALUES ('IBZ', 'Ibiza', 'Ibiza', 'España', 38.8729, 1.3731);
INSERT INTO public."Airport" VALUES ('MAH', 'Menorca', 'Menorca', 'España', 39.8626, 4.2186);
INSERT INTO public."Airport" VALUES ('VGO', 'Vigo', 'Vigo', 'España', 42.2318, -8.6268);
INSERT INTO public."Airport" VALUES ('LCG', 'A Coruña', 'A Coruña', 'España', 43.3021, -8.3773);
INSERT INTO public."Airport" VALUES ('OVD', 'Asturias', 'Oviedo', 'España', 43.5636, -6.0346);
INSERT INTO public."Airport" VALUES ('SDR', 'Santander', 'Santander', 'España', 43.4271, -3.82);
INSERT INTO public."Airport" VALUES ('GRX', 'Federico García Lorca Granada-Jaén', 'Granada', 'España', 37.1887, -3.7774);
INSERT INTO public."Airport" VALUES ('XRY', 'Jerez', 'Jerez', 'España', 36.7446, -6.0601);
INSERT INTO public."Airport" VALUES ('VLL', 'Valladolid', 'Valladolid', 'España', 41.7061, -4.8519);
INSERT INTO public."Airport" VALUES ('ZAZ', 'Zaragoza', 'Zaragoza', 'España', 41.6662, -1.0416);
INSERT INTO public."Airport" VALUES ('PNA', 'Pamplona', 'Pamplona', 'España', 42.77, -1.6464);
INSERT INTO public."Airport" VALUES ('LEI', 'Almería', 'Almería', 'España', 36.8439, -2.3701);
INSERT INTO public."Airport" VALUES ('BJZ', 'Badajoz', 'Badajoz', 'España', 38.8913, -6.8213);
INSERT INTO public."Airport" VALUES ('EAS', 'San Sebastián', 'San Sebastián', 'España', 43.3564, -1.7906);
INSERT INTO public."Airport" VALUES ('VIT', 'Vitoria', 'Vitoria', 'España', 42.8828, -2.7245);
INSERT INTO public."Airport" VALUES ('LEN', 'León', 'León', 'España', 42.589, -5.6553);
INSERT INTO public."Airport" VALUES ('RJL', 'Logroño-Agoncillo', 'Logroño', 'España', 42.4626, -2.3232);
INSERT INTO public."Airport" VALUES ('HSK', 'Huesca-Pirineos', 'Huesca', 'España', 42.0809, -0.3227);
INSERT INTO public."Airport" VALUES ('LIS', 'Humberto Delgado', 'Lisboa', 'Portugal', 38.7813, -9.1359);
INSERT INTO public."Airport" VALUES ('OPO', 'Francisco Sá Carneiro', 'Oporto', 'Portugal', 41.2481, -8.6814);
INSERT INTO public."Airport" VALUES ('FAO', 'Faro', 'Faro', 'Portugal', 37.0144, -7.9659);
INSERT INTO public."Airport" VALUES ('CDG', 'París-Charles de Gaulle', 'París', 'Francia', 49.0097, 2.5479);
INSERT INTO public."Airport" VALUES ('ORY', 'París-Orly', 'París', 'Francia', 48.7262, 2.3652);
INSERT INTO public."Airport" VALUES ('NCE', 'Niza-Costa Azul', 'Niza', 'Francia', 43.6653, 7.215);
INSERT INTO public."Airport" VALUES ('FRA', 'Fráncfort del Meno', 'Fráncfort', 'Alemania', 50.0333, 8.5705);
INSERT INTO public."Airport" VALUES ('MUC', 'Múnich', 'Múnich', 'Alemania', 48.3537, 11.7861);
INSERT INTO public."Airport" VALUES ('BER', 'Berlín-Brandeburgo', 'Berlín', 'Alemania', 52.3667, 13.5033);
INSERT INTO public."Airport" VALUES ('LHR', 'Londres-Heathrow', 'Londres', 'Reino Unido', 51.47, -0.4543);
INSERT INTO public."Airport" VALUES ('LGW', 'Londres-Gatwick', 'Londres', 'Reino Unido', 51.1481, -0.1903);
INSERT INTO public."Airport" VALUES ('MAN', 'Manchester', 'Manchester', 'Reino Unido', 53.3537, -2.275);
INSERT INTO public."Airport" VALUES ('FCO', 'Roma-Fiumicino', 'Roma', 'Italia', 41.8003, 12.2389);
INSERT INTO public."Airport" VALUES ('MXP', 'Milán-Malpensa', 'Milán', 'Italia', 45.63, 8.7231);
INSERT INTO public."Airport" VALUES ('VCE', 'Venecia-Marco Polo', 'Venecia', 'Italia', 45.5053, 12.3519);
INSERT INTO public."Airport" VALUES ('AMS', 'Ámsterdam-Schiphol', 'Ámsterdam', 'Países Bajos', 52.3086, 4.7639);
INSERT INTO public."Airport" VALUES ('EIN', 'Eindhoven', 'Eindhoven', 'Países Bajos', 51.4589, 5.3922);
INSERT INTO public."Airport" VALUES ('RTM', 'Róterdam-La Haya', 'Róterdam', 'Países Bajos', 51.9569, 4.4372);
INSERT INTO public."Airport" VALUES ('ZRH', 'Zúrich', 'Zúrich', 'Suiza', 47.4581, 8.5481);
INSERT INTO public."Airport" VALUES ('GVA', 'Ginebra', 'Ginebra', 'Suiza', 46.2381, 6.1089);
INSERT INTO public."Airport" VALUES ('BSL', 'Basilea-Mulhouse-Friburgo', 'Basilea', 'Suiza', 47.59, 7.5292);
INSERT INTO public."Airport" VALUES ('DUB', 'Dublín', 'Dublín', 'Irlanda', 53.4214, -6.27);
INSERT INTO public."Airport" VALUES ('ORK', 'Cork', 'Cork', 'Irlanda', 51.8413, -8.4911);
INSERT INTO public."Airport" VALUES ('SNN', 'Shannon', 'Shannon', 'Irlanda', 52.7019, -8.9247);
INSERT INTO public."Airport" VALUES ('BRU', 'Bruselas-Zaventem', 'Bruselas', 'Bélgica', 50.9014, 4.4844);
INSERT INTO public."Airport" VALUES ('CRL', 'Bruselas Sur Charleroi', 'Charleroi', 'Bélgica', 50.4592, 4.4538);
INSERT INTO public."Airport" VALUES ('OST', 'Ostende-Brujas', 'Ostende', 'Bélgica', 51.1989, 2.8622);
INSERT INTO public."Airport" VALUES ('VIE', 'Viena-Schwechat', 'Viena', 'Austria', 48.1103, 16.5697);
INSERT INTO public."Airport" VALUES ('SZG', 'Salzburgo-W.A. Mozart', 'Salzburgo', 'Austria', 47.7933, 13.0044);
INSERT INTO public."Airport" VALUES ('INN', 'Innsbruck', 'Innsbruck', 'Austria', 47.2603, 11.3439);
INSERT INTO public."Airport" VALUES ('ATH', 'Atenas-Eleftherios Venizelos', 'Atenas', 'Grecia', 37.9364, 23.9445);
INSERT INTO public."Airport" VALUES ('HER', 'Heraclión-Nikos Kazantzakis', 'Creta', 'Grecia', 35.3397, 25.1803);
INSERT INTO public."Airport" VALUES ('SKG', 'Tesalónica', 'Tesalónica', 'Grecia', 40.5197, 22.9708);
INSERT INTO public."Airport" VALUES ('OSL', 'Oslo-Gardermoen', 'Oslo', 'Noruega', 60.1975, 11.1004);
INSERT INTO public."Airport" VALUES ('BGO', 'Bergen-Flesland', 'Bergen', 'Noruega', 60.2933, 5.2181);
INSERT INTO public."Airport" VALUES ('SVG', 'Stavanger-Sola', 'Stavanger', 'Noruega', 58.8767, 5.6378);
INSERT INTO public."Airport" VALUES ('ARN', 'Estocolmo-Arlanda', 'Estocolmo', 'Suecia', 59.6519, 17.9186);
INSERT INTO public."Airport" VALUES ('GOT', 'Gotemburgo-Landvetter', 'Gotemburgo', 'Suecia', 57.6628, 12.2797);
INSERT INTO public."Airport" VALUES ('BMA', 'Estocolmo-Bromma', 'Estocolmo', 'Suecia', 59.3544, 17.9417);
INSERT INTO public."Airport" VALUES ('CPH', 'Copenhague-Kastrup', 'Copenhague', 'Dinamarca', 55.618, 12.6508);
INSERT INTO public."Airport" VALUES ('BLL', 'Billund', 'Billund', 'Dinamarca', 55.7403, 9.1517);
INSERT INTO public."Airport" VALUES ('AAL', 'Aalborg', 'Aalborg', 'Dinamarca', 57.0928, 9.8492);
INSERT INTO public."Airport" VALUES ('HEL', 'Helsinki-Vantaa', 'Helsinki', 'Finlandia', 60.3172, 24.9633);
INSERT INTO public."Airport" VALUES ('OUL', 'Oulu', 'Oulu', 'Finlandia', 64.93, 25.355);
INSERT INTO public."Airport" VALUES ('RVN', 'Rovaniemi', 'Rovaniemi', 'Finlandia', 66.5647, 25.8303);
INSERT INTO public."Airport" VALUES ('WAW', 'Varsovia-Chopin', 'Varsovia', 'Polonia', 52.1658, 20.9671);
INSERT INTO public."Airport" VALUES ('KRK', 'Cracovia-Juan Pablo II', 'Cracovia', 'Polonia', 50.0777, 19.7847);
INSERT INTO public."Airport" VALUES ('GDN', 'Gdansk-Lech Walesa', 'Gdansk', 'Polonia', 54.3775, 18.4661);
INSERT INTO public."Airport" VALUES ('PRG', 'Praga-Václav Havel', 'Praga', 'República Checa', 50.1008, 14.26);
INSERT INTO public."Airport" VALUES ('BRQ', 'Brno-Tuřany', 'Brno', 'República Checa', 49.1514, 16.6944);
INSERT INTO public."Airport" VALUES ('OSR', 'Ostrava-Leoš Janáček', 'Ostrava', 'República Checa', 49.6961, 18.1108);
INSERT INTO public."Airport" VALUES ('BUD', 'Budapest-Ferenc Liszt', 'Budapest', 'Hungría', 47.4369, 19.2356);
INSERT INTO public."Airport" VALUES ('DEB', 'Debrecen', 'Debrecen', 'Hungría', 47.4889, 21.6153);
INSERT INTO public."Airport" VALUES ('SOB', 'Hévíz-Balaton', 'Sármellék', 'Hungría', 46.6864, 17.1592);
INSERT INTO public."Airport" VALUES ('OTP', 'Bucarest-Henri Coandă', 'Bucarest', 'Rumanía', 44.5711, 26.085);
INSERT INTO public."Airport" VALUES ('CLJ', 'Cluj-Napoca', 'Cluj', 'Rumanía', 46.785, 23.6861);
INSERT INTO public."Airport" VALUES ('TSR', 'Timisoara-Traian Vuia', 'Timisoara', 'Rumanía', 45.8094, 21.3378);
INSERT INTO public."Airport" VALUES ('SOF', 'Sofía', 'Sofía', 'Bulgaria', 42.6967, 23.4114);
INSERT INTO public."Airport" VALUES ('VAR', 'Varna', 'Varna', 'Bulgaria', 43.2322, 27.825);
INSERT INTO public."Airport" VALUES ('BOJ', 'Burgas', 'Burgas', 'Bulgaria', 42.5697, 27.5153);
INSERT INTO public."Airport" VALUES ('IST', 'Estambul', 'Estambul', 'Turquía', 41.2753, 28.7519);
INSERT INTO public."Airport" VALUES ('SAW', 'Estambul-Sabiha Gökçen', 'Estambul', 'Turquía', 40.8986, 29.3092);
INSERT INTO public."Airport" VALUES ('AYT', 'Antalya', 'Antalya', 'Turquía', 36.8987, 30.8005);
INSERT INTO public."Airport" VALUES ('MLA', 'Malta', 'Luqa', 'Malta', 35.8575, 14.4775);
INSERT INTO public."Airport" VALUES ('LCA', 'Lárnaca', 'Lárnaca', 'Chipre', 34.8789, 33.6247);
INSERT INTO public."Airport" VALUES ('PFO', 'Pafos', 'Pafos', 'Chipre', 34.7183, 32.4858);
INSERT INTO public."Airport" VALUES ('KEF', 'Keflavík', 'Reykjavík', 'Islandia', 63.985, -22.6056);
INSERT INTO public."Airport" VALUES ('RKV', 'Reykjavík', 'Reykjavík', 'Islandia', 64.1294, -21.9406);
INSERT INTO public."Airport" VALUES ('AEY', 'Akureyri', 'Akureyri', 'Islandia', 65.66, -18.0728);
INSERT INTO public."Airport" VALUES ('LUX', 'Luxemburgo-Findel', 'Luxemburgo', 'Luxemburgo', 49.6233, 6.2044);
INSERT INTO public."Airport" VALUES ('ZAG', 'Zagreb', 'Zagreb', 'Croacia', 45.7428, 16.0689);
INSERT INTO public."Airport" VALUES ('SPU', 'Split', 'Split', 'Croacia', 43.5389, 16.2981);
INSERT INTO public."Airport" VALUES ('DBV', 'Dubrovnik', 'Dubrovnik', 'Croacia', 42.5614, 18.2681);
INSERT INTO public."Airport" VALUES ('BEG', 'Belgrado-Nikola Tesla', 'Belgrado', 'Serbia', 44.8184, 20.3091);
INSERT INTO public."Airport" VALUES ('BTS', 'Bratislava-M.R. Štefánik', 'Bratislava', 'Eslovaquia', 48.1703, 17.2128);
INSERT INTO public."Airport" VALUES ('LJU', 'Liubliana-Jože Pučnik', 'Liubliana', 'Eslovenia', 46.2236, 14.4575);
INSERT INTO public."Airport" VALUES ('TLL', 'Tallin', 'Tallin', 'Estonia', 59.4133, 24.8328);
INSERT INTO public."Airport" VALUES ('RIX', 'Riga', 'Riga', 'Letonia', 56.9236, 23.9711);
INSERT INTO public."Airport" VALUES ('VNO', 'Vilna', 'Vilna', 'Lituania', 54.6342, 25.2858);


--
-- Data for Name: Flight; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public."Flight" VALUES ('IB9999', 'MAD', 'BCN', '23:00', 76, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB2349', 'TFS', 'ALC', '12:00', 195, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3014', 'MAD', 'BCN', '09:00', 75, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3830', 'MAD', 'PMI', '11:45', 85, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3910', 'MAD', 'LPA', '13:30', 175, true, true, NULL);
INSERT INTO public."Flight" VALUES ('UX4021', 'AGP', 'MAD', '10:30', 65, true, true, NULL);
INSERT INTO public."Flight" VALUES ('UX9050', 'TFN', 'MAD', '07:00', 170, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3710', 'MAD', 'BIO', '08:00', 65, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3324', 'MAD', 'SVQ', '12:45', 65, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3512', 'MAD', 'ALC', '14:20', 65, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3410', 'MAD', 'SCQ', '18:15', 75, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3212', 'MAD', 'OVD', '16:30', 70, true, true, NULL);
INSERT INTO public."Flight" VALUES ('UX5012', 'MAD', 'VGO', '09:40', 75, true, true, NULL);
INSERT INTO public."Flight" VALUES ('UX5112', 'MAD', 'LCG', '20:10', 75, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3610', 'MAD', 'GRX', '10:00', 65, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3624', 'MAD', 'XRY', '13:15', 70, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3990', 'MAD', 'ACE', '17:00', 170, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3980', 'MAD', 'FUE', '08:30', 175, true, true, NULL);
INSERT INTO public."Flight" VALUES ('YW8012', 'MAD', 'VLL', '12:00', 50, true, true, NULL);
INSERT INTO public."Flight" VALUES ('YW8024', 'MAD', 'SDR', '19:45', 65, true, true, NULL);
INSERT INTO public."Flight" VALUES ('YW8036', 'MAD', 'PNA', '07:45', 60, true, true, NULL);
INSERT INTO public."Flight" VALUES ('YW8048', 'MAD', 'ZAZ', '21:00', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('YW8060', 'MAD', 'LEI', '11:10', 75, true, true, NULL);
INSERT INTO public."Flight" VALUES ('YW8072', 'MAD', 'BJZ', '16:00', 70, true, true, NULL);
INSERT INTO public."Flight" VALUES ('YW8084', 'MAD', 'EAS', '13:45', 75, true, true, NULL);
INSERT INTO public."Flight" VALUES ('YW8096', 'MAD', 'VIT', '10:20', 60, true, true, NULL);
INSERT INTO public."Flight" VALUES ('YW8108', 'MAD', 'LEN', '14:50', 65, true, true, NULL);
INSERT INTO public."Flight" VALUES ('YW8120', 'MAD', 'RJL', '09:15', 65, true, true, NULL);
INSERT INTO public."Flight" VALUES ('YW8132', 'MAD', 'HSK', '15:30', 70, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY1022', 'BCN', 'MAD', '08:15', 80, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY2214', 'BCN', 'SVQ', '09:20', 95, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY1512', 'BCN', 'BIO', '12:00', 70, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY3910', 'BCN', 'PMI', '10:45', 50, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY3240', 'BCN', 'IBZ', '14:30', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY3324', 'BCN', 'MAH', '16:20', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY3512', 'BCN', 'AGP', '07:45', 95, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY3610', 'BCN', 'ALC', '19:10', 70, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3102', 'MAD', 'LIS', '08:45', 80, true, true, NULL);
INSERT INTO public."Flight" VALUES ('AF1101', 'MAD', 'CDG', '10:15', 125, true, true, NULL);
INSERT INTO public."Flight" VALUES ('BA457', 'MAD', 'LHR', '12:50', 145, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LH1801', 'MAD', 'FRA', '09:30', 155, true, true, NULL);
INSERT INTO public."Flight" VALUES ('KL1702', 'MAD', 'AMS', '13:05', 150, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LX2021', 'MAD', 'ZRH', '14:50', 135, true, true, NULL);
INSERT INTO public."Flight" VALUES ('AZ120', 'MAD', 'FCO', '16:20', 145, true, true, NULL);
INSERT INTO public."Flight" VALUES ('TK1854', 'MAD', 'IST', '12:10', 260, true, true, NULL);
INSERT INTO public."Flight" VALUES ('OS451', 'VIE', 'MAD', '10:00', 190, true, true, NULL);
INSERT INTO public."Flight" VALUES ('SN3812', 'BRU', 'MAD', '08:30', 145, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY6101', 'BCN', 'ORY', '07:00', 110, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LH1812', 'BCN', 'MUC', '11:20', 125, true, true, NULL);
INSERT INTO public."Flight" VALUES ('FR2034', 'AGP', 'LHR', '18:15', 170, true, true, NULL);
INSERT INTO public."Flight" VALUES ('U21512', 'ALC', 'LGW', '20:30', 155, true, true, NULL);
INSERT INTO public."Flight" VALUES ('AF1540', 'CDG', 'BER', '09:10', 105, true, true, NULL);
INSERT INTO public."Flight" VALUES ('AF1212', 'CDG', 'LHR', '14:45', 75, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LH2032', 'FRA', 'ATH', '13:20', 170, true, true, NULL);
INSERT INTO public."Flight" VALUES ('BA780', 'LHR', 'CPH', '11:15', 110, true, true, NULL);
INSERT INTO public."Flight" VALUES ('KL1212', 'AMS', 'LHR', '08:00', 70, true, true, NULL);
INSERT INTO public."Flight" VALUES ('SK1420', 'CPH', 'OSL', '10:30', 70, true, true, NULL);
INSERT INTO public."Flight" VALUES ('SK1520', 'OSL', 'ARN', '12:45', 60, true, true, NULL);
INSERT INTO public."Flight" VALUES ('AY1212', 'HEL', 'ARN', '09:30', 60, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LO1212', 'WAW', 'FRA', '07:45', 110, true, true, NULL);
INSERT INTO public."Flight" VALUES ('OK1212', 'PRG', 'CDG', '13:00', 105, true, true, NULL);
INSERT INTO public."Flight" VALUES ('RO1212', 'OTP', 'FRA', '08:15', 150, true, true, NULL);
INSERT INTO public."Flight" VALUES ('JU1212', 'BEG', 'VIE', '11:40', 75, true, true, NULL);
INSERT INTO public."Flight" VALUES ('DY1212', 'BGO', 'OSL', '07:15', 50, true, true, NULL);
INSERT INTO public."Flight" VALUES ('DY1312', 'SVG', 'OSL', '08:30', 50, true, true, NULL);
INSERT INTO public."Flight" VALUES ('SK1612', 'GOT', 'ARN', '09:45', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('SK1712', 'BMA', 'GOT', '14:20', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('WF1212', 'BLL', 'CPH', '07:00', 45, true, true, NULL);
INSERT INTO public."Flight" VALUES ('WF1312', 'AAL', 'CPH', '08:15', 45, true, true, NULL);
INSERT INTO public."Flight" VALUES ('AY1412', 'OUL', 'HEL', '10:30', 65, true, true, NULL);
INSERT INTO public."Flight" VALUES ('AY1512', 'RVN', 'HEL', '16:00', 80, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LO1412', 'KRK', 'WAW', '07:30', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LO1512', 'GDN', 'WAW', '09:00', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('QS1212', 'BRQ', 'PRG', '12:00', 45, true, true, NULL);
INSERT INTO public."Flight" VALUES ('QS1312', 'OSR', 'PRG', '15:30', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('W61212', 'DEB', 'BUD', '08:45', 45, true, true, NULL);
INSERT INTO public."Flight" VALUES ('W61312', 'SOB', 'BUD', '17:15', 45, true, true, NULL);
INSERT INTO public."Flight" VALUES ('RO1412', 'CLJ', 'OTP', '07:00', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('RO1512', 'TSR', 'OTP', '09:30', 60, true, true, NULL);
INSERT INTO public."Flight" VALUES ('FB1212', 'VAR', 'SOF', '08:00', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('FB1312', 'BOJ', 'SOF', '16:45', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('PC1212', 'SAW', 'AYT', '10:15', 80, true, true, NULL);
INSERT INTO public."Flight" VALUES ('PC1312', 'IST', 'AYT', '13:45', 85, true, true, NULL);
INSERT INTO public."Flight" VALUES ('KM1212', 'MLA', 'FCO', '08:00', 85, true, true, NULL);
INSERT INTO public."Flight" VALUES ('CY1212', 'LCA', 'ATH', '11:00', 100, true, true, NULL);
INSERT INTO public."Flight" VALUES ('CY1312', 'PFO', 'ATH', '14:30', 100, true, true, NULL);
INSERT INTO public."Flight" VALUES ('FI1212', 'RKV', 'KEF', '07:00', 40, true, true, NULL);
INSERT INTO public."Flight" VALUES ('FI1312', 'AEY', 'KEF', '15:20', 50, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LG1212', 'LUX', 'CDG', '09:00', 60, true, true, NULL);
INSERT INTO public."Flight" VALUES ('OU1212', 'SPU', 'ZAG', '08:15', 45, true, true, NULL);
INSERT INTO public."Flight" VALUES ('OU1312', 'DBV', 'ZAG', '16:45', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('BT1212', 'RIX', 'TLL', '07:30', 50, true, true, NULL);
INSERT INTO public."Flight" VALUES ('BT1312', 'RIX', 'VNO', '19:15', 50, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3012', 'MAD', 'BCN', '07:30', 75, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3110', 'MAD', 'VLC', '15:10', 60, true, true, NULL);
INSERT INTO public."Flight" VALUES ('FR7542', 'VLC', 'FCO', '10:20', 120, true, true, NULL);
INSERT INTO public."Flight" VALUES ('EN1212', 'OPO', 'LIS', '08:00', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('EN1312', 'FAO', 'LIS', '17:30', 45, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY6122', 'AGP', 'CDG', '14:50', 155, true, true, NULL);
INSERT INTO public."Flight" VALUES ('UX1245', 'ALC', 'FRA', '09:15', 165, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY8843', 'SVQ', 'ORY', '18:30', 145, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB3244', 'MAD', 'FCO', '08:50', 145, true, true, NULL);
INSERT INTO public."Flight" VALUES ('EW6812', 'PMI', 'FRA', '11:00', 140, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY1234', 'BCN', 'LHR', '13:40', 135, true, true, NULL);
INSERT INTO public."Flight" VALUES ('U28102', 'CDG', 'NCE', '08:00', 90, true, true, NULL);
INSERT INTO public."Flight" VALUES ('FR1212', 'IBZ', 'MAD', '21:15', 75, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY3412', 'MAH', 'BCN', '10:30', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('AF1822', 'NCE', 'FCO', '12:00', 70, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LH1212', 'MUC', 'ZRH', '09:45', 55, true, true, NULL);
INSERT INTO public."Flight" VALUES ('BA1212', 'MAN', 'LHR', '07:15', 60, true, true, NULL);
INSERT INTO public."Flight" VALUES ('FR5512', 'VLC', 'LIS', '16:00', 95, true, true, NULL);
INSERT INTO public."Flight" VALUES ('VY1822', 'SVQ', 'VLC', '13:30', 75, true, true, NULL);
INSERT INTO public."Flight" VALUES ('UX1822', 'PMI', 'AGP', '15:10', 100, true, true, NULL);
INSERT INTO public."Flight" VALUES ('DY1102', 'OSL', 'BER', '08:45', 105, true, true, NULL);
INSERT INTO public."Flight" VALUES ('RO1234', 'OTP', 'BRU', '10:10', 180, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LO1345', 'WAW', 'CDG', '07:20', 145, true, true, NULL);
INSERT INTO public."Flight" VALUES ('OK1822', 'PRG', 'AMS', '14:00', 90, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LH2412', 'BUD', 'FRA', '11:30', 105, true, true, NULL);
INSERT INTO public."Flight" VALUES ('A31822', 'ATH', 'FCO', '09:15', 125, true, true, NULL);
INSERT INTO public."Flight" VALUES ('TP1452', 'LIS', 'CDG', '16:45', 155, true, true, NULL);
INSERT INTO public."Flight" VALUES ('BA1822', 'OPO', 'LHR', '13:10', 145, true, true, NULL);
INSERT INTO public."Flight" VALUES ('AY1822', 'HEL', 'FRA', '08:00', 165, true, true, NULL);
INSERT INTO public."Flight" VALUES ('SK1822', 'ARN', 'CPH', '15:30', 70, true, true, NULL);
INSERT INTO public."Flight" VALUES ('KL1822', 'AMS', 'ZRH', '17:45', 85, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LX1822', 'GVA', 'BCN', '10:50', 95, true, true, NULL);
INSERT INTO public."Flight" VALUES ('FR1822', 'CRL', 'MAD', '20:15', 145, true, true, NULL);
INSERT INTO public."Flight" VALUES ('EI1822', 'DUB', 'CDG', '12:30', 105, true, true, NULL);
INSERT INTO public."Flight" VALUES ('A31922', 'HER', 'ATH', '07:15', 50, true, true, NULL);
INSERT INTO public."Flight" VALUES ('FR3412', 'SKG', 'FCO', '14:20', 110, true, true, NULL);
INSERT INTO public."Flight" VALUES ('JU1822', 'BEG', 'CDG', '18:10', 155, true, true, NULL);
INSERT INTO public."Flight" VALUES ('BT1412', 'RIX', 'FRA', '09:00', 135, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LO1822', 'WAW', 'LHR', '11:45', 160, true, true, NULL);
INSERT INTO public."Flight" VALUES ('OS1822', 'VIE', 'ZRH', '13:00', 85, true, true, NULL);
INSERT INTO public."Flight" VALUES ('LX1922', 'ZRH', 'FCO', '15:30', 95, true, true, NULL);
INSERT INTO public."Flight" VALUES ('IB2345', 'MAD', 'BCN', '10:30', 76, true, true, NULL);


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public."User" VALUES ('de61cde3-cf5c-4d21-b777-e5d531bbbcf3', 'admin@flyradar.com', '$2b$10$QMwN4kK4mT6hinzG9Z1fZOgfuC1PNuBBaMBU780nwlYtuWrbrgAi.', 'Administrador Principal', 'RESPONSABLE', '2026-05-04 09:22:30.453', true, NULL, NULL);
INSERT INTO public."User" VALUES ('3ac13568-cd48-4362-a83d-760370eee95f', 'cliente@flyradar.com', '$2b$10$dSAYs78Uva5h987v8Nq6K.DIT7GXKaNDcOfsSULjVeRwg.yZY6yZu', 'Cliente de Prueba', 'CLIENTE', '2026-05-20 08:48:18.663', true, NULL, NULL);
INSERT INTO public."User" VALUES ('5544db74-6165-4c72-bc3b-bac8f41e2c8c', 'noreplymagicvs@gmail.com', '$2b$10$QA7QoLhCf2NaPXnNswR2S.3/hHsf07bENyOiiTcCLxnGt61OrS9bG', 'prueba', 'CLIENTE', '2026-05-30 03:02:40.08', true, NULL, NULL);
INSERT INTO public."User" VALUES ('4b3c9ea9-95b6-4231-bd2f-f521128edac1', 'martaaa6d2@gmail.com', '$2b$10$J8rDhfviQ6vgBDPcEMqA3OQR6h33bzhIHlwh2IyvpA5lf8gNWJ0zq', 'marta', 'CLIENTE', '2026-05-30 03:23:23.575', true, NULL, NULL);
INSERT INTO public."User" VALUES ('5c84b8d9-bfc6-4c6f-9368-f4e8eddf24d4', 'anm020@inlumine.ual.es', '$2b$10$buIpiZD9F687lJJmOhQIjeRkAmdIFuHEQfP/yhqwwf4UTpquf68Xe', 'pruebillas', 'CLIENTE', '2026-05-04 09:29:39.437', true, NULL, '118185483231461612881');
INSERT INTO public."User" VALUES ('1881acd3-11e0-48b1-96c9-c58f6e2f96fd', 'anieto436436@gmail.com', '$2b$10$I4vsrGtyvrzChj2RwdYeY.xtmEIsactH0PEj93nidz6kVyIYt1UUC', 'Antonio Rafael Nieto Mora', 'CLIENTE', '2026-05-04 09:25:06.083', true, NULL, '115751946796365470470');


--
-- Data for Name: Reservation; Type: TABLE DATA; Schema: public; Owner: user
--

INSERT INTO public."Reservation" VALUES ('e0d8ecb0-13dd-4ce2-9c1c-5431493b0812', '5c84b8d9-bfc6-4c6f-9368-f4e8eddf24d4', 'IB2349', '2026-05-04 09:53:36.76', NULL, 'DAILY');
INSERT INTO public."Reservation" VALUES ('4993a378-ac51-4284-bc6a-cd4638e2db65', '1881acd3-11e0-48b1-96c9-c58f6e2f96fd', 'IB9999', '2026-05-20 08:49:51.721', NULL, 'DAILY');
INSERT INTO public."Reservation" VALUES ('41801247-22ba-407e-b418-5d74de849fcd', '1881acd3-11e0-48b1-96c9-c58f6e2f96fd', 'UX4021', '2026-05-20 08:49:54.172', NULL, 'DAILY');
INSERT INTO public."Reservation" VALUES ('a311afbb-4671-4e2c-af56-36631393d44a', 'de61cde3-cf5c-4d21-b777-e5d531bbbcf3', 'IB3014', '2026-05-30 02:19:32.165', '2026-06-03', 'SPECIFIC_DATE');


--
-- Data for Name: RestrictedZone; Type: TABLE DATA; Schema: public; Owner: user
--



--
-- PostgreSQL database dump complete
--

\unrestrict FzFLzhSxFlpbHCMKH59tf9nfafEGFhVWvkoctdEAWxqzYCcc9KHdKHIbWToIQeU

