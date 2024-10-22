import express, { Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
import * as f from './functions';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

let inclusiveCodes: string[] | null = null;

// inclusiveCodes = ['CA', 'CN', 'US', 'JP', 'UK', 'FR', 'GR']; // Test with a subset of countries
// inclusiveCodes = f.generateEasyDifficultyCodes(); // Test with easy difficulty countries (31)
// inclusiveCodes = f.generateCodesByCountryArea(500000); // Test with countries having areas at least 500,000 km² (53)
// inclusiveCodes = f.generateCodesByCountryArea(300000); // Test with countries having areas at least 300,000 km² (74)
// inclusiveCodes = f.generateCodesByCountryArea(100000, 200000); // Test with small countries with having between 100,000 km² and 200,000 km² (23)
// inclusiveCodes = f.generateCodesByCountryArea(50000, 100000); // Test with small countries with having between 50,000 km² and 100,000 km² (21)
inclusiveCodes = f.generatePreviousCountryCodes(); // Test with previous countries (189)

const country_code_names: f.CountryCodeName[] = f.load_country_code_names(inclusiveCodes);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', async (req: Request, res: Response) => {
  const randomCountry: f.CountryCodeName = f.generateNewCountry(country_code_names);

  // Generate options
  const options: f.CountryCodeName[] = f.generateCountryOptions(country_code_names, randomCountry, 6);

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

app.post('/guess', (req: Request, res: Response) => {
  const { countryCode, countryName, guessCode, correctCount, incorrectCount } = req.body as {
    countryCode: string;
    countryName: string;
    guessCode: string;
    correctCount: string;
    incorrectCount: string;
  };

  // console.log('req.body:', req.body);

  let correct = countryCode === guessCode;

  const newCountry = f.generateNewCountry(country_code_names, { code: countryCode, name: countryName });
  const options: f.CountryCodeName[] = f.generateCountryOptions(country_code_names, newCountry, 6);

  const responseObject = {
    correctCount: new Number(Number.parseInt(correctCount) + (correct ? 1 : 0)).toString(),
    incorrectCount: new Number(Number.parseInt(incorrectCount) + (correct ? 0 : 1)).toString(),
    lastCorrectCountry: countryName,
    lastGuessWasCorrect: correct,
    lastFlagUrl: f.generateFlagUrlFromCode(countryCode, false),
    newFlagUrl: f.generateFlagUrl(newCountry, true),
    newCountry: newCountry,
    newOptions: options,
  };

  // console.log('responseObject:', responseObject);
  
  res.json(responseObject);
});

app.post('/reset', (req: Request, res: Response) => {
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
