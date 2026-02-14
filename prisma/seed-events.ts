import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SeedEvent {
  eventNumber: number
  title: string
  sport: string
  eventDate: string // ISO date
  options: string[]
}

const EVENTS: SeedEvent[] = [
  {
    eventNumber: 1,
    title: 'AFL Premiership Winner',
    sport: 'AFL',
    eventDate: '2026-09-26',
    options: [
      'Adelaide Crows', 'Brisbane Lions', 'Carlton', 'Collingwood', 'Essendon',
      'Fremantle', 'Geelong Cats', 'Gold Coast Suns', 'GWS Giants', 'Hawthorn',
      'Melbourne', 'North Melbourne', 'Port Adelaide', 'Richmond', 'St Kilda',
      'Sydney Swans', 'West Coast Eagles', 'Western Bulldogs',
    ],
  },
  {
    eventNumber: 2,
    title: 'NRL Premiership Winner',
    sport: 'NRL',
    eventDate: '2026-10-04',
    options: [
      'Brisbane Broncos', 'Canberra Raiders', 'Canterbury Bulldogs', 'Cronulla Sharks',
      'Dolphins', 'Gold Coast Titans', 'Manly Sea Eagles', 'Melbourne Storm',
      'Newcastle Knights', 'New Zealand Warriors', 'North Queensland Cowboys',
      'Parramatta Eels', 'Penrith Panthers', 'South Sydney Rabbitohs',
      'St George Illawarra Dragons', 'Sydney Roosters', 'Wests Tigers',
    ],
  },
  {
    eventNumber: 3,
    title: "French Open Men's Singles",
    sport: 'Tennis',
    eventDate: '2026-06-07',
    options: [
      'Jannik Sinner', 'Carlos Alcaraz', 'Novak Djokovic', 'Alexander Zverev',
      'Daniil Medvedev', 'Andrey Rublev', 'Casper Ruud', 'Holger Rune',
      'Taylor Fritz', 'Stefanos Tsitsipas', 'Alex de Minaur', 'Tommy Paul',
      'Hubert Hurkacz', 'Ben Shelton', 'Frances Tiafoe', 'Other',
    ],
  },
  {
    eventNumber: 4,
    title: "French Open Women's Singles",
    sport: 'Tennis',
    eventDate: '2026-06-06',
    options: [
      'Aryna Sabalenka', 'Iga Swiatek', 'Coco Gauff', 'Elena Rybakina',
      'Jessica Pegula', 'Qinwen Zheng', 'Jasmine Paolini', 'Ons Jabeur',
      'Madison Keys', 'Mirra Andreeva', 'Emma Navarro', 'Barbora Krejcikova',
      'Daria Kasatkina', 'Anna Kalinskaya', 'Other',
    ],
  },
  {
    eventNumber: 5,
    title: "Wimbledon Men's Singles",
    sport: 'Tennis',
    eventDate: '2026-07-12',
    options: [
      'Jannik Sinner', 'Carlos Alcaraz', 'Novak Djokovic', 'Alexander Zverev',
      'Daniil Medvedev', 'Andrey Rublev', 'Casper Ruud', 'Holger Rune',
      'Taylor Fritz', 'Stefanos Tsitsipas', 'Alex de Minaur', 'Tommy Paul',
      'Hubert Hurkacz', 'Ben Shelton', 'Frances Tiafoe', 'Other',
    ],
  },
  {
    eventNumber: 6,
    title: "Wimbledon Women's Singles",
    sport: 'Tennis',
    eventDate: '2026-07-11',
    options: [
      'Aryna Sabalenka', 'Iga Swiatek', 'Coco Gauff', 'Elena Rybakina',
      'Jessica Pegula', 'Qinwen Zheng', 'Jasmine Paolini', 'Ons Jabeur',
      'Madison Keys', 'Mirra Andreeva', 'Emma Navarro', 'Barbora Krejcikova',
      'Daria Kasatkina', 'Anna Kalinskaya', 'Other',
    ],
  },
  {
    eventNumber: 7,
    title: "US Open Men's Singles",
    sport: 'Tennis',
    eventDate: '2026-09-13',
    options: [
      'Jannik Sinner', 'Carlos Alcaraz', 'Novak Djokovic', 'Alexander Zverev',
      'Daniil Medvedev', 'Andrey Rublev', 'Casper Ruud', 'Holger Rune',
      'Taylor Fritz', 'Stefanos Tsitsipas', 'Alex de Minaur', 'Tommy Paul',
      'Hubert Hurkacz', 'Ben Shelton', 'Frances Tiafoe', 'Other',
    ],
  },
  {
    eventNumber: 8,
    title: "US Open Women's Singles",
    sport: 'Tennis',
    eventDate: '2026-09-12',
    options: [
      'Aryna Sabalenka', 'Iga Swiatek', 'Coco Gauff', 'Elena Rybakina',
      'Jessica Pegula', 'Qinwen Zheng', 'Jasmine Paolini', 'Ons Jabeur',
      'Madison Keys', 'Mirra Andreeva', 'Emma Navarro', 'Barbora Krejcikova',
      'Daria Kasatkina', 'Anna Kalinskaya', 'Other',
    ],
  },
  {
    eventNumber: 9,
    title: 'The Masters Winner',
    sport: 'Golf',
    eventDate: '2026-04-12',
    options: [
      'Scottie Scheffler', 'Rory McIlroy', 'Jon Rahm', 'Xander Schauffele',
      'Collin Morikawa', 'Viktor Hovland', 'Ludvig Åberg', 'Wyndham Clark',
      'Patrick Cantlay', 'Brooks Koepka', 'Cameron Smith', 'Tommy Fleetwood',
      'Bryson DeChambeau', 'Hideki Matsuyama', 'Shane Lowry', 'Justin Thomas',
      'Jordan Spieth', 'Tiger Woods', 'Dustin Johnson', 'Other',
    ],
  },
  {
    eventNumber: 10,
    title: 'PGA Championship Winner',
    sport: 'Golf',
    eventDate: '2026-05-17',
    options: [
      'Scottie Scheffler', 'Rory McIlroy', 'Jon Rahm', 'Xander Schauffele',
      'Collin Morikawa', 'Viktor Hovland', 'Ludvig Åberg', 'Wyndham Clark',
      'Patrick Cantlay', 'Brooks Koepka', 'Cameron Smith', 'Tommy Fleetwood',
      'Bryson DeChambeau', 'Hideki Matsuyama', 'Shane Lowry', 'Justin Thomas',
      'Jordan Spieth', 'Tiger Woods', 'Dustin Johnson', 'Other',
    ],
  },
  {
    eventNumber: 11,
    title: 'US Open Winner',
    sport: 'Golf',
    eventDate: '2026-06-21',
    options: [
      'Scottie Scheffler', 'Rory McIlroy', 'Jon Rahm', 'Xander Schauffele',
      'Collin Morikawa', 'Viktor Hovland', 'Ludvig Åberg', 'Wyndham Clark',
      'Patrick Cantlay', 'Brooks Koepka', 'Cameron Smith', 'Tommy Fleetwood',
      'Bryson DeChambeau', 'Hideki Matsuyama', 'Shane Lowry', 'Justin Thomas',
      'Jordan Spieth', 'Tiger Woods', 'Dustin Johnson', 'Other',
    ],
  },
  {
    eventNumber: 12,
    title: 'The Open Championship Winner',
    sport: 'Golf',
    eventDate: '2026-07-19',
    options: [
      'Scottie Scheffler', 'Rory McIlroy', 'Jon Rahm', 'Xander Schauffele',
      'Collin Morikawa', 'Viktor Hovland', 'Ludvig Åberg', 'Wyndham Clark',
      'Patrick Cantlay', 'Brooks Koepka', 'Cameron Smith', 'Tommy Fleetwood',
      'Bryson DeChambeau', 'Hideki Matsuyama', 'Shane Lowry', 'Justin Thomas',
      'Jordan Spieth', 'Tiger Woods', 'Dustin Johnson', 'Other',
    ],
  },
  {
    eventNumber: 13,
    title: 'FIFA World Cup Winner',
    sport: 'Soccer',
    eventDate: '2026-07-19',
    options: [
      'Argentina', 'France', 'Brazil', 'England', 'Spain', 'Germany', 'Portugal',
      'Netherlands', 'Belgium', 'Italy', 'Croatia', 'Uruguay', 'Colombia',
      'Mexico', 'USA', 'Senegal', 'Japan', 'South Korea', 'Australia',
      'Denmark', 'Switzerland', 'Morocco', 'Ecuador', 'Canada', 'Wales',
      'Serbia', 'Poland', 'Cameroon', 'Ghana', 'Tunisia', 'Saudi Arabia',
      'Iran', 'Costa Rica', 'Peru', 'Chile', 'Nigeria', 'Egypt',
      'Algeria', 'Paraguay', 'Bolivia', 'Venezuela', 'Honduras',
      'Jamaica', 'Panama', 'Qatar', 'China', 'India', 'Other',
    ],
  },
  {
    eventNumber: 14,
    title: 'UEFA Champions League Winner',
    sport: 'Soccer',
    eventDate: '2026-05-30',
    options: [
      'Real Madrid', 'Manchester City', 'Bayern Munich', 'Barcelona', 'Liverpool',
      'Arsenal', 'Paris Saint-Germain', 'Inter Milan', 'AC Milan', 'Borussia Dortmund',
      'Atletico Madrid', 'Juventus', 'Napoli', 'Chelsea', 'Manchester United',
      'Tottenham Hotspur', 'Benfica', 'Porto', 'RB Leipzig', 'Atalanta',
      'Bayer Leverkusen', 'Aston Villa', 'Newcastle United', 'Other',
    ],
  },
  {
    eventNumber: 15,
    title: 'English Premier League Winner',
    sport: 'Soccer',
    eventDate: '2026-05-24',
    options: [
      'Arsenal', 'Manchester City', 'Liverpool', 'Chelsea', 'Manchester United',
      'Tottenham Hotspur', 'Newcastle United', 'Aston Villa', 'Brighton',
      'West Ham United', 'Crystal Palace', 'Brentford', 'Fulham',
      'Wolverhampton', 'Bournemouth', 'Nottingham Forest', 'Everton',
      'Leicester City', 'Ipswich Town', 'Southampton',
    ],
  },
  {
    eventNumber: 16,
    title: 'FA Cup Winner',
    sport: 'Soccer',
    eventDate: '2026-05-23',
    options: [
      'Arsenal', 'Manchester City', 'Liverpool', 'Chelsea', 'Manchester United',
      'Tottenham Hotspur', 'Newcastle United', 'Aston Villa', 'Brighton',
      'West Ham United', 'Crystal Palace', 'Brentford', 'Fulham',
      'Wolverhampton', 'Bournemouth', 'Nottingham Forest', 'Everton',
      'Leicester City', 'Ipswich Town', 'Southampton', 'Other',
    ],
  },
  {
    eventNumber: 17,
    title: "F1 World Drivers' Champion",
    sport: 'Motorsport',
    eventDate: '2026-12-06',
    options: [
      'Max Verstappen', 'Lewis Hamilton', 'Lando Norris', 'Charles Leclerc',
      'Carlos Sainz', 'George Russell', 'Oscar Piastri', 'Fernando Alonso',
      'Pierre Gasly', 'Esteban Ocon', 'Alex Albon', 'Daniel Ricciardo',
      'Yuki Tsunoda', 'Lance Stroll', 'Kevin Magnussen', 'Nico Hulkenberg',
      'Valtteri Bottas', 'Zhou Guanyu', 'Logan Sargeant', 'Other',
    ],
  },
  {
    eventNumber: 18,
    title: "F1 World Constructors' Champion",
    sport: 'Motorsport',
    eventDate: '2026-12-06',
    options: [
      'Red Bull Racing', 'Mercedes', 'Ferrari', 'McLaren', 'Aston Martin',
      'Alpine', 'Williams', 'AlphaTauri', 'Alfa Romeo', 'Haas',
    ],
  },
  {
    eventNumber: 19,
    title: 'Monaco Grand Prix Winner',
    sport: 'Motorsport',
    eventDate: '2026-05-24',
    options: [
      'Max Verstappen', 'Lewis Hamilton', 'Lando Norris', 'Charles Leclerc',
      'Carlos Sainz', 'George Russell', 'Oscar Piastri', 'Fernando Alonso',
      'Pierre Gasly', 'Esteban Ocon', 'Alex Albon', 'Daniel Ricciardo',
      'Yuki Tsunoda', 'Lance Stroll', 'Kevin Magnussen', 'Nico Hulkenberg',
      'Valtteri Bottas', 'Zhou Guanyu', 'Other',
    ],
  },
  {
    eventNumber: 20,
    title: 'Bathurst 1000 Winning Driver',
    sport: 'Motorsport',
    eventDate: '2026-10-11',
    options: [
      'Shane van Gisbergen', 'Chaz Mostert', 'Cameron Waters', 'Brodie Kostecki',
      'Will Brown', 'Broc Feeney', 'Anton De Pasquale', 'David Reynolds',
      'Mark Winterbottom', 'James Courtney', 'Nick Percat', 'Andre Heimgartner',
      'Thomas Randle', 'Will Davison', 'Jack Le Brocq', 'Tim Slade',
      'Matt Payne', 'Richie Stanaway', 'Other',
    ],
  },
  {
    eventNumber: 21,
    title: 'NBA Champion',
    sport: 'Basketball',
    eventDate: '2026-06-14',
    options: [
      'Boston Celtics', 'Denver Nuggets', 'Milwaukee Bucks', 'Phoenix Suns',
      'Philadelphia 76ers', 'Golden State Warriors', 'LA Lakers', 'LA Clippers',
      'Miami Heat', 'New York Knicks', 'Dallas Mavericks', 'Minnesota Timberwolves',
      'Oklahoma City Thunder', 'Sacramento Kings', 'Cleveland Cavaliers',
      'Indiana Pacers', 'Orlando Magic', 'New Orleans Pelicans',
      'Memphis Grizzlies', 'Houston Rockets', 'Other',
    ],
  },
  {
    eventNumber: 22,
    title: 'NBA Finals MVP',
    sport: 'Basketball',
    eventDate: '2026-06-14',
    options: [
      'Jayson Tatum', 'Nikola Jokic', 'Giannis Antetokounmpo', 'Luka Doncic',
      'Stephen Curry', 'LeBron James', 'Kevin Durant', 'Joel Embiid',
      'Shai Gilgeous-Alexander', 'Anthony Edwards', 'Jaylen Brown',
      'Jimmy Butler', 'Devin Booker', 'Kawhi Leonard', 'Anthony Davis',
      'Donovan Mitchell', 'Tyrese Haliburton', 'Other',
    ],
  },
  {
    eventNumber: 23,
    title: 'NBL Champion',
    sport: 'Basketball',
    eventDate: '2026-03-08',
    options: [
      'Melbourne United', 'Sydney Kings', 'Perth Wildcats', 'New Zealand Breakers',
      'Illawarra Hawks', 'Tasmania JackJumpers', 'Brisbane Bullets',
      'Adelaide 36ers', 'Cairns Taipans', 'South East Melbourne Phoenix',
    ],
  },
  {
    eventNumber: 24,
    title: 'Brownlow Medal Winner',
    sport: 'AFL',
    eventDate: '2026-09-21',
    options: [
      'Lachie Neale', 'Marcus Bontempelli', 'Patrick Cripps', 'Christian Petracca',
      'Clayton Oliver', 'Touk Miller', 'Zak Butters', 'Errol Gulden',
      'Josh Dunkley', 'Caleb Serong', 'Andrew Brayshaw', 'Tom Green',
      'Cameron Rayner', 'Nick Daicos', 'Chad Warner', 'Izak Rankine',
      'Sam Walsh', 'Matt Rowell', 'Other',
    ],
  },
  {
    eventNumber: 25,
    title: 'Norm Smith Medal Winner',
    sport: 'AFL',
    eventDate: '2026-09-26',
    options: [
      'Lachie Neale', 'Marcus Bontempelli', 'Patrick Cripps', 'Christian Petracca',
      'Clayton Oliver', 'Touk Miller', 'Zak Butters', 'Errol Gulden',
      'Nick Daicos', 'Chad Warner', 'Charlie Curnow', 'Jeremy Cameron',
      'Tom Stewart', 'Sam Walsh', 'Josh Dunkley', 'Caleb Serong',
      'Other',
    ],
  },
  {
    eventNumber: 26,
    title: 'Coleman Medal Winner',
    sport: 'AFL',
    eventDate: '2026-08-23',
    options: [
      'Charlie Curnow', 'Jeremy Cameron', 'Tom Lynch', 'Harry McKay',
      'Jesse Hogan', 'Mitch Lewis', 'Todd Marshall', 'Aaron Naughton',
      'Ben King', 'Tyson Stengle', 'Max King', 'Bailey Dale',
      'Jake Stringer', 'Jamarra Ugle-Hagan', 'Cody Weightman', 'Other',
    ],
  },
  {
    eventNumber: 27,
    title: 'AFL Wooden Spoon',
    sport: 'AFL',
    eventDate: '2026-08-23',
    options: [
      'Adelaide Crows', 'Brisbane Lions', 'Carlton', 'Collingwood', 'Essendon',
      'Fremantle', 'Geelong Cats', 'Gold Coast Suns', 'GWS Giants', 'Hawthorn',
      'Melbourne', 'North Melbourne', 'Port Adelaide', 'Richmond', 'St Kilda',
      'Sydney Swans', 'West Coast Eagles', 'Western Bulldogs',
    ],
  },
  {
    eventNumber: 28,
    title: 'Dally M Medal Winner',
    sport: 'NRL',
    eventDate: '2026-09-28',
    options: [
      'Nathan Cleary', 'Tom Trbojevic', 'James Tedesco', 'Kalyn Ponga',
      'Nicho Hynes', 'Jahrome Hughes', 'Daly Cherry-Evans', 'Cameron Munster',
      'Harry Grant', 'Isaah Yeo', 'Payne Haas', 'Joseph Suaalii',
      'Dylan Edwards', 'Matt Burton', 'Zac Lomax', 'Reece Walsh',
      'Other',
    ],
  },
  {
    eventNumber: 29,
    title: 'Clive Churchill Medal Winner',
    sport: 'NRL',
    eventDate: '2026-10-04',
    options: [
      'Nathan Cleary', 'Tom Trbojevic', 'James Tedesco', 'Kalyn Ponga',
      'Nicho Hynes', 'Jahrome Hughes', 'Daly Cherry-Evans', 'Cameron Munster',
      'Harry Grant', 'Isaah Yeo', 'Dylan Edwards', 'Joseph Suaalii',
      'Matt Burton', 'Reece Walsh', 'Other',
    ],
  },
  {
    eventNumber: 30,
    title: 'NRL Wooden Spoon',
    sport: 'NRL',
    eventDate: '2026-09-06',
    options: [
      'Brisbane Broncos', 'Canberra Raiders', 'Canterbury Bulldogs', 'Cronulla Sharks',
      'Dolphins', 'Gold Coast Titans', 'Manly Sea Eagles', 'Melbourne Storm',
      'Newcastle Knights', 'New Zealand Warriors', 'North Queensland Cowboys',
      'Parramatta Eels', 'Penrith Panthers', 'South Sydney Rabbitohs',
      'St George Illawarra Dragons', 'Sydney Roosters', 'Wests Tigers',
    ],
  },
  {
    eventNumber: 31,
    title: 'State of Origin Series Winner',
    sport: 'Rugby League',
    eventDate: '2026-07-08',
    options: ['Queensland', 'New South Wales', 'Series Draw'],
  },
  {
    eventNumber: 32,
    title: 'Super Rugby Pacific Winner',
    sport: 'Rugby Union',
    eventDate: '2026-06-21',
    options: [
      'Crusaders', 'Blues', 'Chiefs', 'Hurricanes', 'Highlanders',
      'Moana Pasifika', 'Fijian Drua', 'Queensland Reds', 'NSW Waratahs',
      'Brumbies', 'Melbourne Rebels', 'Western Force',
    ],
  },
  {
    eventNumber: 33,
    title: 'Suncorp Super Netball Winner',
    sport: 'Netball',
    eventDate: '2026-08-23',
    options: [
      'Melbourne Vixens', 'NSW Swifts', 'Sunshine Coast Lightning',
      'Queensland Firebirds', 'Adelaide Thunderbirds', 'West Coast Fever',
      'Collingwood Magpies', 'Giants Netball',
    ],
  },
  {
    eventNumber: 34,
    title: 'Commonwealth Games Most Gold Medals',
    sport: 'Multi-sport',
    eventDate: '2026-07-31',
    options: [
      'Australia', 'England', 'Canada', 'India', 'Scotland',
      'South Africa', 'New Zealand', 'Wales', 'Nigeria', 'Kenya',
      'Jamaica', 'Malaysia', 'Other',
    ],
  },
  {
    eventNumber: 35,
    title: "ICC Men's T20 World Cup Winner",
    sport: 'Cricket',
    eventDate: '2026-03-22',
    options: [
      'India', 'Australia', 'England', 'Pakistan', 'South Africa',
      'New Zealand', 'West Indies', 'Sri Lanka', 'Bangladesh', 'Afghanistan',
      'Ireland', 'Netherlands', 'Zimbabwe', 'Nepal', 'USA', 'Other',
    ],
  },
  {
    eventNumber: 36,
    title: 'Sheffield Shield Winner',
    sport: 'Cricket',
    eventDate: '2026-04-03',
    options: [
      'New South Wales', 'Victoria', 'Queensland', 'Western Australia',
      'South Australia', 'Tasmania',
    ],
  },
  {
    eventNumber: 37,
    title: 'Melbourne Cup Winner',
    sport: 'Horse Racing',
    eventDate: '2026-11-03',
    options: [
      'Without A Fight', 'Vauban', 'Buckaroo', 'Absurde', 'Okita',
      'Knight\'s Choice', 'Warp Speed', 'Onesmoothoperator', 'Interpretation',
      'Valiant King', 'Land Legend', 'Soulstirrer', 'Fancy Man',
      'Circle of Fire', 'Positivity', 'Other',
    ],
  },
  {
    eventNumber: 38,
    title: 'The Everest Winner',
    sport: 'Horse Racing',
    eventDate: '2026-10-17',
    options: [
      'I Wish I Win', 'Jacquinot', 'Nobility', 'Joliestar', 'Private Eye',
      'Bella Nipotina', 'Forgot You', 'Kallos', 'Giga Kick', 'Mr Brightside',
      'Proisir', 'TBD Slot Holder', 'Other',
    ],
  },
  {
    eventNumber: 39,
    title: 'Tour de France Yellow Jersey',
    sport: 'Cycling',
    eventDate: '2026-07-26',
    options: [
      'Tadej Pogacar', 'Jonas Vingegaard', 'Remco Evenepoel', 'Primoz Roglic',
      'Adam Yates', 'Jai Hindley', 'Enric Mas', 'Mikel Landa',
      'Richard Carapaz', 'Simon Yates', 'Joao Almeida', 'Carlos Rodriguez',
      'Matteo Jorgenson', 'Other',
    ],
  },
  {
    eventNumber: 40,
    title: "Giro d'Italia Winner",
    sport: 'Cycling',
    eventDate: '2026-06-07',
    options: [
      'Tadej Pogacar', 'Jonas Vingegaard', 'Remco Evenepoel', 'Primoz Roglic',
      'Jai Hindley', 'Geraint Thomas', 'Enric Mas', 'Mikel Landa',
      'Richard Carapaz', 'Simon Yates', 'Joao Almeida', 'Tao Geoghegan Hart',
      'Other',
    ],
  },
  {
    eventNumber: 41,
    title: 'Vuelta a Espana Winner',
    sport: 'Cycling',
    eventDate: '2026-09-13',
    options: [
      'Tadej Pogacar', 'Jonas Vingegaard', 'Remco Evenepoel', 'Primoz Roglic',
      'Jai Hindley', 'Enric Mas', 'Mikel Landa', 'Richard Carapaz',
      'Simon Yates', 'Joao Almeida', 'Sepp Kuss', 'Ben O\'Connor', 'Other',
    ],
  },
  {
    eventNumber: 42,
    title: 'Six Nations Winner',
    sport: 'Rugby Union',
    eventDate: '2026-03-14',
    options: ['England', 'France', 'Ireland', 'Scotland', 'Wales', 'Italy'],
  },
  {
    eventNumber: 43,
    title: 'Stanley Cup Winner',
    sport: 'Ice Hockey',
    eventDate: '2026-06-14',
    options: [
      'Florida Panthers', 'Edmonton Oilers', 'Vegas Golden Knights', 'Dallas Stars',
      'Colorado Avalanche', 'New York Rangers', 'Carolina Hurricanes', 'Boston Bruins',
      'Toronto Maple Leafs', 'Tampa Bay Lightning', 'Vancouver Canucks',
      'Winnipeg Jets', 'Nashville Predators', 'New Jersey Devils',
      'Detroit Red Wings', 'Minnesota Wild', 'Other',
    ],
  },
  {
    eventNumber: 44,
    title: 'World Snooker Champion',
    sport: 'Snooker',
    eventDate: '2026-05-04',
    options: [
      'Ronnie O\'Sullivan', 'Judd Trump', 'Mark Selby', 'Neil Robertson',
      'John Higgins', 'Kyren Wilson', 'Mark Allen', 'Shaun Murphy',
      'Luca Brecel', 'Mark Williams', 'Ding Junhui', 'Barry Hawkins',
      'Jack Lisowski', 'Stuart Bingham', 'Other',
    ],
  },
  {
    eventNumber: 45,
    title: 'MotoGP World Champion',
    sport: 'Motorsport',
    eventDate: '2026-11-15',
    options: [
      'Francesco Bagnaia', 'Jorge Martin', 'Marc Marquez', 'Enea Bastianini',
      'Brad Binder', 'Pedro Acosta', 'Maverick Vinales', 'Fabio Quartararo',
      'Marco Bezzecchi', 'Alex Marquez', 'Johann Zarco', 'Jack Miller',
      'Other',
    ],
  },
  {
    eventNumber: 46,
    title: 'La Liga Winner',
    sport: 'Soccer',
    eventDate: '2026-05-24',
    options: [
      'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Real Sociedad',
      'Athletic Bilbao', 'Real Betis', 'Villarreal', 'Girona',
      'Sevilla', 'Valencia', 'Other',
    ],
  },
  {
    eventNumber: 47,
    title: 'Serie A Winner',
    sport: 'Soccer',
    eventDate: '2026-05-24',
    options: [
      'Inter Milan', 'AC Milan', 'Juventus', 'Napoli', 'Roma',
      'Lazio', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino', 'Other',
    ],
  },
  {
    eventNumber: 48,
    title: 'Bundesliga Winner',
    sport: 'Soccer',
    eventDate: '2026-05-16',
    options: [
      'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
      'VfB Stuttgart', 'Eintracht Frankfurt', 'Union Berlin', 'Freiburg',
      'Wolfsburg', 'Hoffenheim', 'Other',
    ],
  },
  {
    eventNumber: 49,
    title: '24 Hours of Le Mans Overall Winner',
    sport: 'Motorsport',
    eventDate: '2026-06-14',
    options: [
      'Ferrari', 'Toyota', 'Porsche', 'Cadillac', 'Peugeot',
      'BMW', 'Lamborghini', 'Alpine', 'Aston Martin', 'Other',
    ],
  },
  {
    eventNumber: 50,
    title: 'AFL Rising Star Winner',
    sport: 'AFL',
    eventDate: '2026-09-21',
    options: [
      'Harley Reid', 'Sam Darcy', 'George Wardlaw', 'Elijah Tsatas',
      'Will Ashcroft', 'Harry Sheezel', 'Bailey Humphrey', 'Nick Watson',
      'Colby McKercher', 'Jaspa Fletcher', 'Harvey Gallagher',
      'Darcy Wilson', 'Other',
    ],
  },
]

