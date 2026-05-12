/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProfileSlug = "dataengineer" | "softwareengineer" | "datascientist" | "datanalyst";
export type ProjectType = "AI" | "DE" | "DS";
export type ProjectIcon = "trend" | "pipeline" | "monitoring" | "application" | "translation" | "risk";

export interface ProjectDecision {
  title: string;
  detail: string;
}

export interface ProjectImpactMetric {
  label: string;
  value: string;
  detail: string;
}

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  typeLabel: string;
  icon: ProjectIcon;
  summary: string;
  role: string;
  domain: string;
  techStack: string[];
  problem: string;
  context: string;
  stakes: string;
  ownership: string[];
  goals: string[];
  architecture: string;
  implementation: string[];
  decisions: ProjectDecision[];
  flow: string;
  challenges: string[];
  impactMetrics: ProjectImpactMetric[];
  outcomes: string[];
  lessons: string[];
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string[];
  skills: string[];
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface Education {
  school: string;
  degree: string;
  period: string;
  location: string;
  details: string[];
}

export interface SectionIntro {
  eyebrow: string;
  title: string;
  description: string;
}

export interface ContactSectionCopy extends SectionIntro {
  chips: string[];
  reachLabel: string;
}

export interface PortfolioData {
  personal: {
    name: string;
    headline: string;
    about: string[];
    focusAreas: string[];
    email: string;
    linkedin: string;
    github: string;
    resume: string;
    location: string;
  };
  metrics: {
    label: string;
    value: string;
  }[];
  skills: SkillGroup[];
  projects: Project[];
  experience: Experience[];
  education: Education[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
  }[];
  sectionCopy: {
    about: {
      eyebrow: string;
      title: string;
      impactLabel: string;
      focusLabel: string;
    };
    skills: SectionIntro;
    projects: SectionIntro;
    experience: SectionIntro;
    education: SectionIntro;
    contact: ContactSectionCopy;
  };
  footer: {
    tagline: string;
  };
}

export const profileSlugs: ProfileSlug[] = ["dataengineer", "softwareengineer", "datascientist", "datanalyst"];
export const defaultProfileSlug: ProfileSlug = "dataengineer";

const basePublicPath =
  typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
    ? import.meta.env.BASE_URL
    : "/";

function withPublicAsset(path: string) {
  const normalizedBase = basePublicPath.endsWith("/") ? basePublicPath : `${basePublicPath}/`;
  return `${normalizedBase}${path.replace(/ /g, "%20")}`;
}

export function isProfileSlug(value: string | undefined): value is ProfileSlug {
  return Boolean(value && profileSlugs.includes(value as ProfileSlug));
}

const sharedIdentity = {
  name: "Ganesh Makkina",
  email: "makkinaganesh25c@gmail.com",
  linkedin: "https://www.linkedin.com/in/ganesh-makkina/",
  github: "https://github.com/makkinaganesh25",
  location: "New York City Metropolitan Area",
};

const sharedEducation: Education[] = [
  {
    school: "Rutgers University - New Brunswick",
    degree: "Master of Science in Statistics - Data Science",
    period: "Sep 2023 - May 2025",
    location: "New Brunswick, NJ",
    details: [
      "Coursework: Regression & Time Series, Probability & Statistics, Advanced Database Management, Financial Data Mining, Data Wrangling",
      "Graduate training focused on statistical modeling, database design, cloud data workflows, and analytical systems.",
    ],
  },
  {
    school: "Army Institute of Technology",
    degree: "Bachelor of Engineering in Computer Science",
    period: "Jul 2017 - Jul 2021",
    location: "Pune, Maharashtra, India",
    details: [
      "Computer science foundation across data structures, algorithms, operating systems, database systems, and computer networks.",
      "Undergraduate engineering training that supports the backend, data modeling, and systems work across the portfolio.",
    ],
  },
];

const sharedCertifications = [
  {
    name: "AWS Certified Associate Data Engineer",
    issuer: "Amazon Web Services",
    date: "Resume-listed",
  },
  {
    name: "GCP Certified Associate Cloud Engineer",
    issuer: "Google Cloud",
    date: "Resume-listed",
  },
  {
    name: "SQL (Intermediate)",
    issuer: "HackerRank",
    date: "Jun 2021",
  },
];

