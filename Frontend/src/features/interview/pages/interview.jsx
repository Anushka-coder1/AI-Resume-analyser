import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview'

export const Interview = () => {
  const { interviewId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('technical')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { report, loading, error, getReportById } = useInterview()

  useEffect(() => {
    if (!interviewId || report?._id === interviewId) {
      return
    }

    getReportById({ interviewId }).catch(() => {})
  }, [getReportById, interviewId, report?._id])

  const technical = report?.technicalQuestions ?? []
  const behavioral = report?.behavioralQuestions ?? []
  const skillGaps = report?.skillGaps ?? []
  const roadmap = report?.preparationPlan ?? []

  const currentTechnical = technical[selectedIndex]
  const currentBehavioral = behavioral[selectedIndex]
  const currentRoadmap = roadmap[selectedIndex]

  const nextItem = () => {
    if (activeTab === 'technical' && selectedIndex < technical.length - 1) {
      setSelectedIndex((value) => value + 1)
    }

    if (activeTab === 'behavioral' && selectedIndex < behavioral.length - 1) {
      setSelectedIndex((value) => value + 1)
    }

    if (activeTab === 'roadmap' && selectedIndex < roadmap.length - 1) {
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

  return (
    <main className="interview-page">
      <div className="background-circle one"></div>
      <div className="background-circle two"></div>

      <div className="interview-container">
        <div className="page-header">
          <div>
            <p className="badge">{report.title}</p>
            <h1>Interview Preparation Dashboard</h1>
            <p>
              Practice targeted questions, fix your gaps, and follow a practical prep
              roadmap for this role.
            </p>
          </div>

          <div className="score-card">
            <h4>Match Score</h4>
            <div className="score-circle">{matchScore}%</div>
            <div className="match-status">
              <strong>
                {matchScore >= 80
                  ? 'Strong fit'
                  : matchScore >= 60
                    ? 'Promising fit'
                    : 'Needs preparation'}
              </strong>
              <p>{report.title}</p>
            </div>
          </div>
        </div>

        <div className="dashboard">
          <aside className="sidebar">
            <button
              className={activeTab === 'technical' ? 'active' : ''}
              onClick={() => changeTab('technical')}
            >
              Technical Questions
            </button>

            <button
              className={activeTab === 'behavioral' ? 'active' : ''}
              onClick={() => changeTab('behavioral')}
            >
              Behavioral Questions
            </button>

            <button
              className={activeTab === 'roadmap' ? 'active' : ''}
              onClick={() => changeTab('roadmap')}
            >
              Preparation Roadmap
            </button>
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

              <button onClick={nextItem}>Next</button>
            </div>
          </section>

          <aside className="skill-panel">
            <h3>Skill Gaps</h3>
            <div className="skills">
              {skillGaps.length ? (
                skillGaps.map((skill, index) => (
                  <div className="skill-card" key={index}>
                    <span>{skill.skill}</span>
                    <small className={`severity ${skill.severity}`}>{skill.severity}</small>
                  </div>
                ))
              ) : (
                <div className="skill-card">
                  <span>No major skill gaps were flagged in this report.</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
