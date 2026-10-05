import { Q, sa, sc, withPassage } from "./seed-helpers";

// Original transcripts and questions written for this platform.
// Listening is presented as a transcript because the platform has no audio.

const gap = (stem: string, accepted: string[], explanation: string): Q =>
  sa(`${stem}\n\nWrite NO MORE THAN TWO WORDS AND/OR A NUMBER.`, accepted, explanation, 3);

export const IELTS_LISTENING: Q[] = [
  ...withPassage(
    "Transcript (Section 1): Telephone call to a sports centre\n\nReceptionist: Greenfield Sports Centre, how can I help?\nCaller: Hello, I'd like to join the centre. What types of membership do you have?\nReceptionist: There's a standard membership at forty-five pounds a month, which includes the gym and the pool. Or a premium one at sixty pounds that also covers fitness classes.\nCaller: I'd like the standard one, please.\nReceptionist: Certainly. Can I take your name?\nCaller: Yes, it's Helen Marsden. That's M-A-R-S-D-E-N.\nReceptionist: And your address?\nCaller: Fourteen Alder Road.\nReceptionist: Postcode?\nCaller: It's TR7 4QL.\nReceptionist: Thank you. Do you have any medical conditions we should know about?\nCaller: I have asthma, but it's well controlled.\nReceptionist: Noted. There's an induction session for new members. You can choose Tuesday at six or Saturday at ten.\nCaller: Saturday suits me better.\nReceptionist: Lovely. Please bring a form of photo ID, and a padlock for the locker, as we don't supply them.",
    [
      gap("Membership type chosen: _____", ["standard"], "The caller says 'I'd like the standard one'."),
      gap("Monthly cost of chosen membership: £_____", ["45", "forty-five", "forty five"], "The standard membership is forty-five pounds a month."),
      gap("Surname: _____", ["marsden"], "Spelled M-A-R-S-D-E-N."),
      gap("Street name: Alder _____", ["road"], "'Fourteen Alder Road'."),
      gap("Postcode: TR7 _____", ["4ql"], "Postcode TR7 4QL."),
      gap("Medical condition: _____", ["asthma"], "The caller mentions asthma."),
      gap("Induction session day: _____", ["saturday"], "The caller chooses Saturday at ten."),
      gap("Induction session time: _____ am", ["10", "ten", "10 am", "10am"], "Saturday at ten."),
      gap("Bring photo _____", ["id"], "'Please bring a form of photo ID'."),
      gap("Bring a _____ for the locker", ["padlock"], "The centre does not supply padlocks."),
    ],
  ),
  ...withPassage(
    "Transcript (Section 1): Enquiry about an evening language course\n\nStaff: Riverside Adult Education, Priya speaking.\nMan: Hi, I'm interested in a Spanish course for beginners.\nStaff: We have one starting on the ninth of October. It runs for ten weeks on Wednesday evenings.\nMan: What time is that?\nStaff: Half past six to eight thirty. The fee is one hundred and twenty pounds, which includes the course book.\nMan: Is there a reduction for students?\nStaff: Yes, twenty per cent off with a valid student card.\nMan: I'm a student, so that's helpful. Where do the classes take place?\nStaff: In Room B12 of the Harrison Building, next to the library.\nMan: And is parking available?\nStaff: There's a car park, but it's often full. Most people find the number 14 bus more convenient, and the stop is right outside.\nMan: Great. Can I enrol online?\nStaff: You can, through our website. You'll need to pay by card at the time of booking.",
    [
      gap("Level of course: _____", ["beginners", "beginner"], "A Spanish course for beginners."),
      gap("Start date: 9 _____", ["october"], "Starts on the ninth of October."),
      gap("Number of weeks: _____", ["10", "ten"], "It runs for ten weeks."),
      gap("Day of class: _____", ["wednesday", "wednesdays"], "Wednesday evenings."),
      gap("Fee: £_____", ["120", "one hundred and twenty", "one hundred twenty"], "The fee is £120."),
      gap("Student discount: _____ per cent", ["20", "twenty"], "Twenty per cent off with a valid student card."),
      gap("Room: _____", ["b12"], "Room B12."),
      gap("Building: _____ Building", ["harrison"], "The Harrison Building."),
      gap("Best way to travel: number _____ bus", ["14", "fourteen"], "The number 14 bus stops outside."),
      sc("How must the fee be paid when booking online?", ["By card at the time of booking", "By cheque after the course begins", "In cash at the reception", "By bank transfer within a week"], 0, "The staff member says payment by card is required at booking."),
    ],
  ),
  ...withPassage(
    "Transcript (Section 2): Talk by a guide at a community history museum\n\nGuide: Welcome to the Millbrook Heritage Museum. Before we start, a few practical points. The museum has two floors. Most visitors begin on the ground floor, where you'll find the local industry gallery. Here the main exhibit is a working loom from the 1890s. Demonstrations take place at eleven and at two o'clock, and we'd encourage you to watch, as it's the only working machine of its kind in the region.\n\nUpstairs is the school room, laid out just as a classroom would have looked a century ago. Children love it, but it's popular, so it can get crowded on weekends. The café is also on the first floor and has good views over the river. Please note that photography is permitted everywhere except in the archive room, as flash damages old documents.\n\nOne last thing. We're currently raising money to restore the old town clock, which stopped working in 2009. If you'd like to contribute, there's a donation box by the exit, and anyone who gives ten pounds or more receives a free postcard.",
    [
      sc("What is the main exhibit in the industry gallery?", ["A working loom", "A printing press", "A steam engine", "A model of the town"], 0, "The guide says the main exhibit is a working loom from the 1890s."),
      sc("Why does the guide encourage visitors to watch the demonstration?", ["It is the only working machine of its kind in the region", "It is free", "It is very short", "It is the guide's favorite"], 0, "It is the only working machine of its kind in the region."),
      sc("What does the guide say about the school room?", ["It can be crowded on weekends", "It is closed to children", "It is only open in the afternoon", "It is in the basement"], 0, "It is popular and can get crowded on weekends."),
      sc("Where is the café?", ["On the first floor", "On the ground floor", "Outside the museum", "In the archive room"], 0, "The café is on the first floor with views over the river."),
      sc("Where is photography NOT allowed?", ["In the archive room", "In the school room", "In the café", "In the industry gallery"], 0, "Flash damages old documents in the archive room."),
      sc("Why is photography restricted there?", ["Flash damages old documents", "It disturbs other visitors", "The room is too dark", "Visitors could steal documents"], 0, "The guide gives this reason."),
      gap("Loom demonstrations take place at eleven and at _____ o'clock.", ["2", "two"], "Demonstrations take place at eleven and two."),
      gap("The old town _____ stopped working in 2009.", ["clock"], "The museum is raising money to restore it."),
      gap("Donors of ten pounds or more receive a free _____.", ["postcard"], "The guide mentions a free postcard."),
      gap("The donation box is by the _____.", ["exit"], "It is by the exit."),
    ],
  ),
  ...withPassage(
    "Transcript (Section 2): Information about a city bike-hire scheme\n\nAnnouncer: Thank you for calling the CityCycle information line. Here is how our scheme works. You need to register first, either on our app or at any docking station using a bank card. Registration costs nothing, and you'll receive a personal code by text message.\n\nTo hire a bike, enter your code at the station and choose a bicycle. The first thirty minutes of every journey are free. After that, the charge is one pound for each additional half hour, up to a maximum of ten pounds for a full day. If you keep a bike for more than twenty-four hours, you will be charged as though it has been lost.\n\nThere are over two hundred stations across the city, and the busiest are outside the railway station and the university. If a station is full when you arrive, the app will show you the nearest one with free spaces, and you'll receive an extra fifteen minutes of free time to get there.\n\nHelmets are not provided, but we recommend you wear one. If you notice a problem with a bike, press the red button on the handlebar to report it.",
    [
      sc("What do users receive after registering?", ["A personal code by text message", "A free helmet", "A printed map", "A membership card by post"], 0, "The announcer says they receive a personal code by text message."),
      gap("Registration costs _____.", ["nothing", "free"], "Registration costs nothing."),
      gap("The first _____ minutes of every journey are free.", ["30", "thirty"], "The first thirty minutes are free."),
      gap("After that, each extra half hour costs £_____", ["1", "one", "one pound"], "One pound for each additional half hour."),
      gap("The maximum charge for a day is £_____", ["10", "ten"], "Up to a maximum of ten pounds a day."),
      sc("What happens if a bike is kept for more than twenty-four hours?", ["The user is charged as though it has been lost", "The bike is locked", "The user is banned for a month", "The user pays double"], 0, "The announcer states this."),
      gap("There are over _____ stations across the city.", ["200", "two hundred"], "Over two hundred stations."),
      sc("What happens if a station is full on arrival?", ["The user receives extra free time to reach another station", "The user can leave the bike outside", "The user must call the information line", "The user pays a fine"], 0, "The user gets an extra fifteen minutes of free time."),
      sc("Which statement about helmets is correct?", ["They are recommended but not provided", "They are provided at every station", "They are compulsory", "They can be borrowed for a fee"], 0, "Helmets are not provided but recommended."),
      gap("To report a problem, press the _____ button on the handlebar.", ["red"], "Press the red button."),
    ],
  ),
  ...withPassage(
    "Transcript (Section 3): Two students and a tutor discussing a group project\n\nTutor: So, you've chosen to study how people use public parks. How will you collect your data?\nAnna: We were thinking of a questionnaire, but Tom thinks observation might be better.\nTom: Well, people often say what they think they do, not what they actually do. If we simply count and record how people use the space at different times, the results should be more reliable.\nAnna: But observation can't tell us why they come to the park.\nTutor: That's a fair point. Could you use both?\nTom: We could, though it would take longer.\nTutor: What's your deadline?\nAnna: Three weeks. Is that enough?\nTutor: It should be, if you start soon. I'd suggest observation first, on a weekday and a weekend, then a short questionnaire of no more than five questions to explain the patterns you saw.\nAnna: That makes sense. And for the report, should we write one section each?\nTutor: I'd say write the methods together so it's consistent, then divide the analysis. And make sure you include a section on the limitations of your study.",
    [
      sc("What is the topic of the students' project?", ["How people use public parks", "How to design a park", "Weather in city parks", "Park maintenance costs"], 0, "The tutor says they have chosen to study how people use public parks."),
      sc("Why does Tom prefer observation?", ["People may not report their behavior accurately", "It is faster than a questionnaire", "It is cheaper", "It allows him to ask why people come"], 0, "He says people often say what they think they do, not what they actually do."),
      sc("What weakness of observation does Anna point out?", ["It cannot tell them why people visit", "It takes too long", "It requires equipment", "It is unpopular with visitors"], 0, "She says observation can't tell us why they come."),
      sc("What does the tutor recommend?", ["Observation first, then a short questionnaire", "A long questionnaire only", "Interviews with park staff", "Using only existing statistics"], 0, "She suggests observation, then a short questionnaire of no more than five questions."),
      gap("Observation should be done on a weekday and a _____.", ["weekend"], "The tutor suggests a weekday and a weekend."),
      gap("The questionnaire should have no more than _____ questions.", ["5", "five"], "No more than five questions."),
      gap("The students have _____ weeks until the deadline.", ["3", "three"], "Anna says three weeks."),
      sc("How should the report be divided?", ["Methods written together and analysis divided", "Each student writes a whole report", "The tutor writes the methods", "One student writes everything"], 0, "The tutor says to write the methods together then divide the analysis."),
      gap("The report should include the _____ of the study.", ["limitations"], "The tutor asks for a section on the limitations."),
      sc("What is the tutor's attitude toward combining the two methods?", ["Supportive, although it takes longer", "Opposed", "Undecided", "Uninterested"], 0, "She suggests using both."),
    ],
  ),
  ...withPassage(
    "Transcript (Section 3): A student and a tutor discussing an essay plan\n\nStudent: I've been struggling with my essay on renewable energy policy. I have too much material.\nTutor: That's a common problem. What's your central argument?\nStudent: That governments should subsidize solar and wind because it reduces long-term costs.\nTutor: Good. Then every paragraph should support that claim. What are the main points so far?\nStudent: First, the falling price of solar panels. Second, job creation in new industries. Third, health savings from cleaner air. And I also have a section on the history of coal.\nTutor: The history of coal is interesting, but it doesn't directly support your argument. I'd cut it to a couple of sentences in the introduction.\nStudent: Okay. Should I include opposing views?\nTutor: Definitely. A strong essay acknowledges counter-arguments and responds to them. For example, critics say subsidies distort markets.\nStudent: And I should cite my sources carefully?\nTutor: Yes, use the department's referencing style, and keep the conclusion short, no new information.",
    [
      sc("What is the student's main problem?", ["They have too much material", "They cannot find sources", "They disagree with the tutor", "They missed a deadline"], 0, "The student says they have too much material."),
      sc("What is the student's central argument?", ["Governments should subsidize solar and wind", "Coal should be banned", "Nuclear power is the best option", "Energy is too expensive"], 0, "The student states the argument about subsidies."),
      sc("Which section does the tutor suggest reducing?", ["The history of coal", "Job creation", "Falling solar prices", "Health savings"], 0, "The tutor says to cut the history of coal to a couple of sentences."),
      sc("Why does the tutor say to reduce it?", ["It does not directly support the argument", "It is inaccurate", "It is too modern", "It is boring"], 0, "It doesn't directly support the argument."),
      sc("What does the tutor say about opposing views?", ["A strong essay acknowledges and responds to them", "They should be ignored", "They belong only in the conclusion", "They weaken an argument"], 0, "The tutor recommends including counter-arguments."),
      gap("Critics say subsidies _____ markets.", ["distort"], "The tutor gives this example."),
      gap("Solar panels have fallen in _____.", ["price"], "The student mentions the falling price."),
      gap("Cleaner air brings _____ savings.", ["health"], "The third point is health savings."),
      sc("Which referencing style should be used?", ["The department's style", "Any style", "A style chosen by the tutor each week", "None"], 0, "Use the department's referencing style."),
      sc("What should the conclusion NOT contain?", ["New information", "A summary", "A final judgment", "References"], 0, "The tutor says keep the conclusion short, with no new information."),
    ],
  ),
  ...withPassage(
    "Transcript (Section 4): Lecture on the history of glass\n\nLecturer: Today I'd like to talk about glass, a material so familiar we rarely think about it. Natural glass, such as obsidian formed by volcanoes, was used for tools long before people learned to make it. The earliest man-made glass appeared in Mesopotamia around 3500 BC, but it was used mainly for beads and small ornaments. Glass vessels came later, made by winding hot threads of glass around a clay core.\n\nA major breakthrough came in the first century BC with the invention of glassblowing, probably in the eastern Mediterranean. Blowing allowed craftsmen to make thin, light containers quickly and cheaply, and glass became an everyday material rather than a luxury. The Romans spread the technique throughout their empire.\n\nWindow glass developed slowly. The Romans made small panes, but large clear sheets were only possible from the nineteenth century, when new methods of drawing molten glass into flat ribbons were developed. Later, in the 1950s, the float process was introduced. In this process molten glass is poured onto a bath of liquid tin, which produces a perfectly flat surface, and it remains the standard method today.",
    [
      gap("Natural glass formed by volcanoes is called _____.", ["obsidian"], "The lecturer names obsidian."),
      gap("The earliest man-made glass appeared in _____.", ["mesopotamia"], "Around 3500 BC in Mesopotamia."),
      gap("Early glass was mostly used for beads and small _____.", ["ornaments"], "The lecturer says beads and small ornaments."),
      gap("Early vessels were made by winding threads of glass around a clay _____.", ["core"], "Hot threads around a clay core."),
      gap("Glassblowing was invented in the _____ century BC.", ["first", "1st"], "A breakthrough in the first century BC."),
      sc("What was the effect of glassblowing?", ["Glass became an everyday material", "Glass became more expensive", "Glass was used only for windows", "Glass was made only for ornaments"], 0, "Blowing made containers quickly and cheaply."),
      gap("The _____ spread the technique through their empire.", ["romans"], "The Romans."),
      gap("Large clear sheets became possible in the _____ century.", ["nineteenth", "19th"], "From the nineteenth century."),
      gap("The float process was introduced in the _____.", ["1950s", "1950's"], "In the 1950s."),
      gap("In the float process, molten glass is poured onto liquid _____.", ["tin"], "A bath of liquid tin."),
    ],
  ),
  ...withPassage(
    "Transcript (Section 4): Lecture on urban gardening\n\nLecturer: In this lecture I'll discuss urban gardening, which has grown rapidly in cities around the world. There are several reasons for its popularity. First, food grown locally has a small transport footprint, since it travels only a few kilometers. Second, gardens provide green space in areas with few parks, and studies link time spent among plants with reduced stress.\n\nUrban gardens take various forms. The most common are allotments, small plots rented by individuals, but there are also community gardens run collectively and, increasingly, rooftop gardens on commercial buildings. In some cities, vertical farms grow vegetables in stacked trays under artificial light, which uses far less land but a lot of electricity.\n\nThere are challenges. Soil in cities is often contaminated with metals from past industry, and gardeners may need to bring in clean soil or grow crops in raised beds. Access to land is another problem, as land is expensive and usually has other uses. Some cities have addressed this by offering temporary use of empty building sites, which allows gardens to exist until development begins.\n\nFinally, there's evidence that community gardens strengthen relationships between neighbors, although researchers point out that this is difficult to measure.",
    [
      gap("Locally grown food has a small transport _____.", ["footprint"], "The lecturer says a small transport footprint."),
      gap("Time among plants is linked to reduced _____.", ["stress"], "Studies link it to reduced stress."),
      gap("The most common type of urban garden is the _____.", ["allotment", "allotments"], "Allotments are the most common."),
      gap("Vertical farms grow vegetables in stacked _____.", ["trays"], "Stacked trays under artificial light."),
      gap("Vertical farms use far less land but a lot of _____.", ["electricity"], "The lecturer says a lot of electricity."),
      gap("City soil may be contaminated with _____ from past industry.", ["metals"], "Metals from past industry."),
      gap("Gardeners may grow crops in raised _____.", ["beds"], "Raised beds."),
      sc("Why is access to land a problem?", ["It is expensive and usually has other uses", "There is no empty land", "Gardens are banned", "Neighbors object"], 0, "Land is expensive and usually has other uses."),
      sc("How have some cities helped gardeners?", ["By offering temporary use of empty building sites", "By cleaning all soil", "By funding vertical farms", "By banning allotments"], 0, "Temporary use of empty building sites."),
      sc("What do researchers say about the social benefits of community gardens?", ["They are difficult to measure", "They do not exist", "They are greater than health benefits", "They are proven"], 0, "The lecturer says this is difficult to measure."),
    ],
  ),
];