const sharedExperience: Experience[] = [
  {
    company: "S&P Global Ratings",
    role: "Senior Data Engineer",
    period: "Oct 2025 - Present",
    description: [
      "Public LinkedIn article lists the current chapter as Senior Data Engineer at S&P Global Ratings; portfolio copy keeps client and internal implementation details high-level.",
      "Focuses on governed data delivery, reliability, lineage, and data products where trusted ratings workflows depend on clear data contracts.",
      "Brings AWS, Spark, SQL, orchestration, warehousing, and quality-control experience into enterprise data engineering work.",
    ],
    skills: ["Data Engineering", "Governance", "SQL", "Cloud Platforms", "Reliability"],
  },
  {
    company: "Quantiphi (AWS Partner)",
    role: "Data Engineer",
    period: "Aug 2021 - Aug 2023",
    description: [
      "Migrated legacy analytical infrastructure into AWS data lake and warehouse patterns using S3, Databricks, Redshift, Glue, Lambda, Kinesis, and MWAA.",
      "Validated and transformed historical datasets with millions of records using Scala Spark, Spark SQL, Redshift CTEs, and stored procedures.",
      "Designed cost-optimized AWS architecture that reduced infrastructure cost by 30% and improved query speed by 20% for critical applications.",
      "Built healthcare data ingestion pipelines processing 10M+ records daily from public APIs and datasets for analytics and dashboard consumption.",
    ],
    skills: ["AWS", "Databricks", "Spark", "Redshift", "Kinesis", "MWAA"],
  },
  {
    company: "Shiftelix",
    role: "Founder and Builder",
    period: "2025 - Present",
    description: [
      "Built Shiftelix as a university student workforce scheduling platform, turning schedule creation, coverage requests, messaging, compliance evidence, audit history, payroll handoff, and admin workflows into one product system.",
      "Owned the full stack across a Node/Express API, React web app, Expo React Native mobile app, MySQL migrations, Render deployment, Firebase-backed messaging, push notifications, and App Store release readiness.",
      "Designed the platform around workspace and department isolation, permission-first RBAC, JWT plus CSRF/Bearer auth paths, audit hash chains, and compliance-aware scheduling decisions.",
    ],
    skills: ["Product Engineering", "Node/Express", "React Native", "MySQL", "Render", "RBAC"],
  },
];

const enterpriseLakehouseProject: Project = {
  id: "enterprise-data-lake-modernization",
  title: "Enterprise Data Lake Migration",
  type: "DE",
  typeLabel: "AWS Data Platform",
  icon: "pipeline",
  summary:
    "Modernized a global technology client's legacy analytical stack into an AWS data lake and warehouse architecture with Databricks processing, Redshift analytics, and automated orchestration.",
  role: "Data Engineer",
  domain: "Enterprise Data Lake / Cloud Modernization",
  techStack: ["AWS S3", "Databricks", "Scala Spark", "Redshift", "Glue", "Kinesis", "Lambda", "MWAA"],
  problem:
    "Legacy infrastructure could not keep up with analytical volume, query latency, and the cost profile expected by business-critical applications.",
  context:
    "Resume-backed Quantiphi engagement for a global technology client, focused on migrating historical and streaming data workflows into AWS lakehouse patterns.",
  stakes:
    "The business needed a platform that could reduce cost while improving access speed and preserving data integrity across historical and real-time workloads.",
  ownership: [
    "Validated and transformed historical datasets with millions of records using Scala Spark on Databricks.",
    "Engineered Redshift and Spark SQL queries with CTEs and stored procedures for faster analytical access.",
    "Designed cost-aware AWS data pipelines across S3, Glue, Lambda, Databricks, Redshift, Kinesis, and MWAA.",
  ],
  goals: [
    "Move legacy analytical workloads into a scalable AWS data lake and warehouse architecture.",
    "Improve query performance without compromising historical data quality.",
    "Automate pipeline execution for reliable dashboard and application updates.",
  ],
  architecture:
    "A decoupled AWS platform using S3 as the landing and lake layer, Databricks and Glue for transformation, Kinesis and Lambda for dynamic updates, MWAA for orchestration, and Redshift for warehouse consumption.",
  implementation: [
    "Built migration and transformation workflows that converted legacy datasets into governed, analytics-ready lakehouse layers.",
    "Optimized Redshift and Spark SQL patterns with CTEs, stored procedures, and partition-conscious transformations.",
    "Orchestrated pipeline execution through MWAA so ingestion, transformation, and warehouse publishing stayed repeatable.",
  ],
  decisions: [
    {
      title: "Separate storage and compute",
      detail:
        "Used S3, Databricks, and Redshift boundaries so storage scale, processing cost, and analytical performance could be tuned independently.",
    },
    {
      title: "Treat integrity as migration work",
      detail:
        "Validated historical datasets before downstream publishing so the modernization did not simply move old inconsistencies into a new platform.",
    },
    {
      title: "Automate the operational path",
      detail:
        "Used MWAA and managed AWS services to reduce manual handoffs between ingestion, transformation, and reporting delivery.",
    },
  ],
  flow:
    "Legacy Stores -> S3 Landing Zones -> Databricks + Glue Transformations -> Redshift Warehouse -> Kinesis/Lambda Updates -> Dashboards and Applications",
  challenges: [
    "Preserving data integrity across historical migrations while adding real-time update paths.",
    "Balancing cost reduction with the performance expectations of critical business applications.",
  ],
  impactMetrics: [
    {
      label: "Cost Reduction",
      value: "30%",
      detail: "Cost-optimized AWS architecture reduced infrastructure expense while improving delivery performance.",
    },
    {
      label: "Query Speed",
      value: "+20%",
      detail: "Redshift and Spark SQL optimizations improved access speed for critical analytical workflows.",
    },
    {
      label: "Data Scale",
      value: "Millions",
      detail: "Historical records were validated and transformed into analytics-ready warehouse layers.",
    },
  ],
  outcomes: [
    "Reduced infrastructure cost by 30% through a more efficient AWS data architecture.",
    "Improved query performance by 20% for critical business applications.",
    "Delivered a more reliable ingestion and transformation path for real-time dashboard updates.",
  ],
  lessons: [
    "A successful migration is measured by trust and operating cost, not just by moving data into new storage.",
    "Warehouse performance improves fastest when pipeline design and SQL design are tuned together.",
  ],
};