async function main() {
  console.log('Seeding 50 events for The Big Tip 2026...')

  // 1. Find or create admin user (first user in DB)
  const adminUser = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (!adminUser) {
    console.error('No users found in the database. Please register at least one user first.')
    process.exit(1)
  }

  console.log(`Using admin user: ${adminUser.email}`)

  // 2. Create or find the competition
  let competition = await prisma.competition.findFirst({
    where: { name: 'The Big Tip 2026' },
  })

  if (!competition) {
    competition = await prisma.competition.create({
      data: {
        name: 'The Big Tip 2026',
        description: 'Predict the winners of 50 major sporting events across 2026.',
        entryFee: 0,
        prizePool: 0,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-12-31'),
        isPublic: true,
        maxEvents: 50,
        status: 'active',
        ownerId: adminUser.id,
      },
    })
    console.log(`Created competition: ${competition.name} (${competition.id})`)
  } else {
    console.log(`Found existing competition: ${competition.name} (${competition.id})`)
  }

  // 3. Upsert each event and link to competition
  for (const ev of EVENTS) {
    const event = await prisma.event.upsert({
      where: { externalId: `bigtip2026-${ev.eventNumber}` },
      update: {
        eventNumber: ev.eventNumber,
        title: ev.title,
        sport: ev.sport,
        options: ev.options,
        eventDate: new Date(ev.eventDate),
      },
      create: {
        externalId: `bigtip2026-${ev.eventNumber}`,
        eventNumber: ev.eventNumber,
        title: ev.title,
        sport: ev.sport,
        options: ev.options,
        eventDate: new Date(ev.eventDate),
        status: 'upcoming',
      },
    })

    // Link to competition (ignore if already linked)
    await prisma.competitionEvent.upsert({
      where: {
        competitionId_eventId: {
          competitionId: competition.id,
          eventId: event.id,
        },
      },
      update: {},
      create: {
        competitionId: competition.id,
        eventId: event.id,
      },
    })

    console.log(`  #${ev.eventNumber} ${ev.title} — ${ev.options.length} options`)
  }

  // 4. Ensure admin is in the competition
  await prisma.competitionUser.upsert({
    where: {
      userId_competitionId: {
        userId: adminUser.id,
        competitionId: competition.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      competitionId: competition.id,
    },
  })

  console.log('\nDone! 50 events seeded and linked to "The Big Tip 2026".')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
