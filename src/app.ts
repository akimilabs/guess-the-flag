import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer, WebSocket, Data } from 'ws';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import * as f from './functions'; // Assuming functions.ts contains necessary functions
import { Player, Competition, generateUniqueCompetitionId, generateUniquePlayerId } from './models'; // Assuming models.ts contains these interfaces
import { CountryCodeName } from './functions'; // Importing CountryCodeName interface
import { create } from 'domain';

const app = express(); // Create Express app
const server = createServer(app); // Create HTTP server
const wss = new WebSocketServer({ server }); // Create WebSocket server

dotenv.config(); // Load environment variables from a .env file

let inclusiveCodes: string[] | null = null;

// inclusiveCodes = ['CA', 'CN', 'US', 'JP', 'UK', 'FR', 'GR']; // Test with a subset of countries
// inclusiveCodes = f.generateEasyDifficultyCodes(); // Test with easy difficulty countries (31)
// inclusiveCodes = f.generateCodesByCountryArea(500000); // Test with countries having areas at least 500,000 km² (53)
// inclusiveCodes = f.generateCodesByCountryArea(300000); // Test with countries having areas at least 300,000 km² (74)
// inclusiveCodes = f.generateCodesByCountryArea(100000, 200000); // Test with small countries with having between 100,000 km² and 200,000 km² (23)
// inclusiveCodes = f.generateCodesByCountryArea(50000, 100000); // Test with small countries with having between 50,000 km² and 100,000 km² (21)
inclusiveCodes = f.generatePreviousCountryCodes(); // Test with previous countries (189)

const country_code_names: f.CountryCodeName[] = f.load_country_code_names(inclusiveCodes);


// In-memory storage for competitions
const competitions: Map<string, Competition> = new Map();

app.set('view engine', 'ejs'); // Set the view engine to EJS