const covidAnalyticsProject: Project = {
  id: "covid19-ingestion-analytics-platform",
  title: "COVID-19 Ingestion Platform",
  type: "DE",
  typeLabel: "Healthcare Data Pipeline",
  icon: "monitoring",
  summary:
    "Built AWS pipelines for a healthcare client to process 10M+ daily records from public health APIs and datasets into cleansed, dashboard-ready analytics layers.",
  role: "Data Engineer",
  domain: "Healthcare Analytics / High-Volume Ingestion",
  techStack: ["AWS Lambda", "S3", "AWS Glue", "Python Spark", "Databricks", "MWAA", "Kinesis", "QuickSight"],
  problem:
    "Public health data arrived from many external APIs with changing schemas, high daily volume, and urgent stakeholder demand for reliable insights.",
  context:
    "Resume-backed Quantiphi healthcare engagement that required scalable ingestion, transformation, orchestration, and dashboard delivery during a high-change data environment.",
  stakes:
    "Delayed or unreliable data preparation would slow public-health analysis and make operational decisions depend on stale or inconsistent reporting inputs.",
  ownership: [
    "Built API extraction workflows with Lambda and S3 ingestion patterns.",
    "Transformed large public-health datasets using AWS Glue and Python Spark on Databricks.",
    "Orchestrated delivery with MWAA, Kinesis, CodePipeline, CodeBuild, and QuickSight dashboards.",
  ],
  goals: [
    "Process 10M+ records per day without manual data preparation becoming a bottleneck.",
    "Normalize public health feeds into quality-controlled analytics datasets.",
    "Expose COVID-19 trends and actionable insights through dashboard-ready outputs.",
  ],
  architecture:
    "Serverless extraction collected public API data into S3, Spark and Glue transformed it through large-scale processing layers, MWAA orchestrated workflows, Kinesis supported update paths, and QuickSight delivered stakeholder dashboards.",
  implementation: [
    "Created Lambda-based extraction jobs for public APIs and agency datasets with S3 as the ingestion layer.",
    "Built large-scale transformation jobs in AWS Glue and Python Spark on Databricks to clean and standardize records.",
    "Connected CI/CD and monitoring through AWS CodePipeline and CodeBuild to keep delivery observable and repeatable.",
  ],
  decisions: [
    {
      title: "Serverless-first extraction",
      detail:
        "Used Lambda and managed AWS services so unpredictable source changes and volume spikes could be handled without a heavy always-on extraction tier.",
    },
    {
      title: "Analytics before visualization",
      detail:
        "Prioritized quality transformations before QuickSight delivery so dashboards reflected cleansed, consistent datasets instead of raw API variability.",
    },
    {
      title: "Operational orchestration",
      detail:
        "Used MWAA to make dependency order, reruns, and monitoring visible across the full ingestion-to-dashboard workflow.",
    },
  ],
  flow:
    "Public Health APIs -> Lambda Extraction -> S3 Ingestion -> Glue + Databricks Spark -> Hive Metastore + Databricks SQL -> QuickSight Dashboards",
  challenges: [
    "Handling schema drift and inconsistent public datasets without slowing daily delivery.",
    "Keeping transformations efficient while processing millions of records each day.",
  ],
  impactMetrics: [
    {
      label: "Daily Volume",
      value: "10M+",
      detail: "Processed millions of public-health records each day through scalable AWS pipelines.",
    },
    {
      label: "Prep Time",
      value: "-30%",
      detail: "Reduced preparation time by standardizing ingestion and transformation workflows.",
    },
    {
      label: "Delivery Mode",
      value: "Near real-time",
      detail: "Kinesis and automated orchestration improved data freshness for trend dashboards.",
    },
  ],
  outcomes: [
    "Processed 10M+ healthcare records daily from external APIs and public datasets.",
    "Reduced data preparation time by 30% through automated AWS and Databricks transformations.",
    "Delivered QuickSight dashboards that helped stakeholders review COVID-19 trends and actionable signals.",
  ],
  lessons: [
    "High-velocity public data pipelines need schema resilience and delivery observability from the start.",
    "Dashboard speed is only useful when the upstream transformations are reliable and explainable.",
  ],
};

