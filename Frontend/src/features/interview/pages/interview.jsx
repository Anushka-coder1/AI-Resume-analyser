import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview'
import { useAuth } from '../../auth/hooks/useAuth'
import { ResumeProgress } from '../components/ResumeProgress'

// Same thresholds the backend uses for skill-gap severity.
const priorityFor = (weight) => (weight >= 5 ? 'high' : weight >= 3 ? 'medium' : 'low')

export const Interview = () => {
  const { interviewId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('technical')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { report, loading, error, getReportById, getResumePdf, generateReport } = useInterview()
  const { handleLogout } = useAuth()
  const resumeInputRef = useRef(null)
  const [reuploading, setReuploading] = useState(false)
  const [reuploadError, setReuploadError] = useState('')

  const handleResumeReupload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // allow choosing the same file again later
    if (!file || !report) return

    if (file.type !== 'application/pdf') {
      setReuploadError('Please choose a PDF file.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setReuploadError('Resume must be 3 MB or smaller.')
      return
    }

    setReuploadError('')
    setReuploading(true)
    try {
      const newReport = await generateReport({
        previousReportId: report._id,
        selfDescription: report.selfDescription || '',
        resumeFile: file,
      })
      setActiveTab('technical')
      setSelectedIndex(0)
      navigate(`/interview/${newReport._id}`)
    } catch (err) {
      setReuploadError(err.response?.data?.message || 'Could not analyse the new resume. Please try again.')
    } finally {
      setReuploading(false)
    }
  }

  useEffect(() => {
    if (!interviewId || report?._id === interviewId) {
      return
    }

    getReportById({ interviewId }).catch(() => {})
  }, [getReportById, interviewId, report?._id])

  const technical = report?.technicalQuestions ?? []
  const behavioral = report?.behavioralQuestions ?? []
  const roadmap = report?.preparationPlan ?? []

  const currentTechnical = technical[selectedIndex]
  const currentBehavioral = behavioral[selectedIndex]
  const currentRoadmap = roadmap[selectedIndex]

  const activeList =
    activeTab === 'technical' ? technical : activeTab === 'behavioral' ? behavioral : roadmap

  const nextItem = () => {
    if (selectedIndex < activeList.length - 1) {
      setSelectedIndex((value) => value + 1)
    }
  }

  const previousItem = () => {
    if (selectedIndex > 0) {
      setSelectedIndex((value) => value - 1)
    }
  }

  const changeTab = (tab) => {
    setActiveTab(tab)
    setSelectedIndex(0)
  }

  if (loading && !report) {
    return (
      <main className="interview-page">
        <div className="background-circle one"></div>
        <div className="background-circle two"></div>
        <div className="interview-container">
          <section className="content loading-state-card">
            <div className="spinner"></div>
            <h2>Loading your interview dashboard...</h2>
          </section>
        </div>
      </main>
    )
  }

  if (error && !report) {
    return (
      <main className="interview-page">
        <div className="background-circle one"></div>
        <div className="background-circle two"></div>
        <div className="interview-container">
          <section className="content empty-state">
            <h2>We couldn&apos;t load this report</h2>
            <p>{error}</p>
            <button className="primary-action" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </section>
        </div>
      </main>
    )
  }

  if (!report) {
    return (
      <main className="interview-page">
        <div className="background-circle one"></div>
        <div className="background-circle two"></div>
        <div className="interview-container">
          <section className="content empty-state">
            <h2>No report available</h2>
            <p>Generate a new interview plan to see the dashboard here.</p>
            <button className="primary-action" onClick={() => navigate('/')}>
              Generate a Report
            </button>
          </section>
        </div>
      </main>
    )
  }

  const matchScore = report.matchScore ?? 0
  const evidence = Array.isArray(report.requirementEvidence) ? report.requirementEvidence : null
  // Matched first, then missing; heavier skills first within each group.
  const checklist = evidence
    ? [...evidence].sort((a, b) => Number(b.matched) - Number(a.matched) || b.weight - a.weight)
    : []
  const matchedCount = checklist.filter((item) => item.matched).length
  // Prefer the saved skillGaps; fall back to deriving them from the evidence.
  const skillGaps = Array.isArray(report.skillGaps) && report.skillGaps.length
    ? report.skillGaps
    : checklist.filter((item) => !item.matched).map((item) => ({ skill: item.skill, severity: priorityFor(item.weight) }))
  const fitLabel =
    matchScore >= 80 ? 'Strong fit' : matchScore >= 60 ? 'Promising fit' : 'Needs preparation'

  const tabs = [
    { id: 'technical', label: 'Technical Questions', count: technical.length },
    { id: 'behavioral', label: 'Behavioral Questions', count: behavioral.length },
    { id: 'roadmap', label: 'Preparation Roadmap', count: roadmap.length },
  ]

  return (
    <main className="interview-page">
      <div className="background-circle one"></div>
      <div className="background-circle two"></div>

      <div className="interview-container">
        <header className="page-header">
          <div className="page-heading">
            <p className="badge">{report.title}</p>
            <h1>Interview Preparation Dashboard</h1>
            <p>
              Practice targeted questions, fix your gaps, and follow a practical
              prep roadmap for this role.
            </p>
          </div>

          <div className="header-actions">
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={handleResumeReupload}
            />
            <button
              className="action-btn ghost"
              onClick={() => resumeInputRef.current?.click()}
              disabled={reuploading || loading}
              title="Upload an updated resume and re-run the analysis against this same job description"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M3 19H21V21H3V19ZM13 5.82843V17H11V5.82843L4.92893 11.8995L3.51472 10.4853L12 2L20.4853 10.4853L19.0711 11.8995L13 5.82843Z"></path>
              </svg>
              {reuploading ? 'Analysing new resume…' : 'Re-upload Resume'}
            </button>

            <button
              className="action-btn primary"
              onClick={() => getResumePdf(interviewId)}
              disabled={loading || reuploading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path>
              </svg>
              {loading && !reuploading ? 'Downloading…' : 'Download Resume'}
            </button>

            <button className="action-btn ghost" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M4 18H6V20H18V4H6V6H4V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V18ZM6 11H13V13H6V16L1 12L6 8V11Z"></path>
              </svg>
              Logout
            </button>
          </div>
        </header>

        {reuploading && (
          <div className="page-notice info">
            <div className="mini-spinner" aria-hidden="true"></div>
            Analysing your new resume against the same job description. This can take up to a minute…
          </div>
        )}
        {reuploadError && !reuploading && (
          <div className="page-notice error" role="alert">{reuploadError}</div>
        )}

        <section className="summary-row">
          <div className="score-card">
            <div className="score-circle">{matchScore}%</div>
            <div className="match-status">
              <h4>Match Score · v{report.version || 1}</h4>
              <strong>{fitLabel}</strong>
              {evidence && checklist.length > 0 && (
                <p>
                  {matchedCount} of {checklist.length} job skills found in your resume
                </p>
              )}
            </div>
          </div>

          {evidence && (
            <div className="checklist-card">
              <div className="match-checklist-header">
                <span className="match-label">Skills checklist</span>
                <span className="match-count">
                  {matchedCount} / {checklist.length} matched
                </span>
              </div>

              {checklist.length === 0 ? (
                <p className="match-empty">No recognised skills found in the job description.</p>
              ) : (
                <ul className="match-checklist">
                  {checklist.map((item) => (
                    <li
                      key={item.skill}
                      className={item.matched ? 'matched' : 'missing'}
                      title={
                        item.matched
                          ? `Found in your resume: "…${item.candidateEvidence}…"`
                          : `Asked for in the job description: "…${item.jobEvidence}…"`
                      }
                    >
                      <span className="check-icon" aria-hidden="true">
                        {item.matched ? '✓' : '✗'}
                      </span>
                      <span className="check-skill">{item.skill}</span>
                      {item.matched ? (
                        <span className="check-tag">{item.required ? 'Required' : 'Nice to have'}</span>
                      ) : (
                        <span className={`severity ${priorityFor(item.weight)}`}>
                          {priorityFor(item.weight)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="gaps-card">
            <div className="match-checklist-header">
              <span className="match-label">Skill gaps</span>
              <span className="match-count">{skillGaps.length}</span>
            </div>

            {skillGaps.length === 0 ? (
              <div className="no-gaps">
                <span className="check-icon" aria-hidden="true">✓</span>
                <p>
                  No skill gaps. {checklist.length > 0
                    ? `All ${checklist.length} skills in the job description were found in your resume.`
                    : 'No tracked skills were found in the job description.'}
                </p>
              </div>
            ) : (
              <ul className="gap-list">
                {skillGaps.map((gap) => (
                  <li key={gap.skill}>
                    <span>{gap.skill}</span>
                    <span className={`severity ${gap.severity}`}>{gap.severity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <ResumeProgress
          currentId={report._id}
          onSelect={(id) => {
            setActiveTab('technical')
            setSelectedIndex(0)
            navigate(`/interview/${id}`)
          }}
        />

        <div className="dashboard">
          <aside className="sidebar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => changeTab(tab.id)}
              >
                <span>{tab.label}</span>
                <span className="tab-count">{tab.count}</span>
              </button>
            ))}
          </aside>

          <section className="content">
            {activeTab === 'technical' && currentTechnical ? (
              <>
                <div className="content-header">
                  <span className="question-chip">
                    Question {selectedIndex + 1} of {technical.length}
                  </span>
                </div>

                <div className="card">
                  <h2>Question</h2>
                  <p>{currentTechnical.question}</p>
                </div>

                <div className="card">
                  <h2>Interviewer&apos;s Intention</h2>
                  <p>{currentTechnical.intention}</p>
                </div>

                <div className="card">
                  <h2>Recommended Answer</h2>
                  <p>{currentTechnical.answer}</p>
                </div>
              </>
            ) : null}

            {activeTab === 'behavioral' && currentBehavioral ? (
              <>
                <div className="content-header">
                  <span className="question-chip">
                    Question {selectedIndex + 1} of {behavioral.length}
                  </span>
                </div>

                <div className="card">
                  <h2>Question</h2>
                  <p>{currentBehavioral.question}</p>
                </div>

                <div className="card">
                  <h2>Interviewer&apos;s Intention</h2>
                  <p>{currentBehavioral.intention}</p>
                </div>

                <div className="card">
                  <h2>Recommended Answer</h2>
                  <p>{currentBehavioral.answer}</p>
                </div>
              </>
            ) : null}

            {activeTab === 'roadmap' && currentRoadmap ? (
              <>
                <div className="content-header">
                  <span className="question-chip">
                    Day {selectedIndex + 1} of {roadmap.length}
                  </span>
                </div>

                <div className="card timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h2>Day {currentRoadmap.day}</h2>
                      <h3>{currentRoadmap.focus}</h3>
                      <ul>
                        {currentRoadmap.task.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {activeTab === 'technical' && technical.length === 0 ? (
              <div className="empty-state compact-empty-state">
                <h2>No technical questions yet</h2>
                <p>This report did not include technical prompts.</p>
              </div>
            ) : null}

            {activeTab === 'behavioral' && behavioral.length === 0 ? (
              <div className="empty-state compact-empty-state">
                <h2>No behavioral questions yet</h2>
                <p>This report did not include behavioral prompts.</p>
              </div>
            ) : null}

            {activeTab === 'roadmap' && roadmap.length === 0 ? (
              <div className="empty-state compact-empty-state">
                <h2>No preparation roadmap yet</h2>
                <p>This report did not include a day-by-day plan.</p>
              </div>
            ) : null}

            <div className="navigation">
              <button onClick={previousItem} disabled={selectedIndex === 0}>
                Previous
              </button>

              <button onClick={nextItem} disabled={selectedIndex >= activeList.length - 1}>
                Next
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
