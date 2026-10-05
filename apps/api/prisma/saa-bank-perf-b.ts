import { Q, ms, sc } from "./seed-helpers";

// Original SAA-C03-style scenario questions written for this platform.
// Not copied from any exam, dump or third-party question bank.

export const SAA_PERF_B: Q[] = [
  // ---- Network & content delivery ----
  sc(
    "A news website serves the same articles and images to millions of readers worldwide, and the origin servers are overloaded. Which change reduces origin load and improves page speed for readers the MOST?",
    ["Put Amazon CloudFront in front of the origin and set appropriate cache TTLs", "Add a larger instance type to the origin", "Use a bigger EBS volume", "Enable Multi-AZ on the origin database"],
    0,
    "CloudFront caches content at edge locations close to viewers, so most requests never reach the origin.",
  ),
  sc(
    "A company wants to rewrite request URLs and add security headers to responses at the edge with the LOWEST latency and cost for lightweight logic. What should it use?",
    ["CloudFront Functions", "A fleet of EC2 instances in every Region", "AWS Batch", "Amazon EMR"],
    0,
    "CloudFront Functions run lightweight JavaScript at the edge for high-scale, sub-millisecond operations such as header manipulation and URL rewrites.",
  ),
  sc(
    "A multiplayer game uses UDP traffic and needs users to connect to the closest healthy game server Region with static IP addresses and fast failover. Which service is the BEST fit?",
    ["AWS Global Accelerator", "Amazon CloudFront", "Amazon Route 53 weighted records", "An Application Load Balancer"],
    0,
    "Global Accelerator supports TCP and UDP and routes to the optimal endpoint over the AWS global network. CloudFront is designed for HTTP/HTTPS content.",
  ),
  sc(
    "Instances in private subnets send several terabytes per month to Amazon S3 through a NAT gateway, and the NAT data processing charges are high. What is the MOST cost-effective fix?",
    ["Create a gateway VPC endpoint for S3 and update the route tables", "Move the instances to a public subnet", "Add a second NAT gateway", "Use a larger NAT gateway"],
    0,
    "Traffic to S3 through a gateway endpoint bypasses the NAT gateway and has no endpoint or data processing charge.",
  ),
  sc(
    "An application needs a load balancer that provides static IP addresses per Availability Zone, handles millions of TCP connections per second and preserves the client's source IP. Which should be chosen?",
    ["Network Load Balancer", "Application Load Balancer", "Classic Load Balancer with HTTP listeners", "Gateway Load Balancer"],
    0,
    "NLB operates at layer 4, offers static or Elastic IPs per AZ and handles extreme throughput with very low latency.",
  ),
  sc(
    "An e-commerce site runs separate microservices for /api/orders and /api/catalog and wants a single load balancer that sends each path to a different target group. What should be used?",
    ["An Application Load Balancer with path-based routing rules", "A Network Load Balancer with two IPs", "A NAT gateway", "A Route 53 private hosted zone only"],
    0,
    "ALB operates at layer 7 and supports routing by path, host and headers.",
  ),
  sc(
    "A streaming company must serve one catalogue to viewers in the EU only from EU-based origins for legal reasons, and other content from a global origin. Which Route 53 policy helps direct users by their location?",
    ["Geolocation routing", "Failover routing", "Weighted routing", "Simple routing"],
    0,
    "Geolocation routing answers queries based on the user's location, which suits regulatory or content localisation needs.",
  ),
  sc(
    "A company transfers tens of terabytes a day between its data center and AWS on an ongoing basis, and its internet data transfer bills and variable performance are causing problems. Which option is MOST suitable?",
    ["AWS Direct Connect", "A VPN over the public internet only", "AWS Snowball for each day's data", "Amazon SES"],
    0,
    "Direct Connect provides dedicated, consistent bandwidth and lower data transfer out rates than internet egress for large steady flows.",
  ),
  // ---- Analytics & integration ----
  sc(
    "A company wants to capture streaming clickstream data and deliver it in batches to Amazon S3 as compressed Parquet files with the LEAST management. Which service is BEST?",
    ["Amazon Kinesis Data Firehose", "An EC2 fleet running a custom consumer", "AWS Snowball", "Amazon RDS"],
    0,
    "Firehose is a fully managed delivery service that can buffer, transform, convert formats and load streaming data into S3, Redshift and other destinations.",
  ),
  sc(
    "A team wants to discover the schema of data in S3 and run serverless ETL jobs that prepare it for analysis. Which service combination fits?",
    ["AWS Glue crawlers with the Glue Data Catalog and Glue ETL jobs", "Amazon EC2 with cron", "AWS Config", "Amazon Route 53"],
    0,
    "Glue provides schema discovery, a central catalog and serverless Spark-based ETL.",
  ),
  sc(
    "A company needs to process hundreds of terabytes with Apache Spark and wants to lower cost by using spare capacity for worker nodes. Which service and approach fits?",
    ["Amazon EMR with task nodes on Spot Instances", "A single large EC2 instance", "Amazon RDS Multi-AZ", "AWS Lambda functions running for hours"],
    0,
    "EMR runs big data frameworks, and Spot task nodes reduce cost because task nodes hold no persistent data.",
  ),
  sc(
    "Business users want interactive dashboards on data in S3 and Redshift without managing servers and with pay-per-session pricing. Which service should be used?",
    ["Amazon QuickSight", "AWS CloudFormation", "Amazon Macie", "AWS DataSync"],
    0,
    "QuickSight is a serverless business intelligence service for interactive dashboards.",
  ),
  sc(
    "A company is building a data lake in S3 and needs to grant different teams fine-grained access at the database, table and column level from one place. Which service helps?",
    ["AWS Lake Formation", "Amazon CloudFront", "AWS Shield", "Amazon SNS"],
    0,
    "Lake Formation centralises governance and column-level permissions for data lakes.",
  ),
  sc(
    "A company runs Apache Kafka on premises and wants to move to AWS with minimal application changes and less operational work. Which service should it use?",
    ["Amazon Managed Streaming for Apache Kafka (MSK)", "Amazon SQS FIFO", "Amazon SNS", "Amazon Athena"],
    0,
    "MSK is a managed Kafka service, so existing Kafka clients and tooling continue to work.",
  ),
  sc(
    "A REST API returns the same product catalogue response thousands of times per minute, and each call invokes a Lambda function and queries a database. How can the company reduce backend calls and latency?",
    ["Enable caching on the API Gateway stage", "Increase the Lambda memory only", "Add more read replicas to a database that is not being queried", "Disable throttling"],
    0,
    "API Gateway caching returns stored responses for repeated requests, reducing backend invocations and latency.",
  ),
  sc(
    "A company wants to run real-time SQL-style analytics such as anomaly detection windows over a streaming data source. Which service is designed for this?",
    ["Amazon Managed Service for Apache Flink (formerly Kinesis Data Analytics)", "Amazon S3 Glacier", "AWS Backup", "Amazon EFS"],
    0,
    "Managed Service for Apache Flink processes and analyses streaming data in real time.",
  ),
  // ---- Cost management ----
  sc(
    "A finance team wants an email whenever the forecasted monthly spend for the account is expected to exceed 80 percent of budget. Which service should they use?",
    ["AWS Budgets with a forecasted alert", "AWS CloudTrail", "Amazon Inspector", "AWS X-Ray"],
    0,
    "AWS Budgets tracks actual and forecasted cost and usage and sends alerts when thresholds are crossed.",
  ),
  sc(
    "A company wants to know how much each project team spends on shared AWS accounts. What should it do?",
    ["Apply consistent cost allocation tags and activate them in the billing console", "Ask teams to estimate their spend", "Create a separate Region per team", "Enable VPC Flow Logs"],
    0,
    "Activated cost allocation tags let cost reports and Cost Explorer be grouped by tag values such as team or project.",
  ),
  sc(
    "A solutions architect wants to visualise spending trends over the last 12 months and see recommended Savings Plans based on past usage. Which tool provides this?",
    ["AWS Cost Explorer", "AWS Config", "Amazon Detective", "AWS Artifact"],
    0,
    "Cost Explorer analyses historical cost and usage and provides Savings Plans and Reserved Instance recommendations.",
  ),
  sc(
    "The finance team asks for a quick review that highlights idle load balancers, underused EC2 instances and unassociated Elastic IP addresses. Which service surfaces these?",
    ["AWS Trusted Advisor cost optimization checks", "AWS CloudHSM", "Amazon Macie", "AWS Snowball"],
    0,
    "Trusted Advisor checks for idle and underused resources and reports potential savings.",
  ),
  sc(
    "A team suspects many EC2 instances are oversized. They want data-driven recommendations for better instance types based on utilisation. Which service should they use?",
    ["AWS Compute Optimizer", "AWS Shield", "Amazon SES", "AWS Direct Connect"],
    0,
    "Compute Optimizer analyses CloudWatch utilisation metrics and recommends right-sized resources.",
  ),
  sc(
    "An account contains hundreds of EBS volumes that are not attached to any instance and old snapshots that are no longer needed. What is the MOST effective way to reduce cost?",
    ["Identify and delete unattached volumes and obsolete snapshots after confirming they are not needed", "Detach all volumes from every instance", "Convert everything to io2", "Enable Multi-AZ"],
    0,
    "Unattached volumes and unneeded snapshots continue to incur storage charges.",
  ),
  sc(
    "Development and test EC2 instances run 24 hours a day but are only used from 8 am to 6 pm on weekdays. How can the company cut compute cost without changing the application?",
    ["Automatically stop the instances outside working hours using a scheduler such as AWS Instance Scheduler", "Purchase a three-year Reserved Instance for each", "Move them to larger instances", "Keep them running but reduce their EBS volumes"],
    0,
    "Stopping instances when unused eliminates most of their compute cost for non-production environments.",
  ),
  sc(
    "A company with many linked accounts wants to combine usage to reach volume pricing tiers and share Reserved Instance and Savings Plans discounts. What should it use?",
    ["Consolidated billing in AWS Organizations", "Separate invoices per account with no organization", "Only IAM roles", "Amazon Connect"],
    0,
    "Consolidated billing aggregates usage across member accounts, enabling volume discounts and sharing of commitment discounts.",
  ),
  sc(
    "A production Amazon RDS database has run at steady load for two years and will continue to do so. Which option reduces its cost MOST?",
    ["Purchase Amazon RDS Reserved Instances", "Move it to Spot Instances", "Enable more read replicas", "Turn off backups"],
    0,
    "Reserved Instances offer significant discounts over On-Demand for steady database workloads.",
  ),
  sc(
    "A batch application uses Spot Instances. What should it do to handle interruptions gracefully?",
    ["Monitor the two-minute interruption notice and checkpoint or drain work before the instance is reclaimed", "Ignore interruptions", "Store all state only on the instance", "Use only a single instance type"],
    0,
    "Spot provides a two-minute warning through instance metadata and EventBridge, allowing applications to save progress and stop cleanly.",
  ),
  sc(
    "A company wants to analyse its detailed line-item billing data with SQL for chargeback reports. Which combination is MOST suitable?",
    ["Enable the AWS Cost and Usage Report delivered to S3 and query it with Amazon Athena", "Manually copy numbers from the console into a spreadsheet each month", "Use CloudTrail logs to compute costs", "Use Amazon Rekognition"],
    0,
    "The Cost and Usage Report is the most detailed billing dataset, and Athena can query it in place.",
  ),
  sc(
    "A company serves large downloads from S3 directly to internet users and its data transfer out charges are high. How can it reduce cost while also improving performance?",
    ["Serve the content through Amazon CloudFront", "Move the bucket to a bigger Region", "Enable versioning", "Use S3 Glacier"],
    0,
    "Data transfer from S3 to CloudFront is free, and CloudFront's egress pricing is typically lower and its caching reduces requests to the origin.",
  ),
  sc(
    "A research group shares a large public dataset in S3. Downloads by other organisations are generating large transfer bills for the owner. How can the owner shift download costs to requesters?",
    ["Enable Requester Pays on the bucket", "Enable Transfer Acceleration", "Enable Object Lock", "Use lifecycle rules"],
    0,
    "With Requester Pays, the requester pays for the request and data transfer costs.",
  ),
  sc(
    "A team moves thousands of small log files into S3 Glacier Flexible Retrieval and deletes them after two weeks, yet costs are higher than expected. What is the MOST likely reason?",
    ["Glacier classes have minimum storage duration charges, so early deletion is billed for the full minimum period", "Glacier does not support small files", "Glacier is billed by the number of Regions", "Objects cannot be deleted from Glacier"],
    0,
    "Archive classes charge for a minimum storage duration (90 days for Flexible Retrieval), so short-lived objects should not be transitioned.",
  ),
  sc(
    "An application receives traffic only a few times per day in short bursts. Running it on an always-on EC2 fleet costs too much. What is the MOST cost-effective architecture?",
    ["Use API Gateway with AWS Lambda so the company pays only when requests occur", "Keep a fleet of Reserved Instances", "Use a Dedicated Host", "Run a NAT gateway 24/7"],
    0,
    "Serverless services charge per invocation and execution time, so idle time costs nothing.",
  ),
  sc(
    "A company keeps years of EBS snapshots for compliance, rarely restoring them. How can it reduce snapshot storage cost?",
    ["Move eligible snapshots to the EBS Snapshots Archive tier", "Copy snapshots to instance store", "Convert snapshots to AMIs", "Encrypt them again"],
    0,
    "The archive tier offers significantly lower storage price for snapshots that are rarely retrieved, with a longer restore time.",
  ),
  sc(
    "Users often abandon large uploads to S3, and the bucket accumulates incomplete multipart upload parts that still incur charges. What is the SIMPLEST way to clean them up?",
    ["Add an S3 lifecycle rule to abort incomplete multipart uploads after a set number of days", "Enable Transfer Acceleration", "Enable Object Lock", "Turn on server access logging"],
    0,
    "Lifecycle rules can automatically remove incomplete multipart uploads so their parts stop generating cost.",
  ),
  sc(
    "A team runs many general purpose SSD volumes on the older gp2 type. What can they do to often lower cost while keeping or improving performance with no downtime?",
    ["Modify the volumes to gp3 online", "Replace them with io2 volumes", "Move the data to instance store", "Detach and reattach each volume daily"],
    0,
    "gp3 is generally priced lower than gp2 and can be selected by modifying a volume while it is in use.",
  ),
  sc(
    "A team runs a Lambda function that processes events and wants to cut its duration-based cost without changing business logic. Which change may reduce the price per millisecond for supported runtimes?",
    ["Switch the function architecture to arm64 (Graviton2)", "Increase the timeout", "Move the function into a VPC", "Add a NAT gateway"],
    0,
    "Lambda functions on arm64 are billed at a lower rate per millisecond and often run faster for compatible code.",
  ),
  sc(
    "Costs in the account have unexpectedly spiked several times, and the team only notices at month end. Which service can detect unusual spend and alert them earlier?",
    ["AWS Cost Anomaly Detection", "AWS Artifact", "Amazon Inspector", "AWS Snowmobile"],
    0,
    "Cost Anomaly Detection uses machine learning to detect unusual spend patterns and can send alerts.",
  ),
  sc(
    "A company bought a Savings Plan last year and wants to make sure it is fully used and that most eligible usage is covered. Which reports help?",
    ["Savings Plans utilisation and coverage reports in Cost Explorer", "VPC Flow Logs", "S3 Inventory", "CloudFront access logs"],
    0,
    "Utilisation shows how much of the commitment is used, and coverage shows how much eligible spend is covered.",
  ),
  sc(
    "A company has existing per-socket, per-core server-bound software licences and wants to use them on AWS to control costs and satisfy licence terms. Which option supports this?",
    ["Amazon EC2 Dedicated Hosts", "AWS Lambda", "Amazon Aurora Serverless", "Amazon Kinesis"],
    0,
    "Dedicated Hosts provide visibility into sockets and cores, which supports bring-your-own-licence scenarios.",
  ),
  ms(
    "A company wants to reduce Amazon S3 storage cost for a large data set with mixed access patterns. Which TWO actions should it take? (Choose two.)",
    ["Use S3 Lifecycle rules to transition older objects to cheaper storage classes", "Use S3 Intelligent-Tiering for data with unknown or changing access patterns", "Store every object in S3 Standard permanently", "Enable cross-Region replication for all objects", "Turn off versioning and lifecycle management"],
    [0, 1],
    "Lifecycle transitions and Intelligent-Tiering both reduce the cost of infrequently accessed data. Replication increases cost, and keeping everything in Standard is the most expensive option.",
  ),
  ms(
    "A company has a steady, predictable EC2 workload that will run for the next three years. Which TWO options reduce cost the MOST compared with On-Demand? (Choose two.)",
    ["Purchase an EC2 Instance Savings Plan or a Compute Savings Plan", "Purchase Standard Reserved Instances", "Run everything on Spot Instances regardless of interruption tolerance", "Use Dedicated Hosts without a licensing need", "Keep using On-Demand only"],
    [0, 1],
    "Committing to usage through Savings Plans or Reserved Instances gives significant discounts for steady workloads.",
  ),
  ms(
    "A company wants to lower data transfer costs for a multi-tier application. Which TWO actions help? (Choose two.)",
    ["Use VPC endpoints to reach AWS services without passing through a NAT gateway", "Use CloudFront to cache content close to users", "Route all traffic between tiers through the internet", "Place every tier in a different Region", "Send all backups to the internet over the public IP"],
    [0, 1],
    "Endpoints avoid NAT data processing charges, and CloudFront lowers repeated transfer from the origin. Cross-Region and internet routing add cost.",
  ),
];