const shiftelixProject: Project = {
  id: "shiftelix-workforce-os",
  title: "Shiftelix Workforce OS",
  type: "AI",
  typeLabel: "Product Engineering",
  icon: "risk",
  summary:
    "A shipped university workforce scheduling platform that connects scheduler operations, coverage requests, marketplace flows, compliance evidence, audit history, payroll handoff, messaging, and mobile self-service.",
  role: "Founder and Builder",
  domain: "University Workforce / Student Scheduling Platform",
  techStack: ["Node/Express", "React", "Expo React Native", "MySQL", "Render", "Firebase/Firestore", "Socket.io", "RBAC", "CSRF/JWT"],
  problem:
    "University workforce teams were coordinating schedules, coverage, swaps, eligibility, approvals, messages, and payroll-sensitive records across spreadsheets and ad hoc threads, even though the decisions needed durable operational truth.",
  context:
    "Shiftelix is the current product form of the Rutgers scheduling automation work, verified against the current monorepo, related Rutgers-origin repositories, the public product site, the founder blog, and the App Store listing for the live iPhone app.",
  stakes:
    "One shift record can affect staffing coverage, student-worker eligibility, manager approvals, location check-in requirements, audit evidence, payroll review, notifications, and downstream reporting.",
  ownership: [
    "Defined the product direction around student workforce operations rather than a standalone calendar.",
    "Built the backend route/service surface for shifts, requests, marketplace, compliance, audit, payroll, timecards, permanent scheduling, schedule board/workbook, notifications, chat, users, workspaces, and account lifecycle.",
    "Shipped web and mobile surfaces for schedule visibility, request queues, team messaging, security settings, workspace switching, department scope, support/privacy links, and account deletion.",
  ],
  goals: [
    "Make schedules, coverage requests, swaps, approvals, and payroll-adjacent records traceable instead of spreadsheet-dependent.",
    "Give managers a governed operating layer for staffing, eligibility, compliance review, audit evidence, and reporting projections.",
    "Release a real mobile product with secure account, support, privacy, messaging, and self-service workflows.",
  ],
  architecture:
    "Node/Express protected APIs run behind JWT, CSRF, Bearer mobile auth, workspace activation, feature entitlements, workspace membership checks, and department-context middleware. React web and Expo React Native clients call the same backend contracts. MySQL migrations and the maintained schema snapshot define the operational model, while Render runs the Dockerized API, static frontend, and worker services. Firebase/Firestore collections support conversation, participant, and search flows, with backend push and attachment routes around notification delivery.",
  implementation: [
    "Modeled core scheduling data in MySQL across workspaces, departments, users, memberships, shifts, coverage requests, swap requests, leave requests, permanent schedule runs, audit logs, payroll export batches, schedule board facts, and schedule workbook tabs.",
    "Implemented operational modules for scheduler actions, marketplace coverage, compliance and eligibility checks, audit hub, LiveGuard/location-required check-ins, payroll/timecard review, Google Sheets and native board/workbook projections, QuickSight reporting, notifications, and account lifecycle.",
    "Built mobile navigation around Home, Schedule, Requests, Inbox, More, shift detail, marketplace, chat thread, security settings, account deletion, workspace switching, department scope, calendar sync, and legal/support screens.",
  ],
  decisions: [
    {
      title: "Relational source of truth",
      detail:
        "Kept the durable operational contract in MySQL migrations and schema snapshots because shifts, approvals, payroll handoff, audit evidence, and reporting projections need consistent workspace-scoped records.",
    },
    {
      title: "Scope before screens",
      detail:
        "Made workspace isolation, department context, permission-first RBAC, and entitlement gates backend concerns before exposing the same workflows through web and mobile clients.",
    },
    {
      title: "Operational evidence by design",
      detail:
        "Used audit logs, compliance evaluations, decision evidence, request histories, notification logs, and projection refresh queues so scheduling changes leave an explainable trail.",
    },
  ],
  flow:
    "Student + Manager Actions -> Auth + Workspace/Department Scope -> Scheduler/Requests/Marketplace -> Compliance + Eligibility -> Audit + Notifications -> Board/Workbook/Payroll Projections -> Web + iOS Operations",
  challenges: [
    "Turning messy shift operations into structured workflows without losing the flexibility managers need during real coverage changes.",
    "Keeping web and mobile behavior aligned while protecting workspace scope, department scope, permissions, messaging privacy, and payroll-sensitive data.",
  ],
  impactMetrics: [
    {
      label: "Public Release",
      value: "iOS",
      detail: "Shiftelix is listed on the App Store as an iPhone workforce scheduling app.",
    },
    {
      label: "Deployment",
      value: "Render",
      detail: "The current blueprint defines a Dockerized API, static web frontend, media worker, and DocQA ingest worker.",
    },
    {
      label: "Data Model",
      value: "MySQL",
      detail: "The schema covers scheduling, requests, compliance, audit, payroll, projections, workspaces, departments, and users.",
    },
  ],
  outcomes: [
    "Released a real Shiftelix iPhone app and public product site instead of leaving the work as a private prototype.",
    "Evolved the Rutgers scheduling automation work into one broader workforce operations platform with backend, web, mobile, deployment, and operational readiness layers.",
    "Built an engineering story where the strongest asset is the system design: one operational data model feeding scheduling, requests, compliance, audit, payroll, reporting, messaging, and mobile workflows.",
  ],
  lessons: [
    "The hard part of workforce scheduling is not the calendar UI; it is preserving scope, evidence, and accountability when people change plans.",
    "A strong data model becomes product leverage when compliance, permissions, payroll, notifications, and reporting all depend on the same operational truth.",
  ],
};

