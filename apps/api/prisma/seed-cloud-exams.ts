import { ExamSeed, mc, multi, num, tf } from "./seed-helpers";
import { SAA_SECURE } from "./saa-bank-secure";
import { SAA_RESILIENT } from "./saa-bank-resilient";
import { SAA_PERF_A } from "./saa-bank-perf-a";
import { SAA_PERF_B } from "./saa-bank-perf-b";
import { CCSP_CONCEPTS_ARCHITECTURE, CCSP_DATA_PLATFORM_SECURITY, CCSP_LEGAL_RISK_COMPLIANCE } from "./bank-ccsp";
import { CLOUDPLUS_ARCHITECTURE, CLOUDPLUS_DEPLOYMENT_OPERATIONS, CLOUDPLUS_SECURITY_TROUBLESHOOTING } from "./bank-comptia-cloud-plus";
import { AZ104_IDENTITY_GOVERNANCE, AZ104_STORAGE_COMPUTE, AZ104_NETWORKING_MONITORING } from "./bank-az-104";
import { MS102_TENANT_IDENTITY, MS102_SECURITY_THREAT_PROTECTION, MS102_COMPLIANCE_DEVICE_MANAGEMENT } from "./bank-ms-102";
import { AZ305_IDENTITY_GOVERNANCE, AZ305_DATA_COMPUTE, AZ305_NETWORKING_RESILIENCE } from "./bank-az-305";
import { AWSSAP_ORGANISATIONAL_COMPLEXITY, AWSSAP_MIGRATION_MODERNISATION, AWSSAP_COST_RESILIENCE } from "./bank-aws-sap";
import { AWSDVA_DEVELOPMENT_WITH_AWS_SERVICES, AWSDVA_SECURITY, AWSDVA_DEPLOYMENT_TROUBLESHOOTING } from "./bank-aws-dva";
import { AWSDEVOPS_CICD_AUTOMATION, AWSDEVOPS_MONITORING_LOGGING, AWSDEVOPS_INCIDENT_SECURITY } from "./bank-aws-devops";
import { GCPACE_SETTING_UP_ENVIRONMENT, GCPACE_COMPUTE_STORAGE, GCPACE_OPERATIONS_ACCESS } from "./bank-gcp-ace";

// Original practice content. Not affiliated with or endorsed by ISC2, CompTIA,
// Microsoft, Amazon Web Services or Google.

const base = { category: "Cloud", durationMinutes: 20 };

