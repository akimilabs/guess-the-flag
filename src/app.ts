import express, { Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

interface CountryCodeName {
  code: string;
  name: string;
}

const country_code_names: CountryCodeName[] = load_country_code_names();

function load_country_code_names(): CountryCodeName[] {
  const country_code_names: CountryCodeName[] = [];

// Load a local copy of the data from https://restcountries.com/v3.1/all
const countryData = require('./restcountriescom-list.json');

  let count = 0;
  countryData.forEach((country: any) => {
    if (country.cca2 && country.name && country.name.common) {
      country_code_names.push({ code: country.cca2.toLowerCase(), name: country.name.common });
      count++;
    }
  });

  console.log(`Total countries loaded: ${count}`);

  return country_code_names;
}

function generateFlagUrl(country: CountryCodeName, large: boolean): string {
  return generateFlagUrlFromCode(country.code, large);
}

function generateFlagUrlFromCode(countryCode: string, large: boolean): string {
  const size = large ? 'w320' : 'w160';
  const prefix = 'https://flagcdn.com/';
  const postfix = '.png';
  const url = `${prefix}${size}/${countryCode}${postfix}`;

  return url;
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.urlencoded({ extended: true }));

app.get('/', async (req: Request, res: Response) => {
  const randomCountry: CountryCodeName = country_code_names[Math.floor(Math.random() * country_code_names.length)];

  // Generate options
  const options: CountryCodeName[] = [randomCountry];
  while (options.length < 6) {
    const randomOption = country_code_names[Math.floor(Math.random() * country_code_names.length)];
    if (randomOption !== randomCountry) {
      options.push(randomOption);
    }
  }
  options.sort(() => Math.random() - 0.5); // Shuffle options

  res.render('index', {
    country: randomCountry,
    flagUrl: generateFlagUrl(randomCountry, true),
    options,
    correctCount: 0,
    incorrectCount: 0,
    lastCorrectCountry: null,
    lastGuessWasCorrect: null,
    lastFlagUrl: null,
  });
});

app.post('/guess', (req: Request, res: Response) => {
  const { countryCode, countryName, guessCode, correctCount, incorrectCount } = req.body;
  let correct = countryCode === guessCode;

  console.log('body = ', req.body);
  
  res.json({
    correctCount: correct ? correctCount + 1 : correctCount,
    incorrectCount: correct ? incorrectCount : incorrectCount + 1,
    lastCorrectCountry: countryName,
    lastGuessWasCorrect: correct,
    lastFlagUrl: generateFlagUrlFromCode(guessCode, false),
    newFlagUrl: generateFlagUrl(country_code_names[Math.floor(Math.random() * country_code_names.length)], true),
  });
});

app.post('/reset', (req: Request, res: Response) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