const twitterSearchProject: Project = {
  id: "twitter-search-analytics-engine",
  title: "Twitter Search Analytics Engine",
  type: "DS",
  typeLabel: "Analytics Engineering",
  icon: "trend",
  summary:
    "A high-performance Twitter search and analytics system using MySQL, MongoDB, indexing, caching, and Streamlit dashboards to query millions of records with sub-200ms response times.",
  role: "Analytics Engineer",
  domain: "Search Analytics / Query Optimization",
  techStack: ["Python", "MySQL", "MongoDB", "Streamlit", "Indexing", "Caching", "SQL", "NoSQL"],
  problem:
    "Large social datasets needed fast search, filtering, and analytics across user and tweet records stored in different database systems.",
  context:
    "Resume-backed project focused on high-performance querying, multi-database design, caching, and real-time analytics dashboard behavior.",
  stakes:
    "Without careful indexing, caching, and data-model separation, search latency would make analytics workflows too slow for interactive use.",
  ownership: [
    "Designed a hybrid storage model with MySQL for users and MongoDB for tweet and retweet data.",
    "Implemented indexing and caching strategies to accelerate predefined search filters.",
    "Built Streamlit dashboards for analytics, query tracking, and interactive exploration.",
  ],
  goals: [
    "Support efficient search across millions of user, tweet, and retweet records.",
    "Reduce query latency enough for interactive analytics use.",
    "Make query behavior visible through dashboard and tracking views.",
  ],
  architecture:
    "A hybrid relational and document-store system with MySQL user records, MongoDB tweet collections, indexed query paths, caching layers, and Streamlit dashboards for analytics and query tracking.",
  implementation: [
    "Stored normalized user entities in MySQL and high-volume tweet/retweet records in MongoDB to match access patterns.",
    "Applied optimized indexing and caching to reduce repeated search latency across predefined filters.",
    "Built a Streamlit dashboard that exposed search filters, result views, and real-time query tracking.",
  ],
  decisions: [
    {
      title: "Use each database for its access pattern",
      detail:
        "Separated user records and tweet documents because relational and document workloads had different query shapes.",
    },
    {
      title: "Optimize before visualizing",
      detail:
        "Focused on indexes and cache behavior before dashboard polish so the interface felt fast under real query volume.",
    },
    {
      title: "Expose query feedback",
      detail:
        "Added dashboard-level query tracking so performance became visible rather than hidden behind search results.",
    },
  ],
  flow:
    "Tweet/User Data -> MySQL + MongoDB Storage -> Indexing + Caching -> Search Filters -> Streamlit Analytics Dashboard -> Query Tracking",
  challenges: [
    "Keeping searches fast while data lived across relational and document stores.",
    "Designing filters that stayed useful without creating unbounded query combinations.",
  ],
  impactMetrics: [
    {
      label: "Latency Cut",
      value: "-80%",
      detail: "Indexing and caching reduced response time by 80%.",
    },
    {
      label: "Response Time",
      value: "<200ms",
      detail: "Search responses were reduced to under 200ms for optimized query paths.",
    },
    {
      label: "Storage Model",
      value: "SQL + NoSQL",
      detail: "MySQL and MongoDB were combined to match distinct record and document access patterns.",
    },
  ],
  outcomes: [
    "Improved query efficiency across millions of records through indexing and caching.",
    "Reduced response times by 80% to under 200ms for interactive search workflows.",
    "Delivered a Streamlit analytics dashboard with predefined filters and real-time query tracking.",
  ],
  lessons: [
    "Search performance depends as much on data modeling as on query syntax.",
    "Interactive analytics needs latency work before visual dashboards can feel credible.",
  ],
};

const dataEngineeringSkills: SkillGroup[] = [
  {
    category: "Programming",
    skills: ["Python", "Scala", "Java", "SQL", "NoSQL", "C++"],
  },
  {
    category: "AWS and GCP",
    skills: ["S3", "Glue", "Redshift", "Lambda", "Kinesis", "EMR", "BigQuery", "Dataflow"],
  },
  {
    category: "Big Data",
    skills: ["Databricks", "Apache Spark", "Kafka", "Hadoop", "Informatica", "Airflow"],
  },
  {
    category: "Warehousing",
    skills: ["Snowflake", "SQL Server", "MySQL", "MongoDB", "Neo4j", "ArangoDB"],
  },
];

