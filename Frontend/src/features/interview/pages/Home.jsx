import '../style/home.scss'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterview } from '../hooks/useInterview'

export const Home = () => {
  const { loading, error, reports, nextReportCursor, generateReport, getReports } = useInterview()
  const [jobDescription, setJobDescription] = useState('')
  const [selfDescription, setSelfDescription] = useState('')
  const [localError, setLocalError] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [jobDescriptionFileName, setJobDescriptionFileName] = useState('')
  const resumeInputRef = useRef(null)
  const jobDescriptionInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    getReports().catch(() => {})
  }, [getReports])

  const handleGenerateReport = async () => {
    const resumeFile = resumeInputRef.current?.files?.[0]
    const jobDescriptionFile = jobDescriptionInputRef.current?.files?.[0]

    if (!jobDescription.trim() && !jobDescriptionFile) {
      setLocalError(
        'Paste the target job description or upload its PDF before generating a report.',
      )
      return
    }

    if (!resumeFile && !selfDescription.trim()) {
      setLocalError(
        'Upload a resume or add a self description so the analysis has enough context.',
      )
      return
    }

    setLocalError('')

    try {
      const report = await generateReport({
        jobDescription,
        jobDescriptionFile,
        selfDescription,
        resumeFile,
      })
      navigate(`/interview/${report._id}`)
    } catch {
      return
    }
  }

  const activeError = localError || error

  const loadMoreReports = () => {
    if (nextReportCursor) getReports({ cursor: nextReportCursor }).catch(() => {})
  }

  return (
    <main className="home">
      <div className="bg-circle bg-circle-1"></div>
      <div className="bg-circle bg-circle-2"></div>
      <button className="community-link" type="button" onClick={() => navigate('/experiences')}>
        Community experiences
      </button>
      <div className="home-container">
        <section className="hero">
          <p className="badge">Personalized interview prep</p>
          <h1>
            Turn any job post into a <span>focused interview plan</span>
          </h1>
          <p>
            Upload your resume, add a quick profile summary, and get a clean
            dashboard with match score, likely questions, skill gaps, and a
            day-by-day roadmap.
          </p>
        </section>

        <section className="main-card">
          <div className="left-panel">
            <div className="section-header">
              <div className="section-icon">JD</div>
              <div>
                <h3>Target Job Description</h3>
                <p>Paste the role details you want to prepare for.</p>
              </div>
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              id="jobDescription"
              className="jobDescription"
              placeholder={`Example:

Senior Frontend Engineer

Requirements

• React.js
• TypeScript
• Node.js
• REST APIs
• Problem Solving
• System Design
• Team Collaboration`}
            />

            <div className="character-count">
              {jobDescription.length} characters
            </div>

            <div className="upload-section job-description-upload">
              <label htmlFor="jobDescriptionFile">Upload Job Description <span>(Optional)</span></label>
              <label htmlFor="jobDescriptionFile" className="upload-box upload-box--compact">
                <div className="upload-icon">JD</div>
                <h4>{jobDescriptionFileName || 'Choose a job description file'}</h4>
                <p>PDF only, max 3 MB</p>
                <small>Its text is combined with anything pasted above.</small>
              </label>
              <input ref={jobDescriptionInputRef} type="file" id="jobDescriptionFile" accept=".pdf,application/pdf" onChange={(e) => setJobDescriptionFileName(e.target.files?.[0]?.name || '')} />
            </div>
          </div>

          <div className="right-panel">
            <div className="section-header">
              <div className="section-icon">CV</div>
              <div>
                <h3>Your Profile</h3>
                <p>Upload your resume, add a summary, or use both.</p>
              </div>
            </div>

            <div className="upload-section">
              <label htmlFor="resume">
                Upload Resume
                <span> (Recommended)</span>
              </label>

              <label htmlFor="resume" className="upload-box">
                <div className="upload-icon">PDF</div>
                <h4>{resumeFileName || 'Choose a resume file'}</h4>
                <p>PDF only, max 3 MB</p>
                <small>Used only to generate your interview report.</small>
              </label>

              <input
                ref={resumeInputRef}
                type="file"
                id="resume"
                accept=".pdf"
                onChange={(e) => {
                  setResumeFileName(e.target.files?.[0]?.name || '')
                }}
              />
            </div>

            <div className="divider">
              <span>OR</span>
            </div>

            <div className="self-description-section">
              <label htmlFor="selfDescription">Quick Self Description</label>
              <textarea
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
                id="selfDescription"
                className="selfDescription"
                placeholder={`Briefly describe yourself...

• Years of experience
• Technical skills
• Projects
• Achievements
• Career goals`}
              />
            </div>

            <div className="info-box">
              <span>i</span>
              <p>
                Either <strong>Resume</strong> or{' '}
                <strong>Self Description</strong> is required for generating
                your personalized interview report.
              </p>
            </div>

            {activeError ? (
              <p className="panel-message error">{activeError}</p>
            ) : null}

            <button
              onClick={handleGenerateReport}
              className="generate-btn"
              disabled={loading}
            >
              {loading
                ? 'Generating report . . . . .'
                : 'Generate AI Interview Report'}
            </button>
          </div>
        </section>

        <section className="history-panel">
          <div className="history-header">
            <h2>Recent reports</h2>
            <p>Jump back into previous interview prep sessions.</p>
          </div>

          <div className="history-grid">
            {reports.length ? (
              reports.map((report) => (
                <button
                  key={report._id}
                  type="button"
                  className="history-card"
                  onClick={() => navigate(`/interview/${report._id}`)}
                >
                  <div>
                    <p className="history-title">{report.title}</p>
                    <p className="history-date">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="history-score">{report.matchScore}%</span>
                </button>
              ))
            ) : (
              <div className="history-empty">
                <h3>No reports yet</h3>
                <p>Your generated interview plans will appear here.</p>
              </div>
            )}
          </div>
          {nextReportCursor ? <button type="button" className="load-more" onClick={loadMoreReports} disabled={loading}>Load more reports</button> : null}
        </section>

        <footer className="footer">
          <span>Sharper prep, cleaner feedback, faster iterations.</span>
        </footer>
      </div>
    </main>
  )
}
