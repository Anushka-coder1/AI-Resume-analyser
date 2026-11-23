import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview'
import { ResumeProgress } from '../components/ResumeProgress'
import { generateRoadmap } from '../services/roadmap.api'
import {
  deleteInterviewReport,
  renameInterviewReport,
} from '../services/interview.api'
import { Trash, SquarePen , Upload} from 'lucide-react'
const priorityFor = (weight) =>
  weight >= 5 ? 'high' : weight >= 3 ? 'medium' : 'low'

export const Interview = () => {
  const { interviewId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('technical')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const {
    report,
    loading,
    error,
    getReportById,
    getResumePdf,
    generateReport,
    getReports,
  } = useInterview()
  const [message, setMessage] = useState('')
  const resumeInputRef = useRef(null)
  const [reuploading, setReuploading] = useState(false)
  const [reuploadError, setReuploadError] = useState('')
  const [creatingSkillRoadmap, setCreatingSkillRoadmap] = useState('')

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
      setReuploadError(
        err.response?.data?.message ||
          'Could not analyse the new resume. Please try again.',
      )
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
    activeTab === 'technical'
      ? technical
      : activeTab === 'behavioral'
        ? behavioral
        : roadmap

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

  const openSkillRoadmap = async (skillName) => {
    setCreatingSkillRoadmap(skillName)
    try {
      const result = await generateRoadmap({ reportId: interviewId, skillName })
      navigate(`/roadmaps?roadmapId=${result.roadmap._id}`)
    } catch (err) {
      setReuploadError(
        err.response?.data?.message ||
          'Gemini could not create this learning roadmap. Please try again.',
      )
    } finally {
      setCreatingSkillRoadmap('')
    }
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
  const evidence = Array.isArray(report.requirementEvidence)
    ? report.requirementEvidence
    : null
  // Matched first, then missing; heavier skills first within each group.
  const checklist = evidence
    ? [...evidence].sort(
        (a, b) => Number(b.matched) - Number(a.matched) || b.weight - a.weight,
      )
    : []
  const matchedCount = checklist.filter((item) => item.matched).length
  // Prefer the saved skillGaps; fall back to deriving them from the evidence.
  const skillGaps =
    Array.isArray(report.skillGaps) && report.skillGaps.length
      ? report.skillGaps
      : checklist
          .filter((item) => !item.matched)
          .map((item) => ({
            skill: item.skill,
            severity: priorityFor(item.weight),
          }))
  const fitLabel =
    matchScore >= 80
      ? 'Strong fit'
      : matchScore >= 60
        ? 'Promising fit'
        : 'Needs preparation'

  const tabs = [
    { id: 'technical', label: 'Technical Questions', count: technical.length },
    {
      id: 'behavioral',
      label: 'Behavioral Questions',
      count: behavioral.length,
    },
    { id: 'roadmap', label: 'Preparation Roadmap', count: roadmap.length },
  ]

  const renameReport = async (report) => {
    const title = window.prompt('Interview name', report.title)
    if (title === null || title.trim() === report.title) return
    try {
      await renameInterviewReport({
        interviewId: report._id,
        title: title.trim(),
      })
      await getReports()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to rename interview.')
    }
  }
  const removeReport = async (report) => {
    if (
      !window.confirm(
        `Delete “${report.title}” and its roadmaps? This cannot be undone.`,
      )
    )
      return
    try {
      await deleteInterviewReport({ interviewId: report._id })
      await getReports()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to delete interview.')
    }
  }

  return (
    <main className="interview-page">
      <div className="background-circle one"></div>
      <div className="background-circle two"></div>

      <div className="interview-container">
        <header className="page-header">
          <div className="page-heading">
            <p className="badge">Interview Preparation Dashboard</p>
            <h1>{report.title} </h1>
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
              <Upload />
              {reuploading ? 'Analysing new resume…' : 'Re-upload Resume'}
            </button>

            
            <button
              className="action-btn ghost"
              type="button"
              title="Edit the name of interview report"
              onClick={() => renameReport(report)}
            >
              <SquarePen />
            </button>
            <button
              type="button"
              className="action-btn ghost"
              title="Delete the interview report"
              onClick={() => removeReport(report)}
            >
              <Trash />
            </button>
          </div>
        </header>

        {reuploading && (
          <div className="page-notice info">
            <div className="mini-spinner" aria-hidden="true"></div>
            Analysing your new resume against the same job description. This can
            take up to a minute…
          </div>
        )}
        {reuploadError && !reuploading && (
          <div className="page-notice error" role="alert">
            {reuploadError}
          </div>
        )}

        <section className="summary-row">
          <div className="score-card">
            <div className="score-circle">{matchScore}%</div>
            <div className="match-status">
              <h4>Match Score · v{report.version || 1}</h4>
              <strong>{fitLabel}</strong>
              {evidence && checklist.length > 0 && (
                <p>
                  {matchedCount} of {checklist.length} job skills found in your
                  resume
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
                <p className="match-empty">
                  No recognised skills found in the job description.
                </p>
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
                        <span className="check-tag">
                          {item.required ? 'Required' : 'Nice to have'}
                        </span>
                      ) : (
                        <span
                          className={`severity ${priorityFor(item.weight)}`}
                        >
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
                <span className="check-icon" aria-hidden="true">
                  ✓
                </span>
                <p>
                  No skill gaps.{' '}
                  {checklist.length > 0
                    ? `All ${checklist.length} skills in the job description were found in your resume.`
                    : 'No tracked skills were found in the job description.'}
                </p>
              </div>
            ) : (
              <ul className="gap-list">
                {skillGaps.map((gap) => (
                  <li key={gap.skill} className="gap-list__item">
                    <span>{gap.skill}</span>
                    <button
                      type="button"
                      className={`severity ${gap.severity}`}
                      onClick={() => openSkillRoadmap(gap.skill)}
                      disabled={Boolean(creatingSkillRoadmap)}
                      title={`Create a learning roadmap for ${gap.skill}`}
                    >
                      {creatingSkillRoadmap === gap.skill
                        ? 'Creating roadmap…'
                        : `${gap.severity} · roadmap`}
                    </button>
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

              <button
                onClick={nextItem}
                disabled={selectedIndex >= activeList.length - 1}
              >
                Next
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