const softwareSkills: SkillGroup[] = [
  {
    category: "Product Stack",
    skills: ["React", "Node.js", "Python", "REST APIs", "Spring Boot", "Microservices"],
  },
  {
    category: "Data Backends",
    skills: ["MySQL", "PostgreSQL", "MongoDB", "AWS RDS", "Redshift", "Snowflake"],
  },
  {
    category: "Cloud Delivery",
    skills: ["AWS", "GCP", "Docker", "Kubernetes", "Jenkins", "Azure DevOps"],
  },
  {
    category: "System Design",
    skills: ["Domain-Driven Design", "RBAC", "Audit Logs", "Scheduling Rules", "CI/CD", "Data Integrity"],
  },
];

const dataScienceSkills: SkillGroup[] = [
  {
    category: "Modeling",
    skills: ["Statistics", "Time Series", "Regression", "Financial Data Mining", "Feature Engineering", "Validation"],
  },
  {
    category: "Data Processing",
    skills: ["Python", "PySpark", "SQL", "Databricks", "Data Wrangling", "Spark SQL"],
  },
  {
    category: "Analytics Apps",
    skills: ["Streamlit", "Plotly", "QuickSight", "Tableau", "Power BI", "Looker"],
  },
  {
    category: "Data Stores",
    skills: ["MySQL", "MongoDB", "Redshift", "Snowflake", "BigQuery", "NoSQL"],
  },
];

const analystSkills: SkillGroup[] = [
  {
    category: "BI and Reporting",
    skills: ["QuickSight", "Tableau", "Power BI", "Looker", "Dashboard Design", "KPI Modeling"],
  },
  {
    category: "Analytics SQL",
    skills: ["SQL", "CTEs", "Stored Procedures", "Spark SQL", "Redshift", "MySQL"],
  },
  {
    category: "Data Prep",
    skills: ["Python", "Data Wrangling", "Data Quality", "ETL", "ELT", "Validation"],
  },
  {
    category: "Business Context",
    skills: ["Healthcare Analytics", "Workforce Ops", "Public Data", "Trend Analysis", "Stakeholder Reporting", "Cost Analysis"],
  },
];

function createBaseProfile({
  headline,
  about,
  focusAreas,
  metrics,
  skills,
  projects,
  sectionCopy,
  footerTagline,
}: {
  headline: string;
  about: string[];
  focusAreas: string[];
  metrics: PortfolioData["metrics"];
  skills: SkillGroup[];
  projects: Project[];
  sectionCopy: PortfolioData["sectionCopy"];
  footerTagline: string;
}): PortfolioData {
  return {
    personal: {
      ...sharedIdentity,
      headline,
      about,
      focusAreas,
      resume: withPublicAsset("resume.pdf"),
    },
    metrics,
    skills,
    projects,
    experience: sharedExperience,
    education: sharedEducation,
    certifications: sharedCertifications,
    sectionCopy,
    footer: {
      tagline: footerTagline,
    },
  };
}

const dataEngineerProfile = createBaseProfile({
  headline: "Senior Data Engineer | S&P Global | AWS Lakehouse Platforms | Founder, Shiftelix",
  about: [
    "I build governed cloud data platforms where reliability, lineage, cost, and user-facing product impact have to work together.",
    "My strongest work spans AWS lakehouse delivery, Spark transformations, Redshift/Snowflake warehousing, orchestration, and operational data models.",
    "As founder of Shiftelix, I also own the product data model behind schedules, requests, compliance evidence, audit chains, payroll exports, reporting projections, web, and mobile.",
  ],
  focusAreas: ["AWS data lakes", "Spark and Databricks", "Operational data models", "Warehouse reliability"],
  metrics: [
    { label: "Current Role", value: "S&P Global" },
    { label: "Daily Records", value: "10M+" },
    { label: "Shiftelix Core", value: "MySQL" },
    { label: "Cloud Delivery", value: "Render" },
  ],
  skills: dataEngineeringSkills,
  projects: [
    enterpriseLakehouseProject,
    covidAnalyticsProject,
    shiftelixProject,
    twitterSearchProject,
  ],
  sectionCopy: {
    about: {
      eyebrow: "About Ganesh",
      title: "Senior data engineer building reliable platforms and product-grade operational systems.",
      impactLabel: "Signal Snapshot",
      focusLabel: "Current Focus",
    },
    skills: {
      eyebrow: "Capabilities",
      title: "Cloud data engineering from ingestion to trusted consumption.",
      description:
        "AWS, GCP, Spark, Databricks, streaming, warehouse tuning, orchestration, and quality-controlled delivery for high-volume data products.",
    },
    projects: {
      eyebrow: "Case Studies",
      title: "Selected systems with real scale, state, and accountability.",
      description:
        "Enterprise migrations, healthcare ingestion, Shiftelix workforce operations, and search analytics grounded in resume, repo, and shipped-product evidence.",
    },
    experience: {
      eyebrow: "Experience",
      title: "Enterprise data platforms plus founder-level product architecture.",
      description:
        "S&P Global, Quantiphi AWS work, and Shiftelix share the same bar: clear contracts, reliable data, scoped access, and accountable operations.",
    },
    education: {
      eyebrow: "Education",
      title: "Graduate statistics plus a computer science engineering foundation.",
      description:
        "Rutgers graduate coursework in statistics and databases builds on Army Institute of Technology computer science training in algorithms, operating systems, networks, and database systems.",
    },
    contact: {
      eyebrow: "Contact",
      title: "Let us talk about data platforms, analytics systems, or workforce operations software.",
      description:
        "Open to senior data engineering, cloud data platform, analytics engineering, and product-minded engineering conversations.",
      chips: ["Senior Data Engineering", "AWS Platforms", "Shiftelix"],
      reachLabel: "Best Way To Reach Me",
    },
  },
  footerTagline: "Senior Data Engineer building reliable cloud data platforms and product-grade operational systems.",
});

const softwareEngineerProfile = createBaseProfile({
  headline: "Software Engineer | Backend Systems | Founder, Shiftelix",
  about: [
    "I build workflow-heavy software where the database, API contract, permissions model, and user experience all have to agree.",
    "Shiftelix shows that range: Node/Express services, React web, Expo mobile, MySQL migrations, Render deployment, Firebase messaging, RBAC, compliance, audit, and account lifecycle controls.",
    "My data engineering background makes me strongest in backend systems where integrity, scale, and business rules are part of the product experience.",
  ],
  focusAreas: ["Backend APIs", "Workflow systems", "Mobile + web products", "Cloud deployment"],
  metrics: [
    { label: "Public Product", value: "Shiftelix" },
    { label: "Release Surface", value: "iOS" },
    { label: "Backend", value: "Node" },
    { label: "Database", value: "MySQL" },
  ],
  skills: softwareSkills,
  projects: [
    shiftelixProject,
    twitterSearchProject,
    enterpriseLakehouseProject,
  ],
  sectionCopy: {
    about: {
      eyebrow: "Software Lens",
      title: "Backend and product engineering for operational software.",
      impactLabel: "Build Snapshot",
      focusLabel: "System Focus",
    },
    skills: {
      eyebrow: "Engineering Stack",
      title: "APIs, data stores, mobile workflows, and cloud delivery.",
      description:
        "React, Node/Express, Expo React Native, REST APIs, MySQL, Render, Firebase messaging, CI/CD, access controls, and deployment patterns.",
    },
    projects: {
      eyebrow: "Product Work",
      title: "Software projects with real workflow and data constraints.",
      description:
        "A shipped workforce scheduling product, search analytics, and enterprise data platform services.",
    },
    experience: {
      eyebrow: "Experience",
      title: "Enterprise platform work translated into shipped product systems.",
      description:
        "Backend services, data models, auth and scope controls, release workflows, mobile surfaces, and product-grade operational systems.",
    },
    education: {
      eyebrow: "Education",
      title: "Computer science engineering and data science training behind the product work.",
      description:
        "Army Institute of Technology CS fundamentals and Rutgers graduate coursework in statistics, databases, and data wrangling support practical decisions around schemas, workflows, and reliable data products.",
    },
    contact: {
      eyebrow: "Contact",
      title: "Let us talk about backend systems, product engineering, or operations software.",
      description:
        "Open to engineering conversations around workflow-heavy products, data-backed applications, platform services, and cloud delivery.",
      chips: ["Backend Systems", "Product Engineering", "Workflow Automation"],
      reachLabel: "Best Way To Reach Me",
    },
  },
  footerTagline: "Building backend systems and product workflows with data integrity at the center.",
});

