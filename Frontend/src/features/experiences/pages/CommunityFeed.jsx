import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getExperiences } from '../services/experience.api'
import '../style/experiences.scss'

export const CommunityFeed = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [message, setMessage] = useState('')

  const loadPosts = async (cursor) => {
    const data = await getExperiences({ cursor })
    setPosts((current) => cursor ? [...current, ...(data.interviewExperiences || [])] : (data.interviewExperiences || []))
    setNextCursor(data.pageInfo?.nextCursor || null)
  }

  useEffect(() => {
    getExperiences()
      .then((data) => {
        setPosts(data.interviewExperiences || [])
        setNextCursor(data.pageInfo?.nextCursor || null)
      })
      .catch(() => setMessage('Unable to load community experiences right now.'))
      .finally(() => setLoading(false))
  }, [])

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try { await loadPosts(nextCursor) } catch { setMessage('Unable to load more community experiences right now.') } finally { setLoadingMore(false) }
  }

  return <main className="experiences-page">
    <div className="experience-orb experience-orb-one" /><div className="experience-orb experience-orb-two" />
    <div className="experiences-container">
      <nav className="community-nav"><button type="button" onClick={() => navigate('/')}>← Back to dashboard</button><button type="button" className="add-experience-button" onClick={() => navigate('/experiences/new')}>+ Add experience</button></nav>
      <header className="community-hero community-hero--compact"><p className="community-eyebrow">Interview community</p><h1>Learn from real interview experiences.</h1><p>Browse shared interview stories, then open any post for its complete experience and AI-organized round breakdown.</p></header>
      <section className="feed-section feed-section--full">
        <div className="feed-heading"><div><p className="community-eyebrow">Community feed</p><h2>Recent experiences</h2></div><span>{posts.length} shown</span></div>
        {message ? <p className="community-message">{message}</p> : null}
        {loading ? <p className="feed-status">Loading experiences...</p> : posts.length ? <><div className="post-list">
          {posts.map((post) => <article className="experience-post experience-post--horizontal" key={post._id}><div className="company-mark">{post.company.charAt(0).toUpperCase()}</div><div className="post-main"><div className="post-topline"><div><h3>{post.company}</h3><p>{post.role} · shared by {post.user?.username || 'Community member'}</p></div><time>{new Date(post.createdAt).toLocaleDateString()}</time></div><p className="post-copy post-copy--preview">{post.experience}</p></div><button type="button" className="read-more-button" onClick={() => navigate(`/experiences/${post._id}`)}>Read more →</button></article>)}
        </div>{nextCursor ? <button type="button" className="load-more" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading...' : 'Load more experiences'}</button> : null}</> : <div className="feed-empty"><h3>Be the first to share</h3><p>A helpful interview story can make a real difference for the next candidate.</p></div>}
      </section>
    </div>
  </main>
}
