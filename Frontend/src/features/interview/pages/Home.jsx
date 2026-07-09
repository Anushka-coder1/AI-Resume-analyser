import "../style/home.scss";

export const Home = () => {
  return (
    <main className="home">

      {/* Background Effects */}
      <div className="bg-gradient bg-1"></div>
      <div className="bg-gradient bg-2"></div>

      <div className="container">

        {/* Hero */}
        <section className="hero">

          <div className="hero-badge">
            AI Powered Interview Preparation
          </div>

          <h1>
            AI Resume
            <span> Analyzer</span>
          </h1>

          <p>
            Upload your resume, paste the job description and let AI generate
            personalized interview questions, identify skill gaps and prepare a
            roadmap for your next interview.
          </p>

          <div className="hero-features">

            <div className="feature-card">
              <span>📄</span>
              <div>
                <h4>Resume Analysis</h4>
                <p>ATS style evaluation</p>
              </div>
            </div>

            <div className="feature-card">
              <span>🎯</span>
              <div>
                <h4>Interview Questions</h4>
                <p>Technical + Behavioural</p>
              </div>
            </div>

            <div className="feature-card">
              <span>📈</span>
              <div>
                <h4>Preparation Plan</h4>
                <p>Personalized roadmap</p>
              </div>
            </div>

          </div>

        </section>

        {/* Main Form */}

        <section className="interview-form">

          {/* Job Description */}

          <div className="glass-card">

            <div className="section-title">
              <div className="icon">💼</div>

              <div>
                <h3>Job Description</h3>
                <p>
                  Paste the complete job description to get a better analysis.
                </p>
              </div>

            </div>

            <textarea
              className="jobDescription"
              id="jobDescription"
              placeholder="Paste the complete job description here..."
            />

          </div>

          {/* Bottom Grid */}

          <div className="bottom-grid">

            {/* Resume */}

            <div className="glass-card">

              <div className="section-title">

                <div className="icon">📄</div>

                <div>
                  <h3>Resume</h3>

                  <p>
                    PDF format recommended
                  </p>

                </div>

              </div>

              <div className="upload-area">

                <div className="upload-icon">
                  ☁️
                </div>

                <h4>Drag & Drop Resume</h4>

                <p>
                  or
                </p>

                <label
                  htmlFor="resume"
                  className="upload-btn"
                >
                  Browse PDF
                </label>

                <input
                  type="file"
                  id="resume"
                  accept=".pdf"
                />

                <small>
                  Supported format : PDF
                </small>

              </div>

            </div>

            {/* Self Description */}

            <div className="glass-card">

              <div className="section-title">

                <div className="icon">👤</div>

                <div>

                  <h3>Self Description</h3>

                  <p>
                    Tell the AI about yourself.
                  </p>

                </div>

              </div>

              <textarea
                className="selfDescription"
                id="selfDescription"
                placeholder="Example:

• Passionate Full Stack Developer
• MERN Stack
• React.js, Node.js, MongoDB
• Good problem solving skills
• Built AI projects
• Strong communication
• Team player
"
              />

            </div>

          </div>

          {/* Tips */}

          <div className="tips-card">

            <div className="tips-header">
              💡 Tips for Best Results
            </div>

            <ul>

              <li>
                Upload your latest resume.
              </li>

              <li>
                Paste the complete job description.
              </li>

              <li>
                Add a short self introduction.
              </li>

              <li>
                Mention your strongest technical skills.
              </li>

            </ul>

          </div>

          {/* CTA */}

          <button className="generate-btn">

            <span>✨</span>

            Generate AI Interview Report

          </button>

        </section>

      </div>

    </main>
  );
};