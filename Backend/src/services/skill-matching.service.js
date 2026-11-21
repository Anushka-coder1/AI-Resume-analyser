/**
 * Deterministic resume ↔ job-description skill matching.
 *
 * Each skill has aliases. A string alias matches case-insensitively on word
 * boundaries; a RegExp alias is used as-is (for short, case-sensitive names
 * such as "R" or "C" that would otherwise match ordinary words).
 *
 * Weight: 5 = core skill, 3–4 = important tool/skill, 1–2 = supporting skill.
 */

// Standalone capital letter (e.g. "R", "C"): not part of a word, not "C++"/"C#", not "R&D".
const standaloneLetter = (letter) =>
  new RegExp(`(^|[\\s,(/])${letter}(?=$|[\\s,)/.;:])`)

const SKILLS = [
  // Programming languages
  { skill: 'JavaScript', aliases: ['javascript', 'ecmascript', 'es6'], weight: 5 },
  { skill: 'TypeScript', aliases: ['typescript'], weight: 5 },
  { skill: 'Python', aliases: ['python'], weight: 5 },
  { skill: 'Java', aliases: ['java'], weight: 4 },
  { skill: 'C++', aliases: ['c++', 'cpp'], weight: 4 },
  { skill: 'C', aliases: [standaloneLetter('C'), 'c programming', 'c language'], weight: 3 },
  { skill: 'C#', aliases: ['c#', 'csharp', '.net', 'dotnet'], weight: 4 },
  { skill: 'Go', aliases: ['golang', /(^|[\s,(/])Go(?=$|[\s,)/.;:])/], weight: 4 },
  { skill: 'R', aliases: [standaloneLetter('R'), 'r programming', 'r language', 'rstudio'], weight: 4 },
  { skill: 'PHP', aliases: ['php'], weight: 3 },
  { skill: 'Kotlin', aliases: ['kotlin'], weight: 3 },
  { skill: 'Swift', aliases: ['swift'], weight: 3 },

  // Frontend
  { skill: 'HTML', aliases: ['html', 'html5'], weight: 3 },
  { skill: 'CSS', aliases: ['css', 'css3', 'sass', 'scss', 'tailwind'], weight: 3 },
  { skill: 'React', aliases: ['react', 'react.js', 'reactjs'], weight: 5 },
  { skill: 'Next.js', aliases: ['next.js', 'nextjs'], weight: 3 },
  { skill: 'Angular', aliases: ['angular', 'angularjs'], weight: 4 },
  { skill: 'Vue.js', aliases: ['vue', 'vue.js', 'vuejs'], weight: 4 },
  { skill: 'Redux', aliases: ['redux'], weight: 2 },

  // Backend & APIs
  { skill: 'Node.js', aliases: ['node.js', 'nodejs', 'node'], weight: 5 },
  { skill: 'Express.js', aliases: ['express', 'express.js'], weight: 4 },
  { skill: 'Django', aliases: ['django'], weight: 4 },
  { skill: 'Flask', aliases: ['flask'], weight: 3 },
  { skill: 'FastAPI', aliases: ['fastapi'], weight: 3 },
  { skill: 'Spring Boot', aliases: ['spring boot', 'springboot', 'spring framework'], weight: 4 },
  { skill: 'REST APIs', aliases: ['rest api', 'rest apis', 'restful', 'restapis', 'rest services'], weight: 4 },
  { skill: 'GraphQL', aliases: ['graphql'], weight: 3 },
  { skill: 'Microservices', aliases: ['microservices', 'microservice'], weight: 3 },

  // Databases
  { skill: 'SQL', aliases: ['sql', 'mysql', 'postgresql', 'postgres', 'sql server', 'sqlite', 't-sql', 'pl/sql'], weight: 4 },
  { skill: 'MongoDB', aliases: ['mongodb', 'mongo db', 'mongoose'], weight: 4 },
  { skill: 'Redis', aliases: ['redis'], weight: 2 },
  { skill: 'Database Management', aliases: ['database management', 'dbms', 'database design', 'data modeling', 'data modelling', 'databases', 'database', 'mysql', 'postgresql', 'mongodb', 'sql server', 'oracle'], weight: 3 },

  // Data analysis & BI
  { skill: 'Excel', aliases: ['excel', 'ms excel', 'microsoft excel', 'spreadsheets', 'spreadsheet', 'vlookup', 'pivot tables', 'pivot table'], weight: 4 },
  { skill: 'Power BI', aliases: ['power bi', 'powerbi', 'dax'], weight: 4 },
  { skill: 'Tableau', aliases: ['tableau'], weight: 4 },
  { skill: 'Statistics', aliases: ['statistics', 'statistical', 'probability', 'hypothesis testing', 'regression analysis'], weight: 4 },
  { skill: 'Data Analysis', aliases: ['data analysis', 'data analytics', 'analyzing data', 'analysing data', 'exploratory data analysis', 'eda'], weight: 4 },
  { skill: 'Data Visualization', aliases: ['data visualization', 'data visualisation', 'visualization', 'visualisation', 'dashboards', 'dashboard', 'matplotlib', 'seaborn', 'plotly'], weight: 4 },
  { skill: 'Data Cleaning', aliases: ['data cleaning', 'data cleansing', 'data preprocessing', 'data pre-processing', 'preprocessing', 'pre-processing', 'data wrangling', 'data preparation'], weight: 3 },
  { skill: 'Pandas', aliases: ['pandas'], weight: 3 },
  { skill: 'NumPy', aliases: ['numpy'], weight: 3 },
  { skill: 'Business Intelligence', aliases: ['business intelligence', 'bi tools', 'bi tool', 'reporting tools'], weight: 3 },
  { skill: 'Big Data', aliases: ['big data', 'large datasets', 'large data sets', 'spark', 'pyspark', 'hadoop'], weight: 3 },
  { skill: 'ETL', aliases: ['etl', 'data pipelines', 'data pipeline', 'elt'], weight: 3 },

  // AI / ML
  { skill: 'Machine Learning', aliases: ['machine learning', /(^|[^A-Za-z])ML(?=$|[^A-Za-z])/, 'scikit-learn', 'sklearn'], weight: 5 },
  { skill: 'Deep Learning', aliases: ['deep learning', 'neural network', 'neural networks', 'cnn', 'rnn', 'lstm'], weight: 4 },
  { skill: 'NLP', aliases: ['nlp', 'natural language processing'], weight: 4 },
  { skill: 'TensorFlow', aliases: ['tensorflow', 'keras'], weight: 3 },
  { skill: 'PyTorch', aliases: ['pytorch'], weight: 3 },
  { skill: 'Generative AI', aliases: ['generative ai', 'genai', 'llm', 'llms', 'large language models', 'prompt engineering'], weight: 4 },

  // Cloud & DevOps
  { skill: 'AWS', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'], weight: 3 },
  { skill: 'Azure', aliases: ['azure', 'microsoft azure'], weight: 3 },
  { skill: 'Google Cloud', aliases: ['gcp', 'google cloud', 'bigquery'], weight: 3 },
  { skill: 'Cloud Platforms', aliases: ['cloud platforms', 'cloud platform', 'cloud-based', 'cloud computing', 'cloud services', 'aws', 'azure', 'gcp', 'google cloud'], weight: 3 },
  { skill: 'Docker', aliases: ['docker', 'containerization', 'containers'], weight: 3 },
  { skill: 'Kubernetes', aliases: ['kubernetes', 'k8s'], weight: 3 },
  { skill: 'CI/CD', aliases: ['ci/cd', 'ci cd', 'continuous integration', 'github actions', 'jenkins'], weight: 3 },
  { skill: 'Linux', aliases: ['linux', 'unix', 'bash', 'shell scripting'], weight: 2 },
  { skill: 'Git', aliases: ['git', 'github', 'gitlab', 'version control'], weight: 2 },

  // CS fundamentals & practices
  { skill: 'Data Structures & Algorithms', aliases: ['data structures', 'algorithms', 'dsa'], weight: 4 },
  { skill: 'OOP', aliases: ['oop', 'oops', 'object-oriented', 'object oriented'], weight: 3 },
  { skill: 'System Design', aliases: ['system design', 'system-design', 'scalable systems'], weight: 4 },
  { skill: 'Testing', aliases: ['unit testing', 'jest', 'pytest', 'junit', 'test automation', 'automated testing'], weight: 3 },
  { skill: 'Agile', aliases: ['agile', 'scrum', 'kanban'], weight: 2 },

  // Soft skills (low weight so they never dominate the score)
  { skill: 'Communication', aliases: ['communication', 'communicating'], weight: 1 },
  { skill: 'Teamwork', aliases: ['teamwork', 'team player', 'collaboration', 'collaborated', 'collaborative', 'work in a team', 'cross-functional'], weight: 1 },
  { skill: 'Problem Solving', aliases: ['problem solving', 'problem-solving', 'analytical thinking'], weight: 1 },
  { skill: 'Presentation', aliases: ['presentation', 'presentations', 'presenting'], weight: 1 },
]

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toMatcher(alias) {
  if (alias instanceof RegExp) return alias
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(alias)}(?=$|[^a-z0-9])`, 'i')
}

const COMPILED_SKILLS = SKILLS.map((definition) => ({
  ...definition,
  matchers: definition.aliases.map(toMatcher),
}))

function findMatch(text, matchers) {
  for (const matcher of matchers) {
    const match = matcher.exec(text)
    if (match) {
      // Skip the leading boundary character captured by group 1.
      const offset = match[1] ? match[1].length : 0
      return { index: match.index + offset, length: match[0].length - offset }
    }
  }
  return null
}

function snippet(text, { index, length }) {
  const start = Math.max(0, index - 55)
  const end = Math.min(text.length, index + length + 55)
  return text.slice(start, end).trim()
}

const QUALIFIER = /\b(nice to have|good to have|preferred|bonus|desirable|plus|optional|advantage|advantageous)\b/i
const IGNORED_SECTION = /^(about\b|who we are|our company|company overview|salary|compensation|pay\b|benefits|perks|location|equal opportunit|note\b|disclaimer|how to apply|education|educational)/i
const SECTION_KEYWORD = /(skills|requirements|qualifications|responsibilities|about|education|salary|benefits|nice to have|good to have|preferred|bonus|must have|what you|who you|summary|duties|role|tech stack|tools)/i

/**
 * Splits the JD into lines tagged with the section context they belong to:
 * "required", "preferred" (under a "Preferred / Nice to have" heading) or
 * "ignore" (company blurb, salary, location, education...).
 */
function tagJobDescriptionLines(jobDescription) {
  let context = 'required'
  const tagged = []

  for (const rawLine of String(jobDescription || '').split(/\r?\n/)) {
    const line = rawLine.replace(/\s+/g, ' ').trim()
    if (!line) continue

    const isBullet = /^([-*•▪●◦]|\d+[.)])\s/.test(line)
    const plain = line.replace(/^#+\s*/, '').replace(/\*\*|__/g, '').trim()
    const isHeading =
      /^#{1,6}\s/.test(line) ||
      (!isBullet && /:$/.test(plain) && plain.length <= 60) ||
      (!isBullet && plain.length <= 45 && SECTION_KEYWORD.test(plain) && !/[.;]$/.test(plain))

    if (isHeading) {
      const title = plain.replace(/:$/, '').trim()
      context = IGNORED_SECTION.test(title) ? 'ignore' : QUALIFIER.test(title) ? 'preferred' : 'required'
    }

    // An inline qualifier ("Docker is a plus", "Preferred: AWS") marks just that line.
    const lineContext = context === 'required' && QUALIFIER.test(plain) ? 'preferred' : context
    tagged.push({ text: plain, context: lineContext })
  }

  return tagged
}

function analyseSkillMatch({ resume = '', selfDescription = '', jobDescription = '' }) {
  const candidateText = `${resume}\n${selfDescription}`.replace(/\s+/g, ' ')
  const jobLines = tagJobDescriptionLines(jobDescription).filter((line) => line.context !== 'ignore')

  const requirements = COMPILED_SKILLS.map((definition) => {
    let requiredHit = null
    let preferredHit = null

    for (const line of jobLines) {
      const match = findMatch(line.text, definition.matchers)
      if (!match) continue
      if (line.context === 'required') {
        requiredHit = { line, match }
        break
      }
      if (!preferredHit) preferredHit = { line, match }
    }

    const hit = requiredHit || preferredHit
    if (!hit) return null

    const required = Boolean(requiredHit)
    const candidateMatch = findMatch(candidateText, definition.matchers)
    const weight = required ? definition.weight : Math.max(1, definition.weight - 2)

    return {
      skill: definition.skill,
      required,
      weight,
      matched: Boolean(candidateMatch),
      jobEvidence: snippet(hit.line.text, hit.match),
      candidateEvidence: candidateMatch ? snippet(candidateText, candidateMatch) : null,
    }
  }).filter(Boolean)

  const totalWeight = requirements.reduce((total, item) => total + item.weight, 0)
  const matchedWeight = requirements
    .filter((item) => item.matched)
    .reduce((total, item) => total + item.weight, 0)

  // No recognised requirements means there is insufficient deterministic evidence,
  // rather than an inaccurate low score.
  const matchScore = totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : 0
  const missingRequirements = requirements.filter((item) => !item.matched)
  const matchedRequirements = requirements.filter((item) => item.matched)

  return {
    matchScore,
    scoringMethod: 'weighted_skill_coverage_v2',
    requirements,
    matchedRequirements,
    missingRequirements,
    skillGaps: missingRequirements.map((item) => ({
      skill: item.skill,
      severity: item.weight >= 5 ? 'high' : item.weight >= 3 ? 'medium' : 'low',
    })),
  }
}

module.exports = { analyseSkillMatch, tagJobDescriptionLines }
