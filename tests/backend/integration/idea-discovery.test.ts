import { PrismaClient } from '@prisma/client'
import express from 'express'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import authRoutes from '@/routes/auth'
import ideaRoutes from '@/routes/ideas'
import skillRoutes from '@/routes/skills'

const prisma = new PrismaClient()
const app = express()

app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/ideas', ideaRoutes)

const TEST_PREFIX = 'idea-discovery-tdd'

const seededSkillIds = {
  design: `${TEST_PREFIX}-skill-design`,
  photo: `${TEST_PREFIX}-skill-photo`,
  writing: `${TEST_PREFIX}-skill-writing`,
} as const

const seededIdeaIds = {
  designOnly: `${TEST_PREFIX}-idea-design`,
  photoOnly: `${TEST_PREFIX}-idea-photo`,
  combined: `${TEST_PREFIX}-idea-combined`,
  writingOnly: `${TEST_PREFIX}-idea-writing`,
} as const

const seededSkillNames = {
  design: 'TDD Design',
  photo: 'TDD Photography',
  writing: 'TDD Writing',
} as const

async function cleanupTestData() {
  const testUsers = await prisma.user.findMany({
    where: {
      email: {
        contains: TEST_PREFIX,
      },
    },
    select: {
      id: true,
    },
  })

  const testUserIds = testUsers.map((user) => user.id)

  if (testUserIds.length > 0) {
    await prisma.userSkill.deleteMany({
      where: {
        userId: {
          in: testUserIds,
        },
      },
    })

    await prisma.refreshToken.deleteMany({
      where: {
        userId: {
          in: testUserIds,
        },
      },
    })
  }

  await prisma.user.deleteMany({
    where: {
      id: {
        in: testUserIds,
      },
    },
  })

  await prisma.idea.deleteMany({
    where: {
      id: {
        startsWith: TEST_PREFIX,
      },
    },
  })

  await prisma.skill.deleteMany({
    where: {
      id: {
        startsWith: TEST_PREFIX,
      },
    },
  })
}

async function seedSkillsAndIdeas() {
  await prisma.skill.createMany({
    data: [
      {
        id: seededSkillIds.design,
        name: seededSkillNames.design,
        nameEn: 'Design',
        category: 'creative',
      },
      {
        id: seededSkillIds.photo,
        name: seededSkillNames.photo,
        nameEn: 'Photography',
        category: 'creative',
      },
      {
        id: seededSkillIds.writing,
        name: seededSkillNames.writing,
        nameEn: 'Writing',
        category: 'business',
      },
    ],
  })

  await prisma.idea.createMany({
    data: [
      {
        id: seededIdeaIds.designOnly,
        title: 'TDD Design Idea',
        description: 'Idea that needs design skill only',
        skills: [seededSkillNames.design],
        difficulty: 'easy',
        estimatedIncomeMin: 1000,
        estimatedIncomeMax: 2000,
        incomeUnit: 'THB',
        timeToStart: '1 day',
        requiredTools: ['Figma'],
        resources: ['https://example.com/design'],
        steps: ['Create a sample portfolio'],
      },
      {
        id: seededIdeaIds.photoOnly,
        title: 'TDD Photo Idea',
        description: 'Idea that needs photography skill only',
        skills: [seededSkillNames.photo],
        difficulty: 'easy',
        estimatedIncomeMin: 2000,
        estimatedIncomeMax: 3500,
        incomeUnit: 'THB',
        timeToStart: '2 days',
        requiredTools: ['Camera'],
        resources: ['https://example.com/photo'],
        steps: ['Shoot a sample set'],
      },
      {
        id: seededIdeaIds.combined,
        title: 'TDD Combined Idea',
        description: 'Idea that needs both design and photography',
        skills: [seededSkillNames.design, seededSkillNames.photo],
        difficulty: 'easy',
        estimatedIncomeMin: 3000,
        estimatedIncomeMax: 5000,
        incomeUnit: 'THB',
        timeToStart: '3 days',
        requiredTools: ['Figma', 'Camera'],
        resources: ['https://example.com/combined'],
        steps: ['Create a combined service offer'],
      },
      {
        id: seededIdeaIds.writingOnly,
        title: 'TDD Writing Idea',
        description: 'Idea that needs writing only',
        skills: [seededSkillNames.writing],
        difficulty: 'medium',
        estimatedIncomeMin: 1500,
        estimatedIncomeMax: 2500,
        incomeUnit: 'THB',
        timeToStart: '2 days',
        requiredTools: ['Docs'],
        resources: ['https://example.com/writing'],
        steps: ['Write a content sample'],
      },
    ],
  })
}

async function registerAndLogin(label: string) {
  const email = `${TEST_PREFIX}-${label}@example.com`
  const password = 'password123'
  const username = `tdd-${label}`.replace(/[^a-z0-9-]/gi, '').slice(0, 20)

  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      username,
      email,
      password,
      confirmPassword: password,
    })

  expect(registerResponse.status).toBe(201)

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password,
    })

  expect(loginResponse.status).toBe(200)

  return {
    accessToken: loginResponse.body.accessToken as string,
    userId: loginResponse.body.user.id as string,
  }
}

async function addSkillToUser(accessToken: string, skillId: string) {
  const response = await request(app)
    .post(`/api/skills/${skillId}/add`)
    .set('Authorization', `Bearer ${accessToken}`)

  expect(response.status).toBe(201)
}

describe('Idea discovery API', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await cleanupTestData()
    await seedSkillsAndIdeas()
  })

  it('filters searchable skills and keeps selection state per user', async () => {
    const userOne = await registerAndLogin('skill-user-one')
    const userTwo = await registerAndLogin('skill-user-two')

    await addSkillToUser(userOne.accessToken, seededSkillIds.photo)

    const firstResponse = await request(app)
      .get('/api/skills')
      .query({ q: seededSkillNames.photo })
      .set('Authorization', `Bearer ${userOne.accessToken}`)

    expect(firstResponse.status).toBe(200)
    expect(firstResponse.body.skills).toContainEqual(
      expect.objectContaining({
        id: seededSkillIds.photo,
        name: seededSkillNames.photo,
        isSelected: true,
      })
    )
    expect(firstResponse.body.userSkills).toEqual([
      expect.objectContaining({
        id: seededSkillIds.photo,
        name: seededSkillNames.photo,
      }),
    ])

    const secondResponse = await request(app)
      .get('/api/skills')
      .query({ q: seededSkillNames.photo })
      .set('Authorization', `Bearer ${userTwo.accessToken}`)

    expect(secondResponse.status).toBe(200)
    expect(secondResponse.body.skills).toContainEqual(
      expect.objectContaining({
        id: seededSkillIds.photo,
        name: seededSkillNames.photo,
        isSelected: false,
      })
    )
    expect(secondResponse.body.userSkills).toEqual([])
  })

  it('recommends ideas from the authenticated user saved skills and ranks by match count', async () => {
    const user = await registerAndLogin('ideas-ranked')

    await addSkillToUser(user.accessToken, seededSkillIds.design)
    await addSkillToUser(user.accessToken, seededSkillIds.photo)

    const response = await request(app)
      .get('/api/ideas')
      .set('Authorization', `Bearer ${user.accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.map((idea: { id: string }) => idea.id)).toEqual([
      seededIdeaIds.combined,
      seededIdeaIds.photoOnly,
      seededIdeaIds.designOnly,
    ])
    expect(response.body[0]).toMatchObject({
      id: seededIdeaIds.combined,
      matchedSkills: [seededSkillNames.design, seededSkillNames.photo],
      matchCount: 2,
    })
  })

  it('uses each user saved skills independently when finding ideas', async () => {
    const designUser = await registerAndLogin('ideas-design-user')
    const photoUser = await registerAndLogin('ideas-photo-user')

    await addSkillToUser(designUser.accessToken, seededSkillIds.design)
    await addSkillToUser(photoUser.accessToken, seededSkillIds.photo)

    const designResponse = await request(app)
      .get('/api/ideas')
      .set('Authorization', `Bearer ${designUser.accessToken}`)

    expect(designResponse.status).toBe(200)
    expect(designResponse.body.map((idea: { id: string }) => idea.id)).toEqual([
      seededIdeaIds.combined,
      seededIdeaIds.designOnly,
    ])

    const photoResponse = await request(app)
      .get('/api/ideas')
      .set('Authorization', `Bearer ${photoUser.accessToken}`)

    expect(photoResponse.status).toBe(200)
    expect(photoResponse.body.map((idea: { id: string }) => idea.id)).toEqual([
      seededIdeaIds.combined,
      seededIdeaIds.photoOnly,
    ])
  })

  it('uses explicit skills query instead of saved user skills when provided', async () => {
    const user = await registerAndLogin('ideas-query-override')

    await addSkillToUser(user.accessToken, seededSkillIds.design)

    const response = await request(app)
      .get('/api/ideas')
      .query({ skills: seededSkillNames.photo })
      .set('Authorization', `Bearer ${user.accessToken}`)

    expect(response.status).toBe(200)
    expect(response.body.map((idea: { id: string }) => idea.id)).toEqual([
      seededIdeaIds.combined,
      seededIdeaIds.photoOnly,
    ])
    expect(response.body.every((idea: { matchedSkills: string[] }) =>
      idea.matchedSkills.every((skill) => skill === seededSkillNames.photo)
    )).toBe(true)
  })

  it('returns general ideas when the authenticated user has no saved skills yet', async () => {
    const user = await registerAndLogin('ideas-no-saved-skills')

    const response = await request(app)
      .get('/api/ideas')
      .set('Authorization', `Bearer ${user.accessToken}`)

    const returnedSeededIdeaIds = response.body
      .filter((idea: { id: string }) => Object.values(seededIdeaIds).includes(idea.id as (typeof seededIdeaIds)[keyof typeof seededIdeaIds]))
      .map((idea: { id: string }) => idea.id)

    expect(response.status).toBe(200)
    expect(returnedSeededIdeaIds).toEqual([
      seededIdeaIds.combined,
      seededIdeaIds.photoOnly,
      seededIdeaIds.designOnly,
      seededIdeaIds.writingOnly,
    ])
    expect(response.body.length).toBeGreaterThanOrEqual(Object.keys(seededIdeaIds).length)
    expect(response.body.every((idea: { matchCount: number; recommendationSource: string }) =>
      idea.matchCount === 0 && idea.recommendationSource === 'all'
    )).toBe(true)
  })
})
