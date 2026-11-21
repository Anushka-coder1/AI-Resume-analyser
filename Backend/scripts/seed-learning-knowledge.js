require('dotenv').config()
const connectToDB = require('../src/config/database')
const mongoose = require('mongoose')
const { Skill, SkillAlias, LearningPath, Topic, Resource, LearningProject } = require('../src/models/learning-knowledge.model')

const knowledge = [
  { name: 'JavaScript', aliases: ['javascript', 'ecmascript', 'es6'], category: 'Programming language', difficulty: 'beginner', hours: 24, url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', platform: 'MDN', topics: [['Language fundamentals', 'Values, functions, objects, and modules.', 7], ['Asynchronous JavaScript', 'Promises, async/await, and error handling.', 7], ['Browser and API patterns', 'DOM, fetch, and maintainable application patterns.', 10]], project: ['Interactive task tracker', 'Build a browser task tracker using modules, async storage, and accessible UI.', 8] },
  { name: 'React', aliases: ['react', 'reactjs', 'react.js', 'react js'], category: 'Frontend framework', difficulty: 'intermediate', hours: 26, url: 'https://react.dev/learn', platform: 'React', prerequisites: ['JavaScript'], topics: [['React foundations', 'Components, JSX, props, and state.', 7], ['State management and effects', 'Effects, derived state, and data fetching.', 9], ['Reusable UI architecture', 'Composition, forms, performance, and testing basics.', 10]], project: ['React job-board dashboard', 'Build a responsive job-board dashboard with filtering, forms, and persisted state.', 10] },
  { name: 'TypeScript', aliases: ['typescript', 'ts'], category: 'Programming language', difficulty: 'intermediate', hours: 20, url: 'https://www.typescriptlang.org/docs/', platform: 'TypeScript', prerequisites: ['JavaScript'], topics: [['Type system fundamentals', 'Types, interfaces, unions, and narrowing.', 7], ['Functions and generics', 'Typed APIs, generics, utility types, and error-safe code.', 7], ['TypeScript in applications', 'Project configuration, React typing, and migration patterns.', 6]], project: ['Typed API client', 'Create a typed client for a public API with reusable models and error handling.', 7] },
  { name: 'Node.js', aliases: ['node', 'nodejs', 'node.js'], category: 'Backend runtime', difficulty: 'intermediate', hours: 22, url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', platform: 'Node.js', prerequisites: ['JavaScript'], topics: [['Node runtime fundamentals', 'Modules, npm, environment variables, and filesystem APIs.', 7], ['HTTP and asynchronous services', 'Events, streams, asynchronous control flow, and HTTP.', 8], ['Production practices', 'Validation, configuration, logging, and error handling.', 7]], project: ['CLI data importer', 'Build a Node.js CLI that validates and imports JSON data safely.', 8] },
  { name: 'Express.js', aliases: ['express', 'expressjs', 'express.js'], category: 'Backend framework', difficulty: 'intermediate', hours: 16, url: 'https://expressjs.com/en/guide/routing.html', platform: 'Express', prerequisites: ['Node.js'], topics: [['Routing and middleware', 'Route design, middleware composition, and request handling.', 6], ['REST API design', 'Validation, error responses, pagination, and authentication boundaries.', 6], ['Service architecture', 'Controllers, services, persistence boundaries, and tests.', 4]], project: ['Resume notes API', 'Build a documented REST API for notes with validation and pagination.', 7] },
  { name: 'Python', aliases: ['python', 'python3'], category: 'Programming language', difficulty: 'beginner', hours: 24, url: 'https://docs.python.org/3/tutorial/', platform: 'Python', topics: [['Python fundamentals', 'Data types, control flow, functions, and modules.', 8], ['Data structures and files', 'Collections, comprehensions, files, and exceptions.', 8], ['Practical Python', 'Virtual environments, packages, testing, and clean code.', 8]], project: ['CSV insights tool', 'Create a command-line tool that validates CSV data and produces summaries.', 8] },
  { name: 'SQL', aliases: ['sql', 'postgresql', 'mysql'], category: 'Database', difficulty: 'beginner', hours: 20, url: 'https://www.postgresql.org/docs/current/tutorial.html', platform: 'PostgreSQL', topics: [['Relational foundations', 'Tables, keys, filtering, sorting, and aggregation.', 6], ['Joins and data modelling', 'Join strategies, normalization, and constraints.', 8], ['Queries for applications', 'Indexes, transactions, and query readability.', 6]], project: ['Analytics reporting queries', 'Design a small schema and write reporting queries for product analytics.', 7] },
  { name: 'MongoDB', aliases: ['mongodb', 'mongo', 'mongo db'], category: 'Database', difficulty: 'intermediate', hours: 18, url: 'https://www.mongodb.com/docs/manual/', platform: 'MongoDB', prerequisites: ['Node.js'], topics: [['Document modelling', 'Documents, collections, schema design, and indexes.', 6], ['Queries and aggregation', 'Filtering, aggregation pipelines, and performance.', 7], ['Application integration', 'Mongoose models, validation, and secure data access.', 5]], project: ['Portfolio data service', 'Build a MongoDB-backed portfolio API with indexes and validated models.', 8] },
  { name: 'Machine Learning', aliases: ['machine learning', 'ml', 'scikit-learn', 'sklearn'], category: 'AI and data', difficulty: 'intermediate', hours: 30, url: 'https://scikit-learn.org/stable/getting_started.html', platform: 'scikit-learn', prerequisites: ['Python'], topics: [['ML workflow', 'Problem framing, train/test splits, features, and evaluation.', 9], ['Supervised learning', 'Regression, classification, metrics, and model selection.', 12], ['Reliable experimentation', 'Pipelines, cross-validation, and reproducible experiments.', 9]], project: ['Model comparison notebook', 'Train and compare baseline classification models with documented metrics.', 12] },
  { name: 'Deep Learning', aliases: ['deep learning', 'neural networks', 'pytorch'], category: 'AI and data', difficulty: 'advanced', hours: 32, url: 'https://pytorch.org/tutorials/beginner/basics/intro.html', platform: 'PyTorch', prerequisites: ['Python', 'Machine Learning'], topics: [['Neural network foundations', 'Tensors, layers, activations, and optimization.', 10], ['Training workflows', 'Datasets, training loops, validation, and regularization.', 12], ['Model evaluation', 'Experiment tracking, diagnostics, and responsible deployment.', 10]], project: ['Image classifier baseline', 'Train and evaluate an image classifier with a documented experiment log.', 14] },
  { name: 'Git', aliases: ['git', 'github', 'version control'], category: 'Developer tools', difficulty: 'beginner', hours: 10, url: 'https://git-scm.com/doc', platform: 'Git', topics: [['Version-control essentials', 'Repositories, commits, branches, and remotes.', 4], ['Collaborative workflows', 'Pull requests, rebasing, conflict resolution, and history.', 3], ['Release hygiene', 'Tags, ignore rules, and useful recovery techniques.', 3]], project: ['Portfolio repository cleanup', 'Create a polished repository with branches, pull requests, and release tags.', 4] },
  { name: 'Docker', aliases: ['docker', 'containers', 'containerization'], category: 'DevOps', difficulty: 'intermediate', hours: 14, url: 'https://docs.docker.com/get-started/', platform: 'Docker', prerequisites: ['Node.js'], topics: [['Container fundamentals', 'Images, containers, Dockerfiles, and volumes.', 5], ['Multi-service development', 'Networking, Compose, environment variables, and local workflows.', 5], ['Production image practices', 'Image size, security, and reproducible builds.', 4]], project: ['Containerize an API', 'Containerize a small API and database development environment with Compose.', 6] },
]

const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9+#.]/g, '')

async function seed() {
  await connectToDB()
  const byName = new Map()
  for (const item of knowledge) {
    const skill = await Skill.findOneAndUpdate(
      { normalizedName: normalize(item.name) },
      { $set: { name: item.name, normalizedName: normalize(item.name), category: item.category, description: `${item.name} learning path`, difficulty: item.difficulty, estimatedHours: item.hours, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
    byName.set(item.name, skill)
  }

  for (const item of knowledge) {
    const skill = byName.get(item.name)
    const prerequisiteIds = (item.prerequisites || []).map((name) => byName.get(name)?._id).filter(Boolean)
    await Skill.updateOne({ _id: skill._id }, { $set: { prerequisites: prerequisiteIds } })
    await SkillAlias.findOneAndUpdate({ skillId: skill._id }, { $set: { aliases: [...new Set([item.name, ...item.aliases].map(normalize))] } }, { upsert: true })
    const path = await LearningPath.findOneAndUpdate(
      { skillId: skill._id, version: 1 },
      { $set: { title: `${item.name} foundations and practice`, description: `Verified learning path for ${item.name}.`, totalEstimatedHours: item.hours, difficulty: item.difficulty, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
    const topicIds = []
    for (let index = 0; index < item.topics.length; index += 1) {
      const [title, description, estimatedHours] = item.topics[index]
      const topic = await Topic.findOneAndUpdate(
        { learningPathId: path._id, order: index + 1 },
        { $set: { title, description, estimatedHours, difficulty: item.difficulty, subtopics: description.split(', ').slice(0, 3), prerequisites: index ? [topicIds[index - 1]] : [] } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      topicIds.push(topic._id)
      await Resource.findOneAndUpdate(
        { topicId: topic._id, url: item.url },
        { $set: { title: `${item.name} official documentation`, type: 'documentation', url: item.url, platform: item.platform, difficulty: item.difficulty, isVerified: true } },
        { upsert: true, setDefaultsOnInsert: true },
      )
    }
    const [projectTitle, projectDescription, projectHours] = item.project
    await LearningProject.findOneAndUpdate(
      { title: projectTitle },
      { $set: { skillIds: [skill._id], title: projectTitle, description: projectDescription, difficulty: item.difficulty === 'beginner' ? 'beginner' : 'intermediate', requirements: [`Apply ${item.name} fundamentals`, 'Document decisions and testing'], estimatedHours: projectHours, recommendedTopics: topicIds } },
      { upsert: true, setDefaultsOnInsert: true },
    )
  }
  console.log(`Seeded ${knowledge.length} skills and their learning paths.`)
  await mongoose.connection.close()
}

seed().catch(async (error) => { console.error(error); await mongoose.connection.close(); process.exitCode = 1 })
