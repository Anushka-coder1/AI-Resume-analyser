const { orderTopics, buildSchedule } = require('../src/services/roadmap.service')

describe('roadmap scheduling helpers', () => {
  test('orders topic prerequisites before dependent topics', () => {
    const fundamentals = { _id: 'topic-1', order: 2, prerequisites: [] }
    const advanced = { _id: 'topic-2', order: 1, prerequisites: ['topic-1'] }
    expect(orderTopics([advanced, fundamentals]).map((topic) => topic._id)).toEqual(['topic-1', 'topic-2'])
  })

  test('does not exceed the selected daily study-hour limit', () => {
    const skill = { _id: 'skill-1' }
    const content = [{
      skill,
      topics: [{ _id: 'topic-1', title: 'Fundamentals', description: 'Learn foundations', estimatedHours: 3, prerequisites: [] }],
      resources: new Map([['topic-1', [{ title: 'Official docs', type: 'documentation', url: 'https://example.com', platform: 'Example' }]]]),
      project: null,
    }]
    const tasks = buildSchedule({ content, dailyStudyHours: 2, durationInDays: 2, startDate: '2026-01-01' })
    expect(tasks).toHaveLength(2)
    expect(tasks.map((task) => task.estimatedHours)).toEqual([2, 1])
    expect(tasks[0].resources[0].url).toBe('https://example.com')
  })

  test('does not schedule topics already completed during regeneration', () => {
    const tasks = buildSchedule({
      content: [{ skill: { _id: 'skill-1' }, topics: [{ _id: 'topic-complete', title: 'Done', description: '', estimatedHours: 1 }, { _id: 'topic-next', title: 'Next', description: '', estimatedHours: 1 }], resources: new Map(), project: null }],
      dailyStudyHours: 2,
      durationInDays: 2,
      startDate: '2026-01-01',
      completedTopicIds: new Set(['topic-complete']),
    })
    expect(tasks.map((task) => task.topicId)).toEqual(['topic-next'])
  })
})
