import { Q, sc, withPassage } from "./seed-helpers";

// Original Cambridge C1 Advanced-style Reading items written for this platform.
// The first option is always correct; the helper rotation shuffles positions.

const r = (stem: string, opts: string[], explanation: string): Q => sc(stem, opts, 0, explanation);

// Gapped-text item: choose the sentence that fits a numbered gap.
const gapQ = (n: number, opts: string[], explanation: string): Q =>
  sc(`Which sentence best fills gap ${n}?`, opts, 0, explanation);

// Multiple-matching item: A-D refer to the four writers/sections.
const who = (statement: string, correct: "A" | "B" | "C" | "D", explanation: string): Q => {
  const labels = ["A", "B", "C", "D"];
  const opts = [correct, ...labels.filter((l) => l !== correct)].map((l) => `Section ${l}`);
  return sc(`Which section ${statement}`, opts, 0, explanation);
};

export const C1_READING: Q[] = [
  // ---- Part 5: multiple-choice reading (18) ----
  ...withPassage(
    "Returning to the Field\n\nThe first thing I noticed when I stepped off the boat was the silence, or rather the absence of the particular noises I had come to expect. Twenty years earlier, as a graduate student, I had spent a season counting seabirds on this island, and I remembered a constant, grating chorus. Now the cliffs seemed subdued. I told myself that it was early in the year, that the colonies would fill, but a colleague who had been visiting regularly was less consoling. \"Each spring there are fewer,\" she said, in the flat voice of someone who has already had the argument with herself. I found that I was relieved, absurdly, to be handed a task. Counting is what scientists do when there is nothing else they can do, and there is a dignity in it: whatever else might be said of the numbers, they do not flatter anyone. By the end of the first week my notebooks were filling, and so, to my surprise, was my sense of purpose.",
    [
      r("What does the writer imply about the seabird colonies in the first paragraph?", ["Their numbers appear to have fallen since his earlier visit", "They had been driven away by the boat's arrival", "They are quieter than usual only at the start of the year", "They were unaffected by the passing of time"], "He notes the silence and a colleague says there are fewer each year."),
      r("What does the writer mean by 'the flat voice of someone who has already had the argument with herself'?", ["She has reluctantly accepted a discouraging reality", "She is bored by the conversation", "She is angry with the writer", "She disagrees with his claim"], "The phrase suggests she has debated the point internally and reached a resigned conclusion."),
      r("Why was the writer relieved to be given a task?", ["It gave him something constructive to do in the face of bad news", "He wanted to prove his colleague wrong", "He disliked the silence of the island", "He needed the results for a publication"], "Counting is described as what scientists do when nothing else can be done, and it gives him purpose."),
      r("What does the writer suggest by saying that numbers 'do not flatter anyone'?", ["Data present the facts whether or not they are welcome", "Numbers are easily misunderstood", "Scientists prefer to avoid them", "Results are usually disappointing"], "Numbers are objective and do not soften the truth."),
      r("The writer's attitude by the end of the passage can best be described as", ["quietly reassured by the work despite his concerns", "completely optimistic about the birds", "irritated with his colleague", "indifferent to the outcome"], "His sense of purpose is growing even though the situation is troubling."),
      r("The word 'subdued' in the first paragraph most closely means", ["quiet and lacking energy", "brightly colored", "unusually crowded", "freshly painted"], "It describes the cliffs as unusually quiet."),
    ],
  ),
  ...withPassage(
    "The Public Library Reimagined\n\nFor much of the last century, the public library was defined by silence and shelves. Newer buildings suggest a quite different idea. In several cities, architects have designed libraries in which books occupy only a modest fraction of the space, the rest being given over to cafés, studios, children's play areas and rooms that can be booked for meetings. Enthusiasts argue that the library has finally been rescued from irrelevance: by becoming a place where people gather, it has regained its role as a civic living room. Sceptics reply that something valuable has been lost. A library, they suggest, was one of the few public spaces that asked nothing of its visitors, neither purchase nor performance, and where the only expectation was quiet attention. It is not clear that a space full of activity can offer this. The truth may be that different people need different libraries, and that the best cities will find room for both the noisy and the silent.",
    [
      r("What point does the writer make about the newer library buildings?", ["Books take up only a small part of their space", "They contain no books at all", "They are built only in large cities", "They have been unpopular with architects"], "The text says books occupy only a modest fraction."),
      r("According to enthusiasts, the redesigned libraries", ["have regained importance as places for people to meet", "are cheaper to run than traditional libraries", "encourage silent reading", "attract mainly children"], "The 'civic living room' idea stresses gathering."),
      r("What concern do sceptics raise?", ["Activity may destroy the undemanding quiet that libraries once offered", "Libraries will run out of money", "Cafés will replace all books", "Visitors will stop borrowing"], "They value a space that asked nothing of visitors."),
      r("What does the phrase 'civic living room' suggest?", ["A shared public space where people feel at home", "A private space for officials", "A room used only for meetings", "A space with expensive furniture"], "It compares the library to a comfortable communal room."),
      r("What is the writer's own view at the end of the passage?", ["Cities should provide both busy and quiet libraries", "Silent libraries should be closed", "Only active libraries have a future", "The debate is not worth having"], "The last sentences propose room for both kinds."),
      r("The word 'modest' in the passage is closest in meaning to", ["fairly small", "impressive", "hidden", "expensive"], "'A modest fraction' means a small proportion."),
    ],
  ),
  ...withPassage(
    "Learning to Cook\n\nMy grandmother never owned a set of scales, and she regarded recipes as an admission of weakness. Her cooking depended on what she called 'a feel for it', a phrase that infuriated me when, aged twenty, I asked her how to make the bread I had loved as a child. \"You'll know when the dough is right,\" she said. I did not know. My first loaves resembled paving stones, and after several failures I abandoned the effort, blaming her for withholding the secret. It was years before I understood that she had withheld nothing; she simply could not put into words what her hands had learned. When I finally returned to the bread, it was in her kitchen, after she had grown too frail to bake herself. She sat by the window and watched me work, offering no instructions. At one point, without looking up, she said quietly, \"There.\" I stopped, and I knew, at last, exactly what she meant.",
    [
      r("Why did the writer's grandmother's advice frustrate him at first?", ["It was too vague to be of practical use", "It contradicted the recipes he had read", "She refused to let him use her kitchen", "It required equipment he did not own"], "'You'll know when the dough is right' gave no concrete guidance."),
      r("What does the writer realise years later?", ["His grandmother could not put her knowledge into words", "His grandmother had deliberately misled him", "Recipes are more reliable than instinct", "He was not capable of baking"], "He understands that she withheld nothing but could not verbalise her skill."),
      r("What does the writer mean by 'my first loaves resembled paving stones'?", ["They were extremely hard and dense", "They were large and flat", "They were an unusual shape", "They were left outside"], "The comparison suggests hard, heavy bread."),
      r("How does the grandmother help him in the final paragraph?", ["By confirming, with a single word, the moment when the dough was right", "By showing him a written recipe", "By baking beside him", "By criticising his technique"], "Her quiet 'There' marks the right moment."),
      r("The tone of the final paragraph is best described as", ["gentle and reflective", "bitter and resentful", "humorous and casual", "anxious and hurried"], "The scene is quiet, affectionate and reflective."),
      r("The phrase 'a feel for it' suggests knowledge that is", ["gained through experience rather than instruction", "written in a recipe", "taught by scientists", "kept secret deliberately"], "It refers to an intuitive skill learned by doing."),
    ],
  ),
  // ---- Part 6: cross-text multiple matching (8) ----
  ...withPassage(
    "Text A\n\nIt is fashionable to claim that handwriting is doomed, and equally fashionable to mourn its passing. I find both attitudes exaggerated. Handwriting has already lost most of its everyday functions, but it hasn't disappeared: people still write shopping lists, birthday cards and notes to themselves. What has changed is that it is no longer a necessity, and things that are no longer necessary tend to become more personal. A handwritten letter today says something that an email cannot precisely because it is a choice.\n\nText B\n\nDefenders of handwriting often speak as if the argument were about nostalgia. It is not. The evidence that forming letters by hand helps young children learn to read is far stronger than the evidence that typing offers any advantage at the same age. Whatever its sentimental value, handwriting is a foundational skill, and to treat it as an optional extra risks depriving children of something that benefits them cognitively. That is a matter for schools, not for anyone's feelings about birthday cards.",
    [
      r("Both writers mention", ["the personal or sentimental appeal of handwriting", "the cost of teaching handwriting in schools", "the speed advantage of typing", "research on adult writers"], "A refers to handwritten cards and letters as personal; B refers to the sentimental value and birthday cards."),
      r("What is Writer B's attitude to the emotional case for handwriting?", ["It is beside the point in the debate about schooling", "It is the strongest argument available", "It should be the basis of school policy", "It is mistaken because handwriting is dying"], "B says the issue is about schools, not feelings."),
      r("How does Writer A's approach differ from Writer B's?", ["A focuses on personal meaning while B focuses on educational evidence", "A supports typing while B opposes it", "A cites research while B does not", "A is pessimistic while B is optimistic about the future"], "A considers the personal significance, B the evidence for learning."),
      r("Which statement would Writer A most likely accept?", ["Handwritten items can carry meaning precisely because they are optional", "Handwriting is an essential daily skill", "Children should type before they write", "Nostalgia is irrelevant to handwriting"], "A argues a handwritten letter says something because it is a choice."),
    ],
  ),
  ...withPassage(
    "Text A\n\nMuseums have always faced pressure to justify their existence, and the current fashion is to measure success by visitor numbers. I am uneasy about this. A museum that chases footfall will inevitably favour spectacle over scholarship, and the objects on which its reputation was built become props. Attendance is easy to count, which is precisely why it is so often used. What is harder to measure is whether visitors have understood anything.\n\nText B\n\nThose who complain that museums have become too populist forget who they are for. Public money supports these institutions, and the public has every right to expect that they will be welcoming. There is nothing shameful in attracting large audiences, and nothing about scholarship that requires empty galleries. The best museums have shown that popular appeal and serious research can go together; the challenge is to do both well, not to choose between them.",
    [
      r("What do both writers suggest about museums?", ["Success involves more than simply attracting crowds", "Entry should always be free", "Scholars are no longer needed", "Their collections are too large"], "A wants understanding as well as attendance; B wants popular appeal and serious research together."),
      r("How do the writers differ in their view of popular appeal?", ["A sees it as a threat to scholarship whereas B sees it as compatible with it", "A welcomes it whereas B opposes it", "Both are opposed to it", "Both consider it irrelevant"], "A fears spectacle over scholarship; B says both can go together."),
      r("Writer B's reference to public money is used to argue that", ["museums have an obligation to be accessible", "museums should be run as businesses", "scholarship is too costly", "museums should reduce their numbers of visitors"], "B argues the public has a right to expect a welcoming institution."),
      r("Writer A's main concern is that", ["the emphasis on attendance may undermine the museum's real purpose", "visitors are uninterested in objects", "museums cannot count visitors accurately", "public money is wasted"], "A is uneasy that chasing footfall favours spectacle over scholarship."),
    ],
  ),
  // ---- Part 7: gapped text (12) ----
  ...withPassage(
    "The Last Lighthouse Keeper\n\nFor forty years, Tom Ridley lived on the edge of the country. [1] Each evening he climbed the 121 steps to the lamp room, checked the lens and waited for dusk. [2] Then, in 1998, the light was automated, and the last keepers were withdrawn from every station in the land. Ridley recalls the day the system was installed. [3] A young engineer arrived by helicopter with a metal case, and within an hour the lamp was working without him. \"It was quite efficient,\" he says with a wry smile. \"I couldn't fault it.\" [4] Yet he admits that for months afterwards he woke at dusk, unable to shake the habit. Today, the lighthouse is a museum and Ridley occasionally leads visitors up the steps. [5] What they most want to know, he says, is whether he was lonely. His answer is never quite what they expect. [6] He was busy, he says, and the sea was never the same two days running.",
    [
      gapQ(1, ["His days followed a routine that hardly changed.", "He hated the sea and everything about it.", "The lighthouse was built by his grandfather in 1900.", "Nobody ever visited the rocks around it."], "The following sentence describes a fixed daily routine."),
      gapQ(2, ["It was work that required patience, and he came to love its regularity.", "The job paid extremely well.", "He was often offered promotion elsewhere.", "He regretted taking it from the start."], "The sentence links the routine to his feelings and prepares for the change coming next."),
      gapQ(3, ["It took less time than he had expected.", "It was the most complicated task of his career.", "He had never seen a helicopter before.", "He refused to let anyone in."], "The following sentences describe how quickly the installation was done."),
      gapQ(4, ["He had to admit that the machine did the work as well as he did.", "He suggested that the engineer was mistaken.", "The machine failed at once.", "He returned the equipment to the company."], "The quote 'I couldn't fault it' follows."),
      gapQ(5, ["Visitors are often curious about his former life.", "Nobody ever asks him anything.", "The museum receives few visitors.", "He no longer likes the building."], "The next sentence speaks of what visitors want to know."),
      gapQ(6, ["The truth, he insists, is that solitude and loneliness are not the same thing.", "In fact, he was terrified of the sea.", "Loneliness is common among all lighthouse keepers.", "He once considered leaving the job."], "The final sentences give his reasons for not being lonely."),
    ],
  ),
  ...withPassage(
    "The Return of Handmade Paper\n\nIn a small workshop in the hills, Amara Sen lifts a wooden frame from a vat of pale fibre and lets the water drain away. [1] What remains on the screen will, after pressing and drying, become a sheet of paper. It is a process that has changed little in a thousand years. [2] Until recently, few people outside the arts had heard of it. But the past decade has seen a revival in interest, as designers and printmakers have rediscovered its qualities. [3] Handmade paper has a texture and depth that industrial paper cannot easily imitate. Sen believes the revival reflects a wider wish for objects with a story. [4] \"People are tired of things that look identical,\" she says. \"They want to see the marks of a hand.\" The demand has brought its own difficulties, however. [5] Raw materials such as cotton rags and plant fibres are harder to source, and there are few trained makers. Sen has therefore begun teaching classes. [6] She hopes that in time her students will open their own workshops and that the craft will secure its future.",
    [
      gapQ(1, ["The sheet is formed as the fibres settle evenly across the mesh.", "The vat is filled with molten metal.", "She begins to paint the sheet at once.", "The workshop closed years ago."], "The following sentence says what remains on the screen and is formed."),
      gapQ(2, ["Yet the skill was in danger of being forgotten.", "The technique was invented last year.", "Machines now do the entire job.", "The workshop is very large."], "It contrasts the long history of the process with its obscurity, leading into 'Until recently, few people had heard of it'."),
      gapQ(3, ["Its appeal is partly a question of feel.", "It is impossible to write on.", "It is more expensive than gold.", "Everyone dislikes it."], "The following sentence describes texture and depth."),
      gapQ(4, ["She sees it as a reaction against mass production.", "She believes the revival will be brief.", "She thinks people prefer plain objects.", "She has never studied the trend."], "The quote about tired of identical things supports this."),
      gapQ(5, ["Supply has not kept pace with the rising demand.", "The workshop has stopped taking orders.", "Prices have fallen sharply.", "Paper is no longer needed."], "The next sentence explains shortages of materials and makers."),
      gapQ(6, ["Her aim is to pass on the skills before they are lost.", "She plans to close the workshop.", "She has no interest in teaching.", "She wants machines to take over."], "The following sentence talks about students opening workshops."),
    ],
  ),
  // ---- Part 8: multiple matching (18) ----
  ...withPassage(
    "Four Scientists on Their Fieldwork\n\nA. Nadia Rahman, marine biologist\nMost of my time is spent underwater, but people are surprised by how little of it involves anything dramatic. It is careful counting, in cold water, for hours. The real danger is not sharks but boredom, which makes you careless with the equipment. Still, I have never been anywhere that gave me such a feeling of being in touch with a whole system. I would gladly do it for the rest of my life.\n\nB. Omar Lindqvist, glaciologist\nExpeditions to the ice require months of planning, and yet the most important lesson I have learned is that plans rarely survive contact with the weather. You learn to be flexible, and above all to trust your team. My family doesn't share my enthusiasm; they say I choose the coldest places on Earth deliberately. They may be right, but I've never been more content than when working in a landscape that offers no distractions.\n\nC. Priya Menon, ecologist\nI began in a laboratory, and I confess that I found fieldwork uncomfortable at first: the mud, the insects, the uncertainty. Now I can't imagine working any other way. Data from the field is messy, but that messiness is the truth about how nature works. It has taught me to be more patient with results that don't fit my expectations.\n\nD. Lucas Bell, geologist\nPeople imagine geology as looking at rocks, but the real skill is reading a landscape and imagining what it looked like millions of years ago. It requires long periods of walking alone, and I'm happy with that. My greatest challenge has been funding: it is hard to persuade committees that knowing the age of a hillside is worth paying for.",
    [
      who("describes the difficulty of obtaining money for research?", "D", "Lucas Bell mentions persuading committees to fund his work."),
      who("says that a lack of concentration can be a greater risk than a physical threat?", "A", "Nadia says the real danger is boredom, not sharks."),
      who("admits to having disliked fieldwork initially?", "C", "Priya says she found fieldwork uncomfortable at first."),
      who("mentions the reaction of relatives to their job choices?", "B", "Omar says his family teases him about choosing cold places."),
      who("values the lack of distractions in their working environment?", "B", "Omar is content in a landscape without distractions."),
      who("appreciates how untidy results reflect reality?", "C", "Priya says the messiness of data is the truth about nature."),
      who("enjoys spending long periods on their own?", "D", "Lucas says he is happy with long walks alone."),
      who("believes their work gives them a sense of connection with a whole system?", "A", "Nadia feels in touch with a whole system."),
      who("emphasises the need to adapt to unpredictable conditions?", "B", "Omar says plans rarely survive contact with the weather."),
    ],
  ),
  ...withPassage(
    "Four People on Learning a Language as an Adult\n\nA. Helena\nI started Italian at fifty, mostly because I was afraid of losing my mind. Within a year I was reading novels, slowly. What I hadn't expected was how much it would change my view of my own language: I began to notice things about English that had never occurred to me. I'd recommend it to anyone for that reason alone.\n\nB. Kwame\nMy problem was always speaking. I could read and write reasonably well, but the moment a real person spoke to me, my mind went blank. What helped was joining a conversation club where nobody minded mistakes. The lesson was that fluency isn't about being right, it's about being willing to be wrong in public.\n\nC. Ingrid\nI learned Japanese because of my job, so at first I resented every lesson. Only when I visited Japan did I feel it was worth it: strangers reacted with such delight when I attempted even a few sentences. That reaction motivated me more than any teacher.\n\nD. Marco\nI never had much time, so I studied in short bursts, ten minutes a day on my phone. People said it wouldn't work, but I'm now able to follow films. What I couldn't do on my own was pronunciation, so I hired a tutor for that alone, which was money well spent.",
    [
      who("found that studying encouraged reflection on their first language?", "A", "Helena noticed things about English."),
      who("says that a supportive environment helped overcome anxiety about speaking?", "B", "Kwame joined a conversation club where mistakes did not matter."),
      who("was motivated by other people's positive reactions?", "C", "Ingrid was encouraged by delight from strangers in Japan."),
      who("used very short regular sessions to make progress?", "D", "Marco studied ten minutes a day."),
      who("initially studied for reasons connected with work?", "C", "Ingrid learned Japanese because of her job."),
      who("paid for help with one specific skill?", "D", "Marco hired a tutor only for pronunciation."),
      who("began learning partly out of concern about mental decline?", "A", "Helena said she was afraid of losing her mind."),
      who("describes freezing when speaking to native speakers?", "B", "Kwame says his mind went blank."),
      who("originally disliked the lessons?", "C", "Ingrid resented every lesson at first."),
    ],
  ),
];