export const CLOUD_EXAMS: ExamSeed[] = [
  {
    ...base,
    slug: "ccsp",
    title: "CCSP Practice",
    shortCode: "CCSP",
    provider: "ISC2 (unofficial)",
    level: "Professional",
    sortOrder: 10,
    durationMinutes: 180,
    blueprint: { questionCount: 60, randomize: true },
    description:
      "Practice questions in the style of the Certified Cloud Security Professional (CCSP). Independent content, not affiliated with or endorsed by ISC2.",
    topics: [
      { title: "Cloud Concepts & Architecture", questions: CCSP_CONCEPTS_ARCHITECTURE },
      { title: "Cloud Data & Platform Security", questions: CCSP_DATA_PLATFORM_SECURITY },
      { title: "Legal, Risk & Compliance", questions: CCSP_LEGAL_RISK_COMPLIANCE },
    ],
  },
  {
    ...base,
    slug: "comptia-cloud-plus",
    title: "CompTIA Cloud+ Practice",
    shortCode: "CV0-004",
    provider: "CompTIA (unofficial)",
    level: "Intermediate",
    sortOrder: 11,
    durationMinutes: 90,
    blueprint: { questionCount: 60, randomize: true },
    description:
      "Practice questions in the style of CompTIA Cloud+. Independent content, not affiliated with or endorsed by CompTIA.",
    topics: [
      { title: "Cloud Architecture", questions: CLOUDPLUS_ARCHITECTURE },
      { title: "Deployment & Operations", questions: CLOUDPLUS_DEPLOYMENT_OPERATIONS },
      { title: "Security & Troubleshooting", questions: CLOUDPLUS_SECURITY_TROUBLESHOOTING },
    ],
  },
  {
    ...base,
    slug: "azure-administrator-az-104",
    title: "Azure Administrator Practice",
    shortCode: "AZ-104",
    provider: "Microsoft Azure (unofficial)",
    level: "Associate",
    sortOrder: 12,
    durationMinutes: 100,
    blueprint: { questionCount: 50, randomize: true },
    description:
      "Practice questions in the style of Microsoft Certified: Azure Administrator Associate (AZ-104). Independent content, not affiliated with or endorsed by Microsoft.",
    topics: [
      { title: "Identity & Governance", questions: AZ104_IDENTITY_GOVERNANCE },
      { title: "Storage & Compute", questions: AZ104_STORAGE_COMPUTE },
      { title: "Networking & Monitoring", questions: AZ104_NETWORKING_MONITORING },
    ],
  },
  {
    ...base,
    slug: "microsoft-365-administrator-ms-102",
    title: "Microsoft 365 Administrator Practice",
    shortCode: "MS-102",
    provider: "Microsoft (unofficial)",
    level: "Expert",
    sortOrder: 13,
    durationMinutes: 100,
    blueprint: { questionCount: 50, randomize: true },
    description:
      "Practice questions in the style of Microsoft 365 Administrator Expert (MS-102). Independent content, not affiliated with or endorsed by Microsoft.",
    topics: [
      { title: "Tenant & Identity", questions: MS102_TENANT_IDENTITY },
      { title: "Security & Threat Protection", questions: MS102_SECURITY_THREAT_PROTECTION },
      { title: "Compliance & Device Management", questions: MS102_COMPLIANCE_DEVICE_MANAGEMENT },
    ],
  },
  {
    ...base,
    slug: "azure-solutions-architect-az-305",
    title: "Azure Solutions Architect Practice",
    shortCode: "AZ-305",
    provider: "Microsoft Azure (unofficial)",
    level: "Expert",
    sortOrder: 14,
    durationMinutes: 120,
    blueprint: { questionCount: 50, randomize: true },
    description:
      "Scenario-style practice in the style of Microsoft Certified: Azure Solutions Architect Expert (AZ-305), which builds on AZ-104 administrator skills. Independent content, not affiliated with or endorsed by Microsoft.",
    topics: [
      { title: "Design Identity & Governance", questions: AZ305_IDENTITY_GOVERNANCE },
      { title: "Design Data & Compute", questions: AZ305_DATA_COMPUTE },
      { title: "Design Networking & Resilience", questions: AZ305_NETWORKING_RESILIENCE },
    ],
  },
  {
    ...base,
    slug: "aws-solutions-architect-associate",
    title: "AWS Solutions Architect Associate Practice",
    shortCode: "SAA-C03",
    provider: "Amazon Web Services (unofficial)",
    level: "Associate",
    sortOrder: 15,
    description:
      "Practice questions in the style of AWS Certified Solutions Architect - Associate (SAA-C03). Independent content, not affiliated with or endorsed by Amazon Web Services.",
    topics: [
      {
        title: "Secure Architectures",
        questions: [
          mc("How should an EC2 instance get access to an S3 bucket without storing access keys?", ["Attach an IAM role through an instance profile", "Hard-code keys in the app", "Use the root user", "Make the bucket public"], 0, "Roles supply temporary credentials automatically."),
          mc("Which option encrypts S3 objects with keys you can audit and rotate?", ["SSE-KMS", "No encryption", "SSE with keys emailed to you", "Client-side plain text"], 0, "SSE-KMS uses AWS KMS keys with audit logging through CloudTrail."),
          mc("Which control is a stateful firewall at the instance level?", ["Security group", "Network ACL", "Route table", "Internet gateway"], 0, "Security groups are stateful. Network ACLs are stateless and work at the subnet level."),
        ],
      },
      {
        title: "Resilient Architectures",
        questions: [
          mc("Which RDS feature provides high availability across Availability Zones?", ["Multi-AZ deployment", "Read replica in the same AZ", "Manual snapshots only", "Larger instance size"], 0, "Multi-AZ keeps a standby in another AZ and fails over automatically."),
          mc("Which service helps decouple application components with a message queue?", ["Amazon SQS", "Amazon EBS", "AWS Config", "Amazon Route 53"], 0, "SQS buffers messages between producers and consumers."),
          tf("An Application Load Balancer can distribute traffic across targets in multiple Availability Zones.", true, "Load balancers can span AZs to improve availability."),
        ],
      },
      {
        title: "High-Performing & Cost-Optimised",
        questions: [
          mc("Which service caches static content close to users?", ["Amazon CloudFront", "AWS Backup", "Amazon Macie", "AWS Artifact"], 0, "CloudFront is a content delivery network with edge locations."),
          mc("For a steady, predictable workload, which option gives lower cost in return for a commitment?", ["Savings Plans or Reserved Instances", "On-demand only", "Spot Instances for a database", "Dedicated hosts for tests"], 0, "Commitments to usage reduce the price compared with on-demand."),
          mc("Data is accessed rarely but must be retrieved in milliseconds. Which S3 class is a good fit?", ["S3 Standard-IA", "S3 Glacier Deep Archive", "S3 Intelligent-Tiering only", "Instance store"], 0, "Standard-IA is cheaper for infrequent access with immediate retrieval."),
        ],
      },
    ],
  },
  {
    ...base,
    slug: "aws-solutions-architect-professional",
    title: "AWS Solutions Architect Professional Practice",
    shortCode: "SAP-C02",
    provider: "Amazon Web Services (unofficial)",
    level: "Professional",
    sortOrder: 16,
    durationMinutes: 180,
    blueprint: { questionCount: 60, randomize: true },
    description:
      "Scenario-style practice in the style of AWS Certified Solutions Architect - Professional (SAP-C02). Independent content, not affiliated with or endorsed by Amazon Web Services.",
    topics: [
      { title: "Organisational Complexity", questions: AWSSAP_ORGANISATIONAL_COMPLEXITY },
      { title: "Migration & Modernisation", questions: AWSSAP_MIGRATION_MODERNISATION },
      { title: "Cost & Resilience", questions: AWSSAP_COST_RESILIENCE },
    ],
  },
  {
    ...base,
    slug: "aws-developer-associate",
    title: "AWS Developer Associate Practice",
    shortCode: "DVA-C02",
    provider: "Amazon Web Services (unofficial)",
    level: "Associate",
    sortOrder: 17,
    durationMinutes: 130,
    blueprint: { questionCount: 60, randomize: true },
    description:
      "Practice questions in the style of AWS Certified Developer - Associate (DVA-C02). Independent content, not affiliated with or endorsed by Amazon Web Services.",
    topics: [
      { title: "Development with AWS Services", questions: AWSDVA_DEVELOPMENT_WITH_AWS_SERVICES },
      { title: "Security", questions: AWSDVA_SECURITY },
      { title: "Deployment & Troubleshooting", questions: AWSDVA_DEPLOYMENT_TROUBLESHOOTING },
    ],
  },
  {
    ...base,
    slug: "aws-devops-engineer-professional",
    title: "AWS DevOps Engineer Professional Practice",
    shortCode: "DOP-C02",
    provider: "Amazon Web Services (unofficial)",
    level: "Professional",
    sortOrder: 18,
    durationMinutes: 180,
    blueprint: { questionCount: 60, randomize: true },
    description:
      "Scenario-style practice in the style of AWS Certified DevOps Engineer - Professional (DOP-C02). Independent content, not affiliated with or endorsed by Amazon Web Services.",
    topics: [
      {
        title: "CI/CD & Automation",
        questions: AWSDEVOPS_CICD_AUTOMATION,
      },
      {
        title: "Monitoring & Logging",
        questions: AWSDEVOPS_MONITORING_LOGGING,
      },
      {
        title: "Incident Response & Security",
        questions: AWSDEVOPS_INCIDENT_SECURITY,
      },
    ],
  },
  {
    ...base,
    slug: "google-cloud-associate-cloud-engineer",
    title: "Google Cloud Associate Cloud Engineer Practice",
    shortCode: "ACE",
    provider: "Google Cloud (unofficial)",
    level: "Associate",
    sortOrder: 19,
    durationMinutes: 120,
    blueprint: { questionCount: 55, randomize: true },
    description:
      "Practice questions in the style of Google Cloud Certified Associate Cloud Engineer. Independent content, not affiliated with or endorsed by Google.",
    topics: [
      { title: "Setting Up a Cloud Environment", questions: GCPACE_SETTING_UP_ENVIRONMENT },
      { title: "Compute & Storage", questions: GCPACE_COMPUTE_STORAGE },
      { title: "Operations & Access", questions: GCPACE_OPERATIONS_ACCESS },
    ],
  },
];

// SAA-C03 gets a large original question bank and a sampled, exam-length simulation.
const saa = CLOUD_EXAMS.find((exam) => exam.slug === "aws-solutions-architect-associate");
if (!saa) throw new Error("SAA-C03 exam definition not found");
saa.durationMinutes = 130;
saa.blueprint = { questionCount: 65, randomize: true };
saa.topics[0].questions.push(...SAA_SECURE);
saa.topics[1].questions.push(...SAA_RESILIENT);
saa.topics[2].questions.push(...SAA_PERF_A, ...SAA_PERF_B);
