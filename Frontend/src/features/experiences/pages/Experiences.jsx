import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createExperience, getExperiences } from '../services/experience.api'
import '../style/experiences.scss'

export const Experiences = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState({ company: '', role: '', experience: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [message, setMessage] = useState('')
  const [expandedPostId, setExpandedPostId] = useState(null)

  useEffect(() => {
    getExperiences()
      .then((data) => {
        setPosts(data.interviewExperiences || [])
        setNextCursor(data.pageInfo?.nextCursor || null)
      })
      .catch(() => setMessage('Unable to load community experiences right now.'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!form.company.trim() || !form.role.trim() || !form.experience.trim()) {
      setMessage('Please complete all fields before sharing.')
      return
    }

    setSubmitting(true)
    try {
      const data = await createExperience(form)
      setPosts((current) => [data.interviewExperience, ...current])
      setForm({ company: '', role: '', experience: '' })
      setMessage('Your experience is now visible to the community.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to share your experience. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await getExperiences({ cursor: nextCursor })
      setPosts((current) => [...current, ...(data.interviewExperiences || [])])
      setNextCursor(data.pageInfo?.nextCursor || null)
    } catch {
      setMessage('Unable to load more community experiences right now.')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <main className="experiences-page">
      <div className="experience-orb experience-orb-one" />
      <div className="experience-orb experience-orb-two" />
      <div className="experiences-container">
        <nav className="community-nav">
          
          <span>Interview community</span>
        </nav>

        <header className="community-hero">
          <p className="community-eyebrow">Learn from real interviews</p>
          <h1>Share what happened. Help someone prepare.</h1>
          <p>Post the questions, rounds, and takeaways from your interview so others can walk in more confident.</p>
        </header>

        <div className="community-layout">
          <section className="share-card">
            <h2>Share your experience</h2>
            <p>Your post will be visible to everyone in the community.</p>
            <form onSubmit={handleSubmit}>
              <div className="field-row">
                <label>Company
                  <input name="company" value={form.company} onChange={handleChange} maxLength="100" placeholder="e.g. Google" />
                </label>
                <label>Role
                  <input name="role" value={form.role} onChange={handleChange} maxLength="100" placeholder="e.g. Frontend Developer" />
                </label>
              </div>
              <label>What was your interview like?
                <textarea name="experience" value={form.experience} onChange={handleChange} maxLength="10000" placeholder="Describe the rounds, questions, what went well, and what you would do differently..." />
              </label>
              <div className="form-footer">
                <small>{form.experience.length}/10000</small>
                <button type="submit" disabled={submitting}>{submitting ? 'Sharing...' : 'Share experience'}</button>
              </div>
            </form>
            {message && <p className="community-message">{message}</p>}
          </section>

          <section className="feed-section">
            <div className="feed-heading"><div><p className="community-eyebrow">Community feed</p><h2>Recent experiences</h2></div><span>{posts.length} shared</span></div>
            {loading ? <p className="feed-status">Loading experiences...</p> : posts.length ? (
              <>
                <div className="post-list">
                  {posts.map((post) => {
                    const structured = post.structuredExperience
                    const isExpanded = expandedPostId === post._id
                    return <article className="experience-post" key={post._id}>
                      <div className="post-topline"><div className="company-mark">{post.company.charAt(0).toUpperCase()}</div><div><h3>{post.company}</h3><p>{post.role} · shared by {post.user?.username || 'Community member'}</p></div><time>{new Date(post.createdAt).toLocaleDateString()}</time></div>
                      <p className="post-copy">{post.experience}</p>
                      {structured?.rounds?.length ? <>
                        <button type="button" className="structured-toggle" onClick={() => setExpandedPostId(isExpanded ? null : post._id)}>{isExpanded ? 'Hide structured result' : 'View structured result'}</button>
                        {isExpanded ? <section className="structured-result">
                          <p className="structured-note">Tags are AI-organized from the author&apos;s original experience; they are not additional facts.</p>
                          {structured.rounds.map((round, roundIndex) => <div className="round-card" key={`${post._id}-${roundIndex}`}>
                            <div className="round-header"><h4>Round {roundIndex + 1}: {round.name}</h4><span>{round.type}</span></div>
                            {round.items.map((item, itemIndex) => <div className="structured-item" key={`${post._id}-${roundIndex}-${itemIndex}`}>
                              <p><strong>{item.kind === 'question' ? 'Question' : item.kind === 'activity' ? 'Activity' : 'Statement'}:</strong> {item.content}</p>
                              <div className="tag-row"><span className="primary-tag">{item.primaryTag}</span>{item.secondaryTags.map((tag) => <span className="secondary-tag" key={tag}>{tag}</span>)}</div>
                            </div>)}
                          </div>)}
                          {structured.unclassifiedContent?.length ? <div className="unclassified-card"><h4>Unclassified content</h4>{structured.unclassifiedContent.map((item, index) => <p key={index}>{item}</p>)}</div> : null}
                          {structured.integritySummary ? <div className="integrity-summary"><strong>Data integrity</strong><span>{structured.integritySummary.questionsOrganized} questions organized · {structured.integritySummary.questionsWithTopicTags} tagged · {structured.integritySummary.unclassifiedItems} unclassified</span></div> : null}
                        </section> : null}
                      </> : null}
                    </article>
                  })}
                </div>
                {nextCursor ? <button type="button" className="load-more" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading...' : 'Load more'}</button> : null}
              </>
            ) : <div className="feed-empty"><h3>Be the first to share</h3><p>A helpful interview story can make a real difference for the next candidate.</p></div>}
          </section>
        </div>
      </div>
    </main>
  )
}
