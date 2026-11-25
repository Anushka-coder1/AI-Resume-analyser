import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getExperienceById } from '../services/experience.api'
import '../style/experiences.scss'

export const ExperienceDetail = () => {
  const { experienceId } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getExperienceById(experienceId)
      .then((data) => setPost(data.interviewExperience))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ||
            'Unable to load this experience.',
        ),
      )
  }, [experienceId])

  if (error)
    return (
      <main className="experiences-page">
        <div className="experiences-container detail-container">
          <button
            className="back-button"
            onClick={() => navigate('/experiences')}
          >
            ← Back to community
          </button>
          <p className="community-message">{error}</p>
        </div>
      </main>
    )
  if (!post)
    return (
      <main className="experiences-page">
        <div className="experiences-container detail-container">
          <p className="feed-status">Loading experience...</p>
        </div>
      </main>
    )
  const structured = post.structuredExperience
  return (
    <main className="experiences-page">
      <div className="experiences-container detail-container">
        <article className="experience-detail">
          <header className="detail-header">
            <div className="company-mark">
              {post.company.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="community-eyebrow">{post.role}</p>
              <h1>{post.company} interview experience</h1>
              <p>
                Shared by {post.user?.username || 'Community member'} ·{' '}
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </header>
          <section className="detail-section">
            <h2>Original experience</h2>
            <p className="post-copy">{post.experience}</p>
          </section>
          {structured?.rounds?.length ? (
            <section className="detail-section structured-result structured-result--detail">
              <h2>Structured interview result</h2>
              <p className="structured-note">
                Tags are AI-organized from the author&apos;s original
                experience; they are not additional facts.
              </p>
              {structured.rounds.map((round, roundIndex) => (
                <div className="round-card" key={roundIndex}>
                  <div className="round-header">
                    <h4>
                      Round {roundIndex + 1}: {round.name}
                    </h4>
                    <span>{round.type}</span>
                  </div>
                  {round.items.map((item, itemIndex) => (
                    <div className="structured-item" key={itemIndex}>
                      <p>
                        <strong>
                          {item.kind === 'question'
                            ? 'Question'
                            : item.kind === 'activity'
                              ? 'Activity'
                              : 'Statement'}
                          :
                        </strong>{' '}
                        {item.content}
                      </p>
                      <div className="tag-row">
                        <span className="primary-tag">{item.primaryTag}</span>
                        {item.secondaryTags.map((tag) => (
                          <span className="secondary-tag" key={tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {structured.unclassifiedContent?.length ? (
                <div className="unclassified-card">
                  <h4>Unclassified content</h4>
                  {structured.unclassifiedContent.map((item, index) => (
                    <p key={index}>{item}</p>
                  ))}
                </div>
              ) : null}
              {structured.integritySummary ? (
                <div className="integrity-summary">
                  <strong>Data integrity</strong>
                  <span>
                    {structured.integritySummary.questionsOrganized} questions
                    organized ·{' '}
                    {structured.integritySummary.questionsWithTopicTags} tagged
                    · {structured.integritySummary.unclassifiedItems}{' '}
                    unclassified
                  </span>
                </div>
              ) : null}
            </section>
          ) : null}
        </article>
      </div>
    </main>
  )
}
