import express, { Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

let correctCount = 0;
let incorrectCount = 0;
let lastCorrectCountry = '';
let lastGuessWasCorrect = false;
let lastFlagUrl = '';

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia',
  'Cameroon', 'Canada', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo, Democratic Republic of the', 'Congo, Republic of the',
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, North', 'Korea, South',
  'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const countries_no_flags = ['Marshall Islands', 'Cabo Verde', 'Netherlands', 'Central African Republic'];

interface WikiPage {
  pageid: number;
  ns: number;
  title: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
}

async function fetchFlag(country: string): Promise<string | null> {
  try {
    const response = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles=Flag_of_${country}&pithumbsize=300`
    );

    const pages: Record<string, WikiPage> = response.data.query.pages;
    const page = Object.values(pages)[0];

    if (page.thumbnail) {
      return page.thumbnail.source;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error(`Error fetching flag for ${country}:`, error.message);
    return null;
  }
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.urlencoded({ extended: true }));

app.get('/', async (req: Request, res: Response) => {
  const randomCountry = countries[Math.floor(Math.random() * countries.length)];
  const urlencodedCountry = encodeURIComponent(randomCountry);
  const flagUrl = await fetchFlag(urlencodedCountry);

  if (!flagUrl) {
    console.error(`Flag not found for ${randomCountry}`);
    return res.redirect('/');
  }

  // Generate 5 random incorrect options
  const incorrectOptions = new Set<string>();
  while (incorrectOptions.size < 5) {
    const randomOption = countries[Math.floor(Math.random() * countries.length)];
    if (randomOption !== randomCountry) {
      incorrectOptions.add(randomOption);
    }
  }

  const options = Array.from(incorrectOptions);
  options.push(randomCountry);
  options.sort(() => Math.random() - 0.5); // Shuffle options

  res.render('index', {
    country: randomCountry,
    flagUrl,
    options,
    correctCount,
    incorrectCount,
    lastCorrectCountry,
    lastGuessWasCorrect,
    lastFlagUrl
  });
});

app.post('/guess', (req: Request, res: Response) => {
  const { country, guess, flagUrl } = req.body;
  lastCorrectCountry = country;
  lastFlagUrl = flagUrl;
  if (country === guess) {
    lastGuessWasCorrect = true;
    correctCount++;
  } else {
    lastGuessWasCorrect = false;
    incorrectCount++;
  }
  res.redirect('/');
});

app.post('/reset', (req: Request, res: Response) => {
  correctCount = 0;
  incorrectCount = 0;
  lastCorrectCountry = '';
  lastGuessWasCorrect = false;
  lastFlagUrl = '';
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
