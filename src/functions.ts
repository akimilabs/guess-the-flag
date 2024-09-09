interface CountryCodeName {
  code: string;
  name: string;
}

function generateFlagUrl(country: CountryCodeName, large: boolean): string {
  return generateFlagUrlFromCode(country.code, large);
}

function generateFlagUrlFromCode(countryCode: string, large: boolean): string {
  const size = large ? 'h160' : 'h80';
  const prefix = 'https://flagcdn.com/';
  const postfix = '.png';
  const url = `${prefix}${size}/${countryCode}${postfix}`;

  return url;
}

function generateCountryOptions(country_code_names: CountryCodeName[], correctCountry: CountryCodeName, total: number): CountryCodeName[] {
  const options: Set<CountryCodeName> = new Set([correctCountry]);
  while (options.size < total) {
    const randomOption = country_code_names[Math.floor(Math.random() * country_code_names.length)];
    if (randomOption !== correctCountry) {
      options.add(randomOption);
    }
  }
  const optionsArray = Array.from(options);
  optionsArray.sort(() => Math.random() - 0.5); // Shuffle options

  return optionsArray;
}

function generateNewCountry(country_code_names: CountryCodeName[], oldCountry: CountryCodeName | null = null): CountryCodeName {
  let newCountry: CountryCodeName;
  do {
    newCountry = country_code_names[Math.floor(Math.random() * country_code_names.length)];
  } while (oldCountry != null && newCountry.code === oldCountry.code);
  return newCountry;
}

function generatePreviousCountryCodes(): string[] {
    const codes: string[] = [];
  
    const country_names = [
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
    
    const country_names_no_flags = ['Marshall Islands', 'Cabo Verde', 'Netherlands', 'Central African Republic'];
  
    const joint_country_names = country_names.concat(country_names_no_flags);
  
    const countryData = require('./restcountriescom-list.json');
  
    countryData.forEach((country: any) => {
      if (country.cca2 && country.name && country.name.common) {
        if (joint_country_names.includes(country.name.common)) {
          codes.push(country.cca2);
        }
      }
    });
  
    return codes;
  }
  
  function generateEasyDifficultyCodes(): string[] {
    return generateCodesByCountryArea(1000000);
  }

  function generateCodesByCountryArea(area_min: number, area_max: number | null = null): string[] {
    const codes: string[] = [];
    const countryData = require('./restcountriescom-list.json');
  
    countryData.forEach((country: any) => {
      if (country.cca2 && country.name && country.name.common) {
        if (country.area > area_min && (area_max ? (country.area < area_max) : true)) {
          codes.push(country.cca2);
        }
      }
    });
  
    return codes;
  }
  
  function load_country_code_names(inclusiveCodes: string[] | null = null): CountryCodeName[] {
    const country_code_names: CountryCodeName[] = [];
  
  // Load a local copy of the data from https://restcountries.com/v3.1/all
  const countryData = require('./restcountriescom-list.json');
  
    let count = 0;
    countryData.forEach((country: any) => {
      // Check if the country has a valid country code and name
      if (country.cca2 && country.name && country.name.common) {
        // Check if the country is in the inclusive list
        if (!inclusiveCodes || inclusiveCodes.includes(country.cca2)) {
          country_code_names.push({ code: country.cca2.toLowerCase(), name: country.name.common });
          count++;
        }
      }
    });
  
    console.log(`Total countries loaded: ${count}`);
  
    return country_code_names;
  }

export { CountryCodeName, generateFlagUrl, generateFlagUrlFromCode, generateCountryOptions, generateNewCountry, generatePreviousCountryCodes, generateEasyDifficultyCodes, generateCodesByCountryArea, load_country_code_names };