import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const skills = [
  { name: 'การออกแบบ', nameEn: 'Design', category: 'creative' },
  { name: 'Canva', nameEn: 'Canva', category: 'design-tool' },
  { name: 'การถ่ายภาพ', nameEn: 'Photography', category: 'creative' },
  { name: 'Figma', nameEn: 'Figma', category: 'design-tool' },
  { name: 'Adobe Illustrator', nameEn: 'Adobe Illustrator', category: 'design-tool' },
  { name: 'ตัดต่อวิดีโอ', nameEn: 'Video Editing', category: 'video' },
  { name: 'CapCut', nameEn: 'CapCut', category: 'video-tool' },
  { name: 'Adobe Premiere Pro', nameEn: 'Adobe Premiere Pro', category: 'video-tool' },
  { name: 'การสอน', nameEn: 'Teaching', category: 'education' },
  { name: 'เขียนคอนเทนต์', nameEn: 'Content Writing', category: 'marketing' },
  { name: 'Social Media', nameEn: 'Social Media', category: 'marketing' },
  { name: 'ภาษาอังกฤษ', nameEn: 'English', category: 'language' },
] as const

const ideas = [
  {
    id: 'idea-canva-presentation',
    title: 'รับทำพรีเซนต์ด้วย Canva',
    description: 'รับทำสไลด์งานกลุ่มหรือสื่อพรีเซนต์ให้นักศึกษาและวัยทำงาน มี Template ให้เลือก',
    skills: ['Canva', 'การออกแบบ'],
    difficulty: 'easy',
    estimatedIncomeMin: 300,
    estimatedIncomeMax: 1500,
    incomeUnit: 'THB',
    timeToStart: '1-3 วัน',
    requiredTools: ['Canva', 'Google Drive'],
    resources: ['https://www.canva.com'],
    steps: [
      'เลือก niche ของงานพรีเซนต์ที่ถนัด',
      'ทำตัวอย่างสไลด์ 3-5 แบบใส่ portfolio',
      'ตั้งแพ็กเกจราคาเริ่มต้นและเวลาส่งงาน',
      'เปิดรับงานผ่าน Facebook, IG หรือกลุ่มนักศึกษา',
    ],
  },
  {
    id: 'idea-product-photography',
    title: 'รับถ่ายรูปสินค้าลง Shopee/TikTok',
    description: 'รับถ่ายภาพสินค้าแบบจัดเซตสวย ๆ สำหรับร้านค้าออนไลน์ขนาดเล็ก ใช้กล้องมือถือก็เริ่มได้',
    skills: ['การถ่ายภาพ'],
    difficulty: 'medium',
    estimatedIncomeMin: 500,
    estimatedIncomeMax: 3000,
    incomeUnit: 'THB',
    timeToStart: '2-5 วัน',
    requiredTools: ['Camera หรือ Smartphone', 'Lightbox'],
    resources: ['https://seller.shopee.co.th', 'https://www.tiktok.com/business/th'],
    steps: [
      'ฝึกจัดแสงและจัดพร็อพสินค้า',
      'ทำภาพ before/after สำหรับ portfolio',
      'ตั้งราคาเป็นรายรูปหรือรายเซตสินค้า',
      'เสนอแพ็กเกจให้ร้านค้าออนไลน์ขนาดเล็ก',
    ],
  },
  {
    id: 'idea-logo-sme',
    title: 'รับออกแบบโลโก้ SME',
    description: 'รับจ้างออกแบบโลโก้สำหรับร้านค้าเล็กและธุรกิจที่เพิ่งเริ่มต้น เน้นงานไวและสวยงาม',
    skills: ['การออกแบบ', 'Canva', 'Adobe Illustrator', 'Figma'],
    difficulty: 'hard',
    estimatedIncomeMin: 5000,
    estimatedIncomeMax: 15000,
    incomeUnit: 'THB',
    timeToStart: '1-2 สัปดาห์',
    requiredTools: ['Adobe Illustrator', 'Figma'],
    resources: ['https://www.behance.net', 'https://dribbble.com'],
    steps: [
      'สร้าง logo mockup อย่างน้อย 5 ชิ้น',
      'กำหนด style ที่ถนัด เช่น minimal หรือ playful',
      'ทำ brief template ไว้คุยกับลูกค้า',
      'เปิดรับงานผ่าน portfolio และ social media',
    ],
  },
  {
    id: 'idea-online-tutor',
    title: 'สอนพิเศษออนไลน์',
    description: 'สอนวิชาที่ถนัดผ่าน Zoom หรือ Google Meet รับนักเรียน ม.ต้น ถึงมหาวิทยาลัย',
    skills: ['การสอน', 'ภาษาอังกฤษ'],
    difficulty: 'easy',
    estimatedIncomeMin: 200,
    estimatedIncomeMax: 600,
    incomeUnit: 'THB',
    timeToStart: '1-3 วัน',
    requiredTools: ['Zoom', 'Google Meet'],
    resources: ['https://zoom.us', 'https://meet.google.com'],
    steps: [
      'กำหนดวิชาหรือหัวข้อที่สอนได้ชัดเจน',
      'เตรียม syllabus สั้น ๆ และแบบฝึกหัด',
      'เปิดรับนักเรียนทดลองเรียนรอบแรก',
      'เก็บรีวิวและทำตารางสอนที่ชัดเจน',
    ],
  },
  {
    id: 'idea-reels-editor',
    title: 'ตัดต่อวิดีโอ Reels/Shorts',
    description: 'ตัดต่อคลิปสั้นสำหรับ Instagram Reels, TikTok และ YouTube Shorts ให้แบรนด์หรือครีเอเตอร์',
    skills: ['ตัดต่อวิดีโอ', 'CapCut', 'Adobe Premiere Pro'],
    difficulty: 'medium',
    estimatedIncomeMin: 800,
    estimatedIncomeMax: 4000,
    incomeUnit: 'THB',
    timeToStart: '3-7 วัน',
    requiredTools: ['CapCut', 'Adobe Premiere Pro'],
    resources: ['https://www.capcut.com', 'https://www.adobe.com/products/premiere.html'],
    steps: [
      'ฝึกตัดคลิปสั้นให้กระชับและมี hook ใน 3 วินาทีแรก',
      'ทำ sample งาน 3-5 แบบหลากหลายสไตล์',
      'ตั้งราคาเป็นรายคลิปหรือรายแพ็กเกจ',
      'เสนอผลงานให้ร้านค้าและครีเอเตอร์ที่กำลังโต',
    ],
  },
  {
    id: 'idea-social-content',
    title: 'เขียน Content โซเชียล',
    description: 'เขียนแคปชันและโพสต์ Facebook/IG ให้ร้านค้าออนไลน์ SME และ Startup',
    skills: ['เขียนคอนเทนต์', 'Social Media'],
    difficulty: 'easy',
    estimatedIncomeMin: 300,
    estimatedIncomeMax: 2000,
    incomeUnit: 'THB',
    timeToStart: '1-3 วัน',
    requiredTools: ['Notion', 'Google Docs'],
    resources: ['https://www.notion.so', 'https://docs.google.com'],
    steps: [
      'กำหนดแนวการเขียนและกลุ่มลูกค้าที่อยากรับ',
      'ทำตัวอย่าง caption หลาย tone of voice',
      'ตั้งแพ็กเกจรายโพสต์หรือรายเดือน',
      'นำเสนอผลงานกับร้านค้าและแบรนด์เล็ก',
    ],
  },
] as const

async function seedSkills() {
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {
        nameEn: skill.nameEn,
        category: skill.category,
      },
      create: skill,
    })
  }

  console.log(`Seeded ${skills.length} skills`)
}

async function seedIdeas() {
  for (const idea of ideas) {
    await prisma.idea.upsert({
      where: { id: idea.id },
      update: {
        title: idea.title,
        description: idea.description,
        skills: [...idea.skills],
        difficulty: idea.difficulty,
        estimatedIncomeMin: idea.estimatedIncomeMin,
        estimatedIncomeMax: idea.estimatedIncomeMax,
        incomeUnit: idea.incomeUnit,
        timeToStart: idea.timeToStart,
        requiredTools: [...idea.requiredTools],
        resources: [...idea.resources],
        steps: [...idea.steps],
      },
      create: {
        ...idea,
        skills: [...idea.skills],
        requiredTools: [...idea.requiredTools],
        resources: [...idea.resources],
        steps: [...idea.steps],
      },
    })
  }

  console.log(`Seeded ${ideas.length} ideas`)
}

async function main() {
  console.log('Starting seed...')

  await seedSkills()
  await seedIdeas()

  console.log('Seed completed')
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