// Set the views directory
app.set('views', path.join(__dirname, '../views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

// Parse URL-encoded and JSON request bodies
app.use(express.urlencoded({ extended: true }));

// Home page
app.get('/', (req: Request, res: Response) => {
  const randomCountry: CountryCodeName = f.generateNewCountry(country_code_names);

  // Generate options
  const options: CountryCodeName[] = f.generateCountryOptions(country_code_names, randomCountry, 6);

  res.render('index', {
    total: country_code_names.length,
    country: randomCountry,
    flagUrl: f.generateFlagUrl(randomCountry, true),
    options,
    correctCount: 0,
    incorrectCount: 0,
    lastCorrectCountry: null,
    lastGuessWasCorrect: null,
    lastFlagUrl: null,
  });
});

app.get('/host', (req: Request, res: Response) => {
  res.render('host');
});

// Hosting a competition
app.post('/start-competition', (req: Request, res: Response) => {
  const hostName = req.body.name;
  const competitionId = generateUniqueCompetitionId();
  const playerId = generateUniquePlayerId();

  const hostPlayer: Player = {
    id: playerId,
    name: hostName,
    ws: null as unknown as WebSocket, // Type assertion to satisfy the type checker
  };

  const defaultCountryCodeName: CountryCodeName = { code: 'US', name: 'United States' }; // or any

  const competition: Competition = {
    id: competitionId,
    host: hostPlayer,
    players: [hostPlayer],
    currentRound: 0,
    totalRounds: 50,
    // Assuming you have a default value for CountryCodeName
    currentFlag: defaultCountryCodeName as CountryCodeName,
    options: [],
    guesses: new Map(),
    scores: new Map([[playerId, 0]]),
    status: 'waiting',
  };

  competitions.set(competitionId, competition);

  res.redirect(`/competition/${competitionId}?playerId=${playerId}`);
});

app.get('/join', (req: Request, res: Response) => {
  res.render('join');
});

// Joining a competition
app.post('/join-competition', (req: Request, res: Response) => {
  const competitionId = req.body.competitionId;
  const playerName = req.body.name;
  const competition = competitions.get(competitionId);

  if (!competition) {
    res.status(404).send('Competition not found');
    return;
  }

  const playerId = generateUniquePlayerId();

  const player: Player = {
    id: playerId,
    name: playerName,
    ws: null,
  };

  competition.players.push(player);
  competition.scores.set(playerId, 0);

  res.redirect(`/competition/${competitionId}?playerId=${playerId}`);
});

// Viewing a competition
app.get('/competition/:competitionId', (req: Request, res: Response) => {
  const competitionId = req.params.competitionId;
  const playerId = req.query.playerId as string;
  const competition = competitions.get(competitionId);

  if (!competition) {
    res.status(404).send('Competition not found');
    return;
  }

  const player = competition.players.find(p => p.id === playerId);
  if (!player) {
    res.status(404).send('Player not found in competition');
    return;
  }

  res.render('competition', {
    competitionId,
    playerId,
    playerName: player.name,
    isHost: competition.host.id === playerId,
  });
});

wss.on('connection', (ws: WebSocket) => {
  let playerId: string;
  let competitionId: string;
  let competition: Competition;
  let player: Player;

  ws.on('message', (message: Data) => {
    const data = JSON.parse(message.toString());

    switch (data.type) {
      case 'joinCompetition':
        handleJoinCompetition(data, ws);
        break;

      case 'startCompetition':
        handleStartCompetition(ws);
        break;

      case 'submitGuess':
        handleSubmitGuess(data);
        break;

      // Add more cases as needed

      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  });

  // Handler functions
  function handleJoinCompetition(data: any, ws: WebSocket) {
    competitionId = data.competitionId;
    playerId = data.playerId;
    const competition = competitions.get(competitionId);

    if (!competition) {
      ws.send(JSON.stringify({ type: 'error', message: 'Competition not found' }));
      ws.close();
      return;
    }

    const player = competition.players.find(p => p.id === playerId);
    if (!player) {
      ws.send(JSON.stringify({ type: 'error', message: 'Player not found in competition' }));
      ws.close();
      return;
    }

    player.ws = ws;

    // Notify others
    competition.players.forEach(p => {
      if (p.ws && p.id !== playerId) {
        p.ws.send(JSON.stringify({
          type: 'playerJoined',
          player: { id: player.id, name: player.name },
        }));
      }
    });
  }

  function handleStartCompetition(ws: WebSocket) {
    if (playerId !== competition.host.id) {
      ws.send(JSON.stringify({ type: 'error', message: 'Only host can start the competition' }));
      return;
    }

    competition.status = 'in-progress';
    competition.currentRound = 1;
    startNewRound(competition);
  }

  function handleSubmitGuess(data: any) {
    const guess = data.guess; // Country code
    competition.guesses.set(player.id, guess);

    // Check if all players have submitted their guesses
    if (competition.guesses.size === competition.players.length) {
      processRoundResults(competition);
    }
  }

  // ... existing startNewRound and processRoundResults functions

  ws.on('close', () => {
    if (competition && player) {
      competition.players = competition.players.filter(p => p.id !== player.id);
      competition.scores.delete(player.id);

      // Notify others
      competition.players.forEach(p => {
        if (p.ws) {
          p.ws.send(JSON.stringify({ type: 'playerLeft', playerId: player.id }));
        }
      });
    }
  });
});

// Helper functions
function startNewRound(competition: Competition) {
  const newCountry = f.generateNewCountry(country_code_names);
  const options = f.generateCountryOptions(country_code_names, newCountry, 6);
  competition.currentFlag = newCountry;
  competition.options = options;
  competition.guesses.clear();

  const message = {
    type: 'newRound',
    round: competition.currentRound,
    flagUrl: f.generateFlagUrl(newCountry, true),
    options: options.map(option => ({ code: option.code, name: option.name })),
  };

  competition.players.forEach(p => {
    if (p.ws) {
      p.ws.send(JSON.stringify(message));
    }
  });
}

function processRoundResults(competition: Competition) {
  const correctCode = competition.currentFlag.code;

  competition.players.forEach(p => {
    const playerGuess = competition.guesses.get(p.id);
    const isCorrect = playerGuess === correctCode;
    const currentScore = competition.scores.get(p.id) || 0;
    competition.scores.set(p.id, currentScore + (isCorrect ? 1 : 0));
  });

  const resultMessage = {
    type: 'roundResult',
    correctAnswer: competition.currentFlag.name,
    scores: Array.from(competition.scores.entries()).map(([id, score]) => {
      const playerName = competition.players.find(p => p.id === id)?.name || 'Unknown';
      return { playerId: id, playerName, score };
    }),
  };

  competition.players.forEach(p => {
    if (p.ws) {
      p.ws.send(JSON.stringify(resultMessage));
    }
  });

  // Proceed to next round or end competition
  if (competition.currentRound < competition.totalRounds) {
    competition.currentRound++;
    startNewRound(competition);
  } else {
    competition.status = 'finished';
    const endMessage = {
      type: 'competitionEnded',
      scores: resultMessage.scores,
    };
    competition.players.forEach(p => {
      if (p.ws) {
        p.ws.send(JSON.stringify(endMessage));
      }
    });
  }
}

const PORT = process.env.PORT || 3000; // Define the port number

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});