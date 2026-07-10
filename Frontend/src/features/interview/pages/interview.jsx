import { useState } from "react";
import "../style/interview.scss";

export const Interview = () => {
  const [activeTab, setActiveTab] = useState("technical");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // if (!interviewReport) {
  //   return (
  //     <div className="interview-page">
  //       <h2>No Interview Report Found</h2>
  //     </div>
  //   );
  // }



  // const {
  //   matchScore,
  //   technicalQuestion,
  //   behavioralQuestion,
  //   preparationPlan,
  //   skillGaps,
  // } = interviewReport;

  const matchScore = 85
  const technicalQuestions=  [
            {
                "question": "Explain the architecture of a MERN stack application and how its components interact.",
                "intention": "Assess understanding of MERN integration, component roles, and overall system design.",
                "answer": "Discuss MongoDB (NoSQL database for data storage), Express.js (backend web framework for routing and API creation), React.js (frontend library for building user interfaces), and Node.js (runtime environment for Express). Explain how React makes API requests to Express, which then interacts with MongoDB, and how data flows through these layers."
            },
            {
                "question": "What are React Hooks, and when would you use `useState` vs. `useReducer`?",
                "intention": "Evaluate knowledge of modern React state management patterns and their appropriate use cases.",
                "answer": "Explain that React Hooks are functions that let you 'hook into' React state and lifecycle features from functional components. Describe `useState` for managing simple, independent state variables. Explain `useReducer` for more complex state logic that involves multiple sub-values or when the next state depends on the previous one, similar to Redux patterns."
            },
            {
                "question": "Describe how Node.js handles asynchronous operations and what 'non-blocking I/O' means in that context.",
                "intention": "Test understanding of Node.js core principles, performance, and concurrency model.",
                "answer": "Explain that Node.js uses a single-threaded event loop. Non-blocking I/O means that Node.js does not wait for I/O operations (like database queries or file system access) to complete. Instead, it offloads the operation and continues processing other code. Once the I/O operation finishes, its callback is placed in the event queue and executed by the event loop when the call stack is empty. Mention the libuv library."
            },
            {
                "question": "Can you describe a project where you integrated AI APIs into a web application? What challenges did you face and how did you overcome them?",
                "intention": "Assess practical experience with API integration, problem-solving skills, and understanding of AI service usage.",
                "answer": "Describe a specific project. Detail the AI API used (e.g., OpenAI, Google Cloud AI), the purpose of integration, the technical steps involved (authentication, request/response handling, data parsing), and the challenges encountered (e.g., rate limiting, error handling, latency, data formatting) and how you addressed them."
            }
        ]
      const behavioralQuestions = [
            {
                "question": "Tell me about a time you had to work closely with a team to achieve a project goal. What was your role, and what was the outcome?",
                "intention": "Assess teamwork, collaboration, communication, and individual contribution within a group setting.",
                "answer": "Use the STAR method (Situation, Task, Action, Result). Describe a specific project, your responsibilities within the team, how you communicated and collaborated with others, any conflicts or challenges, and the successful outcome of the project."
            },
            {
                "question": "Describe a situation where you had to learn a new technology quickly for a project. How did you approach it, and what was the result?",
                "intention": "Evaluate adaptability, self-learning capabilities, resourcefulness, and ability to apply new knowledge effectively.",
                "answer": "Use the STAR method. Describe the new technology and why it was needed. Explain your learning strategy (e.g., official documentation, tutorials, online courses, experimentation) and how you applied it to the project. Detail the positive outcome achieved due to your rapid learning."
            },
            {
                "question": "Tell me about a challenging technical problem you faced and how you went about solving it.",
                "intention": "Assess problem-solving methodology, debugging skills, critical thinking, and resilience when encountering difficulties.",
                "answer": "Use the STAR method. Describe a complex technical challenge (e.g., a difficult bug, a performance issue). Explain your step-by-step approach to diagnose and resolve it, including any research, experimentation, or collaboration involved. Highlight the final solution and any lessons learned."
            }
        ]
      const skillGaps = [
            {
                "skill": "Automated Testing (Unit, Integration)",
                "severity": "medium"
            },
            {
                "skill": "CI/CD & DevOps Practices",
                "severity": "medium"
            },
            {
                "skill": "Advanced Database Optimization (MongoDB)",
                "severity": "low"
            }
        ]
      const preparationPlan = [
            {
                "day": 1,
                "focus": "React.js & State Management",
                "task": [
                    "Review React Hooks (useState, useEffect, useContext, useReducer) deeply. Practice building a small interactive component with complex state management. Read official React documentation on these topics and related patterns."
                ],
                "_id": "6a4f91c0e862bb5cdfa99982"
            },
            {
                "day": 2,
                "focus": "Node.js, Express & MongoDB",
                "task": [
                    "Deep dive into Node.js asynchronous programming model, event loop, and callback/promise/async-await patterns. Practice building RESTful APIs with Express.js. Review MongoDB indexing, aggregation pipelines, and Mongoose operations. Consider database scaling basics."
                ],
                "_id": "6a4f91c0e862bb5cdfa99983"
            },
            {
                "day": 3,
                "focus": "System Design & AI API Integration",
                "task": [
                    "Study fundamental system design concepts for web applications (e.g., load balancing, caching, microservices vs. monolith). Prepare to discuss past AI API integration projects, focusing on architecture, error handling, security, and performance considerations. Research common AI APIs."
                ],
                "_id": "6a4f91c0e862bb5cdfa99984"
            },
            {
                "day": 4,
                "focus": "Data Structures & Algorithms",
                "task": [
                    "Solve 3-5 medium-level LeetCode problems focusing on common data structures like arrays, strings, trees, and graphs. Pay attention to time and space complexity analysis. Review concepts like sorting, searching, and dynamic programming."
                ],
                "_id": "6a4f91c0e862bb5cdfa99985"
            },
            {
                "day": 5,
                "focus": "Behavioral & Project Deep Dive / Mock Interview",
                "task": [
                    "Practice answering common behavioral questions using the STAR method. Prepare to discuss all projects from your resume in detail, focusing on challenges, your contributions, and lessons learned. Conduct a mock interview to simulate the actual experience and get feedback."
                ]
              }
              ]

  const technical = technicalQuestions || [];
  const behavioral = behavioralQuestions || [];
  const roadmap = preparationPlan || [];

  const currentTechnical = technical[selectedIndex];
  const currentBehavioral = behavioral[selectedIndex];

  const nextItem = () => {
    if (activeTab === "technical") {
      if (selectedIndex < technical.length - 1)
        setSelectedIndex(selectedIndex + 1);
    }

    if (activeTab === "behavioral") {
      if (selectedIndex < behavioral.length - 1)
        setSelectedIndex(selectedIndex + 1);
    }

    if (activeTab === "roadmap") {
      if (selectedIndex < roadmap.length - 1)
        setSelectedIndex(selectedIndex + 1);
    }
  };

  const previousItem = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSelectedIndex(0);
  };

  return (
    <main className="interview-page">

      <div className="background-circle one"></div>
      <div className="background-circle two"></div>

      <div className="interview-container">

        {/* Header */}

        <div className="page-header">

          <div>

            <h1>Interview Preparation Dashboard</h1>

            <p>
              Practice interview questions, identify your weak areas and
              complete the preparation roadmap.
            </p>

          </div>

          <div className="score-card">

            <h4>Match Score</h4>

            <div className="score-circle">
              {matchScore}%
            </div>

          </div>

        </div>

        {/* Dashboard */}

        <div className="dashboard">

          {/* Sidebar */}

          <aside className="sidebar">

            <button
              className={activeTab === "technical" ? "active" : ""}
              onClick={() => changeTab("technical")}
            >
              Technical Questions
            </button>

            <button
              className={activeTab === "behavioral" ? "active" : ""}
              onClick={() => changeTab("behavioral")}
            >
              Behavioral Questions
            </button>

            <button
              className={activeTab === "roadmap" ? "active" : ""}
              onClick={() => changeTab("roadmap")}
            >
              Preparation Roadmap
            </button>

          </aside>

          {/* Main */}

          <section className="content">

            {/* Technical */}

            {activeTab === "technical" && currentTechnical && (

              <>

                <div className="content-header">

                  <span>
                    Question {selectedIndex + 1} of {technical.length}
                  </span>

                </div>

                <div className="card">

                  <h2>Question</h2>

                  <p>{currentTechnical.question}</p>

                </div>

                <div className="card">

                  <h2>Interviewer's Intention</h2>

                  <p>{currentTechnical.intention}</p>

                </div>

                <div className="card">

                  <h2>Recommended Answer</h2>

                  <p>{currentTechnical.answer}</p>

                </div>

              </>

            )}

            {/* Behavioral */}

            {activeTab === "behavioral" && currentBehavioral && (

              <>

                <div className="content-header">

                  <span>
                    Question {selectedIndex + 1} of {behavioral.length}
                  </span>

                </div>

                <div className="card">

                  <h2>Question</h2>

                  <p>{currentBehavioral.question}</p>

                </div>

                <div className="card">

                  <h2>Interviewer's Intention</h2>

                  <p>{currentBehavioral.intention}</p>

                </div>

                <div className="card">

                  <h2>Recommended Answer</h2>

                  <p>{currentBehavioral.answer}</p>

                </div>

              </>

            )}

            {/* Roadmap */}

            {activeTab === "roadmap" && roadmap[selectedIndex] && (

              <>

                <div className="card">

                  <h2>Day {roadmap[selectedIndex].day}</h2>

                  <h3>{roadmap[selectedIndex].focus}</h3>

                  <ul>

                    {roadmap[selectedIndex].task.map((item, index) => (

                      <li key={index}>{item}</li>

                    ))}

                  </ul>

                </div>

              </>

            )}

            {/* Navigation */}

            <div className="navigation">

              <button
                onClick={previousItem}
                disabled={selectedIndex === 0}
              >
                ← Previous
              </button>

              <button onClick={nextItem}>
                Next →
              </button>

            </div>

          </section>

          {/* Right Sidebar */}

          <aside className="skill-panel">

            <h3>Skill Gaps</h3>

            <div className="skills">

              {skillGaps.map((skill, index) => (

                <div className="skill-card" key={index}>

                  <span>{skill.skill}</span>

                  <small
                    className={`severity ${skill.severity}`}
                  >
                    {skill.severity}
                  </small>

                </div>

              ))}

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
};