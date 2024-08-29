import express, { Request, Response } from 'express';
import axios from 'axios';
import path from 'path';

const app = express();
const port = 3000;

let correctCount = 0;
let incorrectCount = 0;

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo, Democratic Republic of the', 'Congo, Republic of the',
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, North', 'Korea, South',
  'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway',
  'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
  'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
  'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

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

app.use(express.urlencoded({ extended: true }));

app.get('/', async (req: Request, res: Response) => {
  const randomCountry = countries[Math.floor(Math.random() * countries.length)];
  const flagUrl = await fetchFlag(randomCountry);

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
  });
});

app.post('/guess', (req: Request, res: Response) => {
  const { country, guess } = req.body;
  if (country === guess) {
    correctCount++;
  } else {
    incorrectCount++;
  }
  res.redirect('/');
});

app.post('/reset', (req: Request, res: Response) => {
  correctCount = 0;
  incorrectCount = 0;
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
