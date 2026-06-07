require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("../models/User");
const Exam     = require("../models/Exam");
const { PredictedPaper } = require("../models/Paper");

const EXAMS = [
  // ── UPSC ────────────────────────────────────────────────────
  {
    title: "UPSC Civil Services Examination",
    slug: "upsc-cse",
    shortName: "UPSC CSE",
    category: "upsc",
    conductingBody: "Union Public Service Commission (UPSC)",
    description: "The UPSC Civil Services Examination is India's most prestigious competitive exam, conducted annually to recruit IAS, IPS, IFS and other Group A & B officers. It is a three-stage examination process: Prelims, Mains, and Interview.",
    eligibility: { ageMin: 21, ageMax: 32, education: "Bachelor's Degree from any recognized university in any discipline", nationality: "Indian Citizen" },
    examPattern: {
      stages: [
        { name: "Prelims — GS Paper I", type: "objective", duration: 120, marks: 200, subjects: ["History", "Geography", "Polity", "Economy", "Environment", "Science & Tech", "Current Affairs"] },
        { name: "Prelims — CSAT Paper II", type: "objective", duration: 120, marks: 200, subjects: ["Reading Comprehension", "Logical Reasoning", "Basic Numeracy", "Data Interpretation"] },
        { name: "Mains (Written)", type: "descriptive", duration: 180, marks: 1750, subjects: ["Essay", "GS I", "GS II", "GS III", "GS IV", "Optional Paper 1", "Optional Paper 2"] },
        { name: "Personality Test (Interview)", type: "interview", marks: 275 },
      ],
      totalMarks: 2025,
      negativeMark: true,
    },
    syllabus: [
      { name: "GS Paper I — History & Culture", topics: ["Ancient India", "Medieval India", "Modern India", "World History", "Art & Culture", "Post-Independence"] },
      { name: "GS Paper II — Polity & Governance", topics: ["Indian Constitution", "Governance", "Social Justice", "International Relations", "Panchayati Raj"] },
      { name: "GS Paper III — Economy & Environment", topics: ["Indian Economy", "Agriculture", "Science & Technology", "Environment & Ecology", "Internal Security", "Disaster Management"] },
      { name: "GS Paper IV — Ethics", topics: ["Ethics & Integrity", "Attitude", "Aptitude", "Emotional Intelligence", "Case Studies"] },
    ],
    selectionProcess: ["Prelims", "Mains", "Personality Test", "Medical Examination", "Final Merit List"],
    vacancies: 1056,
    salary: "₹56,100 – ₹2,50,000/month (IAS Scale)",
    isTrending: true,
  },

  // ── SSC CGL ─────────────────────────────────────────────────
  {
    title: "SSC Combined Graduate Level Examination",
    slug: "ssc-cgl",
    shortName: "SSC CGL",
    category: "ssc",
    conductingBody: "Staff Selection Commission (SSC)",
    description: "SSC CGL recruits staff for various Group B and Group C posts in Ministries, Departments, and Organizations of the Government of India.",
    eligibility: { ageMin: 18, ageMax: 27, education: "Bachelor's Degree from any recognized University", nationality: "Indian Citizen" },
    examPattern: {
      stages: [
        { name: "Tier I — Computer Based Test", type: "objective", duration: 60, marks: 200, subjects: ["General Intelligence & Reasoning", "General Awareness", "Quantitative Aptitude", "English Comprehension"] },
        { name: "Tier II — Computer Based Test", type: "objective", duration: 135, marks: 390, subjects: ["Mathematical Abilities", "Reasoning & General Intelligence", "English Language", "General Knowledge"] },
      ],
      totalMarks: 590,
      negativeMark: true,
    },
    syllabus: [
      { name: "Quantitative Aptitude", topics: ["Number Systems", "Simplification", "Profit & Loss", "Ratio & Proportion", "Time & Work", "Algebra", "Geometry", "Trigonometry", "Data Interpretation"] },
      { name: "Reasoning", topics: ["Analogies", "Similarities", "Spatial Visualization", "Coding-Decoding", "Statement & Conclusions", "Syllogism"] },
      { name: "General Awareness", topics: ["History", "Geography", "Polity", "Economy", "Science", "Current Affairs", "Sports"] },
      { name: "English Language", topics: ["Reading Comprehension", "Cloze Test", "Fill in the Blanks", "Error Detection", "Para Jumbles", "Idioms & Phrases"] },
    ],
    selectionProcess: ["Tier I (CBT)", "Tier II (CBT)", "Document Verification", "Medical Test"],
    vacancies: 17727,
    salary: "₹25,500 – ₹1,51,100/month (Pay Level 4–7)",
    isTrending: true,
  },

  // ── Banking ──────────────────────────────────────────────────
  {
    title: "IBPS Probationary Officer",
    slug: "ibps-po",
    shortName: "IBPS PO",
    category: "banking",
    conductingBody: "Institute of Banking Personnel Selection (IBPS)",
    description: "IBPS PO exam recruits Probationary Officers for 11 participating Public Sector Banks including PNB, Bank of Baroda, Canara Bank and more.",
    eligibility: { ageMin: 20, ageMax: 30, education: "Graduation in any discipline from a recognized university", nationality: "Indian Citizen" },
    examPattern: {
      stages: [
        { name: "Preliminary Exam", type: "objective", duration: 60, marks: 100, subjects: ["English Language (30Q)", "Quantitative Aptitude (35Q)", "Reasoning Ability (35Q)"] },
        { name: "Main Exam", type: "objective", duration: 180, marks: 200, subjects: ["Reasoning & Computer Aptitude", "Data Analysis & Interpretation", "General/Economy/Banking Awareness", "English Language"] },
        { name: "Common Interview", type: "interview", marks: 100 },
      ],
      totalMarks: 300,
      negativeMark: true,
    },
    syllabus: [
      { name: "Reasoning Ability", topics: ["Puzzles & Seating Arrangement", "Direction Sense", "Blood Relations", "Inequalities", "Syllogism", "Input-Output", "Data Sufficiency"] },
      { name: "Quantitative Aptitude", topics: ["Number Series", "Data Interpretation", "Quadratic Equations", "Approximation", "Ratio & Proportion", "Time, Speed & Distance"] },
      { name: "Banking Awareness", topics: ["Banking History", "RBI Functions", "Monetary Policy", "Financial Institutions", "Recent Banking News", "Basel Norms"] },
    ],
    selectionProcess: ["Prelims", "Mains", "Interview", "Document Verification", "Pre-Joining Medical"],
    vacancies: 4455,
    salary: "₹41,960 – ₹89,890/month",
    isTrending: true,
  },

  // ── Railway NTPC ─────────────────────────────────────────────
  {
    title: "RRB Non-Technical Popular Categories",
    slug: "rrb-ntpc",
    shortName: "RRB NTPC",
    category: "railway",
    conductingBody: "Railway Recruitment Board (RRB)",
    description: "RRB NTPC recruits candidates for various non-technical posts like Junior Clerk, Station Master, Goods Guard, Junior Time Keeper across Indian Railways.",
    eligibility: { ageMin: 18, ageMax: 33, education: "12th Pass / Graduation (depending on post)", nationality: "Indian Citizen" },
    examPattern: {
      stages: [
        { name: "CBT Stage 1", type: "objective", duration: 90, marks: 100, subjects: ["Mathematics (30Q)", "General Intelligence & Reasoning (30Q)", "General Awareness (40Q)"] },
        { name: "CBT Stage 2", type: "objective", duration: 90, marks: 120, subjects: ["Mathematics (35Q)", "General Intelligence & Reasoning (35Q)", "General Awareness (50Q)"] },
      ],
      totalMarks: 220,
      negativeMark: true,
    },
    syllabus: [
      { name: "Mathematics", topics: ["Number System", "Decimals", "Fractions", "LCM/HCF", "Ratio & Proportions", "Percentage", "Simple & Compound Interest", "Time & Work", "Time & Distance"] },
      { name: "General Intelligence & Reasoning", topics: ["Analogies", "Completion of Number & Alphabetical Series", "Coding & Decoding", "Syllogism", "Venn Diagrams"] },
      { name: "General Awareness", topics: ["Current Events of National & International Importance", "Games & Sports", "Art & Culture", "Indian Literature", "Science & Technology"] },
    ],
    selectionProcess: ["CBT Stage 1", "CBT Stage 2", "Typing Skill Test / CBAT", "Document Verification", "Medical Examination"],
    vacancies: 35208,
    salary: "₹19,900 – ₹74,500/month",
    isTrending: false,
  },

  // ── NDA ──────────────────────────────────────────────────────
  {
    title: "National Defence Academy Examination",
    slug: "nda",
    shortName: "NDA",
    category: "defence",
    conductingBody: "Union Public Service Commission (UPSC)",
    description: "NDA exam is the gateway to join Indian Army, Navy and Air Force as officers. Conducted twice a year, it selects candidates for the prestigious NDA at Khadakwasla.",
    eligibility: { ageMin: 16.5, ageMax: 19.5, education: "10+2 / Appearing in Class 12 (PCM for Air Force & Navy)", nationality: "Indian Citizen / Subject of Nepal/Bhutan" },
    examPattern: {
      stages: [
        { name: "Mathematics Paper", type: "objective", duration: 150, marks: 300, subjects: ["Algebra", "Matrices", "Trigonometry", "Analytical Geometry", "Differential Calculus", "Statistics"] },
        { name: "General Ability Test (GAT)", type: "objective", duration: 150, marks: 600, subjects: ["English", "Physics", "Chemistry", "General Science", "History", "Geography", "Current Events"] },
        { name: "SSB Interview", type: "interview", marks: 900 },
      ],
      totalMarks: 1800,
      negativeMark: true,
    },
    syllabus: [
      { name: "Mathematics", topics: ["Algebra", "Matrices & Determinants", "Trigonometry", "Analytical Geometry 2D & 3D", "Differential Calculus", "Integral Calculus", "Vector Algebra", "Statistics & Probability"] },
      { name: "GAT — English", topics: ["Grammar & Usage", "Vocabulary", "Comprehension & Cohesion", "Spotting Errors", "Fill in the Blanks"] },
      { name: "GAT — General Knowledge", topics: ["Physics", "Chemistry", "Biology", "History", "Geography", "Current Affairs", "General Science"] },
    ],
    selectionProcess: ["Written Test", "SSB Interview", "Medical Examination", "Merit List", "Training at NDA"],
    vacancies: 400,
    salary: "₹56,100/month (Lt. Scale after commissioning)",
    isTrending: false,
  },

  // ── JEE MAIN ────────────────────────────────────────────────
  {
    title: "Joint Entrance Examination Main 2025",
    slug: "jee-main",
    shortName: "JEE Main",
    category: "engineering",
    conductingBody: "National Testing Agency (NTA)",
    description: "JEE Main is the national level engineering entrance exam for admission to B.E./B.Tech courses at NITs, IIITs and other Centrally Funded Technical Institutions (CFTIs). It also serves as the qualifying exam for JEE Advanced for IIT admissions. Over 12 lakh students appear each year.",
    eligibility: { ageMin: 0, ageMax: 0, education: "10+2 with Physics, Chemistry & Mathematics — Min 75% (65% for SC/ST/PwD)", nationality: "Indian / OCI / PIO / Foreign Nationals" },
    examPattern: {
      stages: [
        { name: "Paper 1 — B.E./B.Tech", type: "objective", duration: 180, marks: 300, subjects: ["Physics (30Q)", "Chemistry (30Q)", "Mathematics (30Q)"] },
        { name: "Paper 2A — B.Arch", type: "objective", duration: 180, marks: 400, subjects: ["Mathematics", "Aptitude Test", "Drawing Test"] },
        { name: "Paper 2B — B.Planning", type: "objective", duration: 180, marks: 400, subjects: ["Mathematics", "Aptitude Test", "Planning"] },
      ],
      totalMarks: 300,
      negativeMark: true,
    },
    syllabus: [
      { name: "Physics", topics: ["Physics & Measurement", "Kinematics", "Laws of Motion", "Work-Energy-Power", "Rotational Motion", "Gravitation", "Properties of Solids & Liquids", "Thermodynamics", "Kinetic Theory of Gases", "Oscillations & Waves", "Electrostatics", "Current Electricity", "Magnetic Effects", "Electromagnetic Induction", "Optics", "Dual Nature of Matter", "Atoms & Nuclei", "Electronic Devices"] },
      { name: "Chemistry", topics: ["Basic Concepts", "States of Matter", "Atomic Structure", "Chemical Bonding", "Chemical Thermodynamics", "Solutions", "Equilibrium", "Redox Reactions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "Classification of Elements", "p-Block Elements", "d & f Block Elements", "Coordination Compounds", "Purification of Organic Compounds", "Hydrocarbons", "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Biomolecules"] },
      { name: "Mathematics", topics: ["Sets, Relations & Functions", "Complex Numbers", "Matrices & Determinants", "Permutations & Combinations", "Binomial Theorem", "Sequences & Series", "Limits & Continuity", "Integral Calculus", "Differential Equations", "Coordinate Geometry", "3D Geometry", "Vector Algebra", "Statistics", "Probability", "Trigonometry", "Mathematical Reasoning"] },
    ],
    selectionProcess: ["Session 1 (January)", "Session 2 (April)", "Best of Two Sessions Considered", "JEE Advanced Qualification (Top 2.5L)", "JoSAA Counselling"],
    vacancies: 50000,
    salary: "Top NIT/IIT packages: ₹10–50 LPA (placement-based)",
    isTrending: true,
  },

  // ── JEE ADVANCED ────────────────────────────────────────────
  {
    title: "Joint Entrance Examination Advanced 2025",
    slug: "jee-advanced",
    shortName: "JEE Advanced",
    category: "engineering",
    conductingBody: "IITs (on rotation — IIT Roorkee for 2025)",
    description: "JEE Advanced is the qualifying exam for admission to Bachelor's, Integrated Master's, and Dual Degree programs at 23 IITs. Only top 2.5 lakh JEE Main qualifiers can appear. It is considered one of the toughest undergraduate entrance exams in the world.",
    eligibility: { ageMin: 0, ageMax: 0, education: "Qualified JEE Main; 75% in 12th (65% SC/ST/PwD); Max 2 attempts in consecutive years", nationality: "Indian / Foreign National" },
    examPattern: {
      stages: [
        { name: "Paper 1", type: "objective", duration: 180, marks: 180, subjects: ["Physics", "Chemistry", "Mathematics"] },
        { name: "Paper 2", type: "objective", duration: 180, marks: 180, subjects: ["Physics", "Chemistry", "Mathematics"] },
      ],
      totalMarks: 360,
      negativeMark: true,
    },
    syllabus: [
      { name: "Physics", topics: ["General Physics", "Mechanics", "Thermal Physics", "Electricity & Magnetism", "Optics", "Modern Physics", "Electromagnetic Waves"] },
      { name: "Chemistry", topics: ["Physical Chemistry", "Inorganic Chemistry", "Organic Chemistry"] },
      { name: "Mathematics", topics: ["Algebra", "Trigonometry", "Analytical Geometry", "Differential Calculus", "Integral Calculus", "Vectors", "Complex Numbers"] },
    ],
    selectionProcess: ["JEE Main Qualification", "JEE Advanced Written Exam", "JoSAA Counselling", "IIT Seat Allotment"],
    vacancies: 17385,
    salary: "IIT placements: ₹15–2 Crore LPA (varies by stream and company)",
    isTrending: true,
  },

  // ── NEET UG ──────────────────────────────────────────────────
  {
    title: "National Eligibility cum Entrance Test (UG) 2025",
    slug: "neet-ug",
    shortName: "NEET UG",
    category: "medical",
    conductingBody: "National Testing Agency (NTA)",
    description: "NEET UG is India's single national entrance examination for admission to MBBS, BDS, BAMS, BSMS, BUMS, BHMS and other undergraduate medical courses across all medical colleges in India. Over 20 lakh candidates appear every year — making it one of the most competitive exams in the country.",
    eligibility: { ageMin: 17, ageMax: 25, education: "10+2 with Physics, Chemistry, Biology/Biotechnology — Min 50% (40% SC/ST/OBC)", nationality: "Indian / OCI / NRI / Foreign Nationals" },
    examPattern: {
      stages: [
        { name: "NEET UG — Single Paper", type: "objective", duration: 200, marks: 720, subjects: ["Physics — Section A (35Q) + Section B (15Q)", "Chemistry — Section A (35Q) + Section B (15Q)", "Botany — Section A (35Q) + Section B (15Q)", "Zoology — Section A (35Q) + Section B (15Q)"] },
      ],
      totalMarks: 720,
      negativeMark: true,
    },
    syllabus: [
      { name: "Physics", topics: ["Physical World & Measurement", "Kinematics", "Laws of Motion", "Work, Energy & Power", "Motion of System of Particles", "Gravitation", "Properties of Bulk Matter", "Thermodynamics", "Kinetic Theory of Gases", "Oscillations & Waves", "Electrostatics", "Current Electricity", "Magnetic Effects", "Electromagnetic Induction", "Electromagnetic Waves", "Optics", "Dual Nature of Radiation", "Atoms & Nuclei", "Electronic Devices"] },
      { name: "Chemistry", topics: ["Basic Chemistry", "Structure of Atom", "Classification of Elements", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrogen", "s-Block Elements", "p-Block Elements", "Organic Chemistry Basics", "Hydrocarbons", "Environmental Chemistry", "Solid State", "Solutions", "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "Coordination Compounds", "Haloalkanes", "Alcohols, Phenols & Ethers", "Aldehydes, Ketones", "Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"] },
      { name: "Biology — Botany", topics: ["The Living World", "Biological Classification", "Plant Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Cell Structure & Functions", "Cell Cycle & Division", "Transport in Plants", "Mineral Nutrition", "Photosynthesis", "Respiration", "Plant Growth & Development", "Sexual Reproduction in Flowering Plants", "Principles of Inheritance", "Molecular Basis of Inheritance", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare", "Ecosystems", "Biodiversity & Conservation", "Environmental Issues"] },
      { name: "Biology — Zoology", topics: ["Animal Kingdom", "Structural Organisation in Animals", "Human Physiology — Digestion", "Human Physiology — Respiration", "Human Physiology — Body Fluids", "Human Physiology — Excretion", "Human Physiology — Locomotion", "Neural Control", "Chemical Coordination", "Human Reproduction", "Reproductive Health", "Evolution", "Human Health & Disease", "Biotechnology Principles", "Biotechnology & Applications"] },
    ],
    selectionProcess: ["NEET UG Written Exam", "All-India Merit List", "MCC / State Counselling", "Seat Allotment", "Reporting to College"],
    vacancies: 100000,
    salary: "MBBS Stipend ₹40,000–₹1,00,000/month; Post-PG: ₹1L–20L/month",
    isTrending: true,
  },

  // ── NEET PG ──────────────────────────────────────────────────
  {
    title: "National Eligibility cum Entrance Test (PG) 2025",
    slug: "neet-pg",
    shortName: "NEET PG",
    category: "medical",
    conductingBody: "National Board of Examinations in Medical Sciences (NBEMS)",
    description: "NEET PG is the single entrance test for admission to MD, MS, and PG Diploma courses in India. MBBS graduates apply after completing their 1-year compulsory rotating internship.",
    eligibility: { ageMin: 0, ageMax: 0, education: "MBBS Degree with Compulsory Rotating Internship Completion", nationality: "Indian Citizen" },
    examPattern: {
      stages: [
        { name: "NEET PG — Computer Based Test", type: "objective", duration: 210, marks: 800, subjects: ["Pre-Clinical Subjects", "Para-Clinical Subjects", "Clinical Subjects"] },
      ],
      totalMarks: 800,
      negativeMark: true,
    },
    syllabus: [
      { name: "Pre-Clinical", topics: ["Anatomy", "Physiology", "Biochemistry"] },
      { name: "Para-Clinical", topics: ["Pathology", "Pharmacology", "Microbiology", "Forensic Medicine", "Community Medicine (PSM)"] },
      { name: "Clinical", topics: ["General Medicine", "General Surgery", "Obstetrics & Gynaecology", "Paediatrics", "Ophthalmology", "ENT", "Orthopaedics", "Anaesthesia", "Dermatology", "Psychiatry", "Radiology"] },
    ],
    selectionProcess: ["NEET PG Written Exam", "Rank-Based Counselling (MCC)", "State Quota Counselling", "Seat Allotment"],
    vacancies: 55000,
    salary: "MD/MS Stipend ₹75,000–₹1,50,000/month",
    isTrending: false,
  },

  // ── AIIMS NURSING ────────────────────────────────────────────
  {
    title: "AIIMS Nursing Officer Recruitment 2025",
    slug: "aiims-nursing",
    shortName: "AIIMS Nursing",
    category: "medical",
    conductingBody: "All India Institute of Medical Sciences (AIIMS), New Delhi",
    description: "AIIMS Nursing Officer exam recruits BSc Nursing graduates for Nursing Officer posts across all AIIMS institutions in India. It is a prestigious central government nursing recruitment exam with a structured selection process.",
    eligibility: { ageMin: 18, ageMax: 30, education: "B.Sc Nursing (4 years) from a recognized university / institution", nationality: "Indian Citizen" },
    examPattern: {
      stages: [
        { name: "Computer Based Test", type: "objective", duration: 90, marks: 100, subjects: ["Nursing — 80Q", "General Knowledge & Aptitude — 20Q"] },
      ],
      totalMarks: 100,
      negativeMark: true,
    },
    syllabus: [
      { name: "Nursing Foundations", topics: ["Fundamentals of Nursing", "Anatomy & Physiology", "Pharmacology", "Nutrition", "Microbiology", "Psychology"] },
      { name: "Medical-Surgical Nursing", topics: ["Medical Nursing", "Surgical Nursing", "Oncology Nursing", "Orthopaedic Nursing", "Neurological Nursing"] },
      { name: "Speciality Nursing", topics: ["OBG Nursing", "Paediatric Nursing", "Psychiatric Nursing", "Community Health Nursing", "Critical Care Nursing", "Emergency Nursing"] },
      { name: "General Knowledge", topics: ["Current Affairs", "General Science", "Basic Computer Knowledge", "Indian Constitution", "Health Schemes"] },
    ],
    selectionProcess: ["Computer Based Test", "Document Verification", "Medical Examination", "Final Merit List"],
    vacancies: 3000,
    salary: "₹44,900 – ₹1,42,400/month (Level 7 Pay Matrix)",
    isTrending: false,
  },
];

const PAPERS = [
  // JEE Main papers
  { examSlug: "jee-main", title: "JEE Main January 2025 Session 1 — Full Predicted Paper", description: "AI-predicted full paper for JEE Main January session. Focus areas: Modern Physics, Electrochemistry, Calculus (Definite Integration), Coordinate Geometry. Based on analysis of 10 years of JEE Main patterns.", price: 9900, difficultyLevel: "hard", predictionScore: 91, totalQuestions: 90, paperType: "predicted", year: 2025 },
  { examSlug: "jee-main", title: "JEE Main April 2025 Session 2 — Full Predicted Paper", description: "AI-predicted paper for Session 2 — focuses on topics with lower coverage in Session 1 historically.", price: 9900, difficultyLevel: "hard", predictionScore: 88, totalQuestions: 90, paperType: "predicted", year: 2025 },
  { examSlug: "jee-main", title: "JEE Main 2025 — Physics Special Predicted Set", description: "High-yield Physics predicted questions with special focus on Alternating Current, Ray Optics, and Semiconductors.", price: 4900, difficultyLevel: "hard", predictionScore: 93, totalQuestions: 30, paperType: "predicted", year: 2025 },

  // JEE Advanced papers
  { examSlug: "jee-advanced", title: "JEE Advanced 2025 — Paper 1 Predicted", description: "Full Paper 1 prediction for JEE Advanced 2025. Includes multi-correct, single-digit integer, and match-the-column types.", price: 14900, difficultyLevel: "hard", predictionScore: 86, totalQuestions: 54, paperType: "predicted", year: 2025 },
  { examSlug: "jee-advanced", title: "JEE Advanced 2025 — Paper 2 Predicted", description: "Full Paper 2 prediction covering all three subjects. Special emphasis on paragraph-based questions.", price: 14900, difficultyLevel: "hard", predictionScore: 84, totalQuestions: 54, paperType: "predicted", year: 2025 },

  // NEET UG papers
  { examSlug: "neet-ug", title: "NEET UG 2025 — Complete Predicted Paper (200Q)", description: "Full 200-question predicted paper for NEET UG 2025. Biology predicted accuracy has been 94%+ in past 3 years.", price: 11900, difficultyLevel: "hard", predictionScore: 93, totalQuestions: 200, paperType: "predicted", year: 2025 },
  { examSlug: "neet-ug", title: "NEET UG 2025 — Biology High-Yield Predicted Set", description: "100-question Biology-only predicted paper focusing on Genetics, Ecology, Human Physiology, and Biotechnology.", price: 6900, difficultyLevel: "medium", predictionScore: 95, totalQuestions: 100, paperType: "predicted", year: 2025 },
  { examSlug: "neet-ug", title: "NEET UG 2025 — Chemistry Predicted Paper", description: "50-question Chemistry prediction paper focusing on Organic Mechanisms, Coordination Compounds, and Inorganic trends.", price: 4900, difficultyLevel: "hard", predictionScore: 89, totalQuestions: 50, paperType: "predicted", year: 2025 },

  // NEET PG papers
  { examSlug: "neet-pg", title: "NEET PG 2025 — Complete Predicted Paper", description: "200-question predicted paper covering all subjects. High-yield clinical and para-clinical topics.", price: 14900, difficultyLevel: "hard", predictionScore: 87, totalQuestions: 200, paperType: "predicted", year: 2025 },
  { examSlug: "neet-pg", title: "NEET PG 2025 — Clinical Medicine Special Set", description: "100-question clinical subjects focused predicted paper — Medicine, Surgery, OBG, Paediatrics.", price: 8900, difficultyLevel: "hard", predictionScore: 90, totalQuestions: 100, paperType: "predicted", year: 2025 },

  // AIIMS Nursing
  { examSlug: "aiims-nursing", title: "AIIMS Nursing Officer 2025 — Predicted Paper", description: "100-question predicted paper for AIIMS Nursing recruitment. Focus on Medical-Surgical Nursing and Community Health.", price: 5900, difficultyLevel: "medium", predictionScore: 88, totalQuestions: 100, paperType: "predicted", year: 2025 },

  // UPSC papers
  { examSlug: "upsc-cse", title: "UPSC Prelims GS Paper I 2025 — Predicted Paper", description: "100-question GS Paper I prediction. Emphasis on Environment, Economy, and Current Affairs based on NCF 2025 recommendations.", price: 14900, difficultyLevel: "hard", predictionScore: 87, totalQuestions: 100, paperType: "predicted", year: 2025 },
  { examSlug: "upsc-cse", title: "UPSC Prelims CSAT 2025 — Predicted Paper", description: "80-question CSAT Paper II prediction with Reading Comprehension sets and Data Interpretation.", price: 9900, difficultyLevel: "medium", predictionScore: 92, totalQuestions: 80, paperType: "predicted", year: 2025 },

  // SSC CGL papers
  { examSlug: "ssc-cgl", title: "SSC CGL Tier I 2025 — Predicted Paper", description: "100-question Tier I predicted paper covering all four sections with expected difficulty mapping.", price: 7900, difficultyLevel: "medium", predictionScore: 90, totalQuestions: 100, paperType: "predicted", year: 2025 },

  // IBPS PO papers
  { examSlug: "ibps-po", title: "IBPS PO Prelims 2025 — Predicted Paper", description: "100-question predicted paper for IBPS PO Prelims with topic-wise breakdown.", price: 6900, difficultyLevel: "medium", predictionScore: 91, totalQuestions: 100, paperType: "predicted", year: 2025 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Exam.deleteMany({}),
      PredictedPaper.deleteMany({}),
    ]);
    console.log("🗑️  Cleared existing data");

    // Create super admin
    const adminPassword = await bcrypt.hash("Admin@12345", 12);
    const admin = await User.create({
      name:            "ExamEdge Admin",
      email:           "admin@examedge.in",
      password:        adminPassword,
      role:            "super_admin",
      isEmailVerified: true,
      phone:           "9999999999",
    });
    console.log(`👤 Admin created: ${admin.email} / Admin@12345`);

    // Create sample student
    const studentPassword = await bcrypt.hash("Student@123", 12);
    await User.create({
      name:            "Rahul Sharma",
      email:           "student@test.com",
      password:        studentPassword,
      role:            "user",
      isEmailVerified: true,
      phone:           "9876543210",
    });
    console.log("👤 Test student created: student@test.com / Student@123");

    // Create exams
    const createdExams = await Exam.insertMany(EXAMS);
    const examMap = {};
    createdExams.forEach((e) => { examMap[e.slug] = e._id; });
    console.log(`📚 Created ${createdExams.length} exams`);

    // Create papers with exam references
    const papersToInsert = PAPERS.map((p) => {
      const { examSlug, ...rest } = p;
      return { ...rest, examId: examMap[examSlug], isActive: true };
    }).filter((p) => p.examId);

    const createdPapers = await PredictedPaper.insertMany(papersToInsert);
    console.log(`📄 Created ${createdPapers.length} predicted papers`);

    console.log("\n✅ Seed completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔑 Admin:   admin@examedge.in / Admin@12345");
    console.log("🎓 Student: student@test.com / Student@123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