const dataScientistProfile = createBaseProfile({
  headline: "Data Science and Analytics Engineer | Statistics, Search, and Cloud Data",
  about: [
    "My data science work starts with the data path: clean the inputs, make the feature or query layer trustworthy, then expose the result clearly.",
    "Rutgers statistics and data science training builds on an Army Institute of Technology CS foundation for search, public-health analytics, and financial/data mining work.",
    "I bring engineering discipline to analytical systems so dashboards, experiments, and query tools are reproducible and fast enough to use.",
  ],
  focusAreas: ["Statistical modeling", "Search analytics", "Feature pipelines", "Dashboard-ready data"],
  metrics: [
    { label: "Query Speedup", value: "80%" },
    { label: "Response Time", value: "<200ms" },
    { label: "Daily Records", value: "10M+" },
    { label: "Prep Time Cut", value: "30%" },
  ],
  skills: dataScienceSkills,
  projects: [
    twitterSearchProject,
    covidAnalyticsProject,
    enterpriseLakehouseProject,
    shiftelixProject,
  ],
  sectionCopy: {
    about: {
      eyebrow: "Analytics Lens",
      title: "Analytical systems built on reliable data paths.",
      impactLabel: "Analytics Snapshot",
      focusLabel: "Analytical Focus",
    },
    skills: {
      eyebrow: "Data Science Stack",
      title: "Statistics, processing, search, and dashboard delivery.",
      description:
        "Statistical coursework, Python, SQL, Spark, data wrangling, query optimization, and dashboard tools.",
    },
    projects: {
      eyebrow: "Analytical Work",
      title: "Projects where speed, quality, and decision visibility matter.",
      description:
        "Search analytics, healthcare trend pipelines, enterprise migration, and Shiftelix scheduling operations data models.",
    },
    experience: {
      eyebrow: "Experience",
      title: "Data engineering discipline applied to analytics.",
      description:
        "Large-scale ingestion, transformation, dashboard delivery, query optimization, and governed analytical outputs.",
    },
    education: {
      eyebrow: "Education",
      title: "Statistics, data science, and computer science foundation.",
      description:
        "Rutgers coursework in probability, statistics, regression, time series, databases, financial data mining, and data wrangling builds on Army Institute of Technology CS coursework in algorithms and systems.",
    },
    contact: {
      eyebrow: "Contact",
      title: "Let us talk about data science systems that need reliable data underneath.",
      description:
        "Open to analytics engineering, data science, BI platform, and search/query performance conversations.",
      chips: ["Analytics Engineering", "Search Systems", "Data Science"],
      reachLabel: "Best Way To Reach Me",
    },
  },
  footerTagline: "Turning statistical and analytical work into reliable, fast, usable data systems.",
});

const dataAnalystProfile = createBaseProfile({
  headline: "Data Analyst and BI Engineer | SQL, Dashboards, KPI Systems, and Cloud Analytics",
  about: [
    "I build analytical views that make operations easier to understand: clean ingestion, fast SQL, and dashboards tied to real decisions.",
    "At Quantiphi, that meant turning high-volume AWS pipelines into Redshift and QuickSight outputs for technology and healthcare stakeholders.",
    "In project work, it means search analytics and scheduling data models where performance, filters, and operational visibility matter.",
  ],
  focusAreas: ["SQL analytics", "BI dashboards", "KPI systems", "Data quality"],
  metrics: [
    { label: "Dashboards", value: "QuickSight" },
    { label: "Query Speed", value: "+20%" },
    { label: "Prep Time Cut", value: "30%" },
    { label: "Search Latency", value: "<200ms" },
  ],
  skills: analystSkills,
  projects: [
    covidAnalyticsProject,
    twitterSearchProject,
    enterpriseLakehouseProject,
    shiftelixProject,
  ],
  sectionCopy: {
    about: {
      eyebrow: "BI Lens",
      title: "Analytics work that connects clean data to decisions.",
      impactLabel: "BI Snapshot",
      focusLabel: "Reporting Focus",
    },
    skills: {
      eyebrow: "Analytics Stack",
      title: "SQL, BI, data prep, and stakeholder-ready reporting.",
      description:
        "QuickSight, Tableau, Power BI, Looker, Redshift, MySQL, Spark SQL, CTEs, stored procedures, and quality-controlled data prep.",
    },
    projects: {
      eyebrow: "Reporting Work",
      title: "Dashboards and query systems with real performance constraints.",
      description:
        "Healthcare dashboards, Twitter search analytics, warehouse tuning, and workforce operations data products.",
    },
    experience: {
      eyebrow: "Experience",
      title: "Analytics delivery rooted in production data engineering.",
      description:
        "Dashboard, SQL, stakeholder, and KPI delivery built on the same cloud data engineering foundation.",
    },
    education: {
      eyebrow: "Education",
      title: "Engineering and graduate coursework that sharpen analytical judgment.",
      description:
        "Army Institute of Technology computer science training plus Rutgers coursework in statistics, time series, advanced databases, financial data mining, and data wrangling shape the analytical approach.",
    },
    contact: {
      eyebrow: "Contact",
      title: "Let us talk about dashboards, SQL systems, or analytics-ready data pipelines.",
      description:
        "Open to BI, analytics engineering, data analyst, and data platform conversations where speed and trust both matter.",
      chips: ["BI Engineering", "SQL Analytics", "Dashboard Delivery"],
      reachLabel: "Best Way To Reach Me",
    },
  },
  footerTagline: "Building trustworthy analytical views from fast SQL, clean data, and clear business context.",
});

export const portfolioProfiles: Record<ProfileSlug, PortfolioData> = {
  dataengineer: dataEngineerProfile,
  softwareengineer: softwareEngineerProfile,
  datascientist: dataScientistProfile,
  datanalyst: dataAnalystProfile,
};
