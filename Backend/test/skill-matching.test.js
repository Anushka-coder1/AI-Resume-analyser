const { analyseSkillMatch } = require('../src/services/skill-matching.service')

const DATA_ANALYST_JD = `# Job Description – Data Analyst

## About the Company
We develop software, cloud services, and business solutions.

## Required Technical Skills
- Strong knowledge of Microsoft Excel.
- Proficiency in SQL and database management.
- Knowledge of Python or R programming.
- Understanding of statistics and probability.
- Experience with Power BI or Tableau.
- Knowledge of data cleaning and preprocessing.

## Preferred Skills
- Knowledge of machine learning fundamentals.
- Familiarity with cloud-based data platforms.

## Salary
Competitive salary, AWS credits.`

const bySkill = (result) => Object.fromEntries(result.requirements.map((item) => [item.skill, item]))

describe('analyseSkillMatch', () => {
  test('recognises data-analyst skills that the old matcher ignored', () => {
    const skills = bySkill(analyseSkillMatch({ resume: '', jobDescription: DATA_ANALYST_JD }))
    for (const name of ['Excel', 'SQL', 'Python', 'R', 'Statistics', 'Power BI', 'Tableau', 'Data Cleaning']) {
      expect(skills[name]).toBeDefined()
      expect(skills[name].required).toBe(true)
    }
  })

  test('skills under a "Preferred Skills" heading are preferred, not required', () => {
    const skills = bySkill(analyseSkillMatch({ resume: '', jobDescription: DATA_ANALYST_JD }))
    expect(skills['Machine Learning'].required).toBe(false)
    expect(skills['Cloud Platforms'].required).toBe(false)
  })

  test('ignores company blurb and salary sections', () => {
    const skills = bySkill(analyseSkillMatch({ resume: '', jobDescription: DATA_ANALYST_JD }))
    expect(skills.AWS).toBeUndefined()
  })

  test('improving the resume raises the score', () => {
    const before = analyseSkillMatch({ resume: 'Skills: Python, SQL', jobDescription: DATA_ANALYST_JD })
    const after = analyseSkillMatch({
      resume: 'Skills: Python, SQL, Excel, Power BI, statistics. Did data cleaning with pandas.',
      jobDescription: DATA_ANALYST_JD,
    })
    expect(after.matchScore).toBeGreaterThan(before.matchScore)
  })

  test('single-letter languages only match when standalone', () => {
    const jd = '## Requirements\n- Python or R programming\n- C++'
    const noR = bySkill(analyseSkillMatch({ resume: 'Worked in R&D using C++ and Python', jobDescription: jd }))
    expect(noR.R.matched).toBe(false)
    const withR = bySkill(analyseSkillMatch({ resume: 'Languages: Python, R, SQL', jobDescription: jd }))
    expect(withR.R.matched).toBe(true)
    expect(withR.C).toBeUndefined() // "C++" in the JD must not register plain C
  })

  test('Java does not match JavaScript', () => {
    const skills = bySkill(analyseSkillMatch({ resume: 'JavaScript developer', jobDescription: '- Java required' }))
    expect(skills.Java.matched).toBe(false)
  })

  test('returns 0 with no recognised requirements', () => {
    expect(analyseSkillMatch({ resume: 'anything', jobDescription: 'We want a great person.' }).matchScore).toBe(0)
  })
})
