import { Q, sc, withPassage } from "./seed-helpers";

// Original ACT-style science passages and questions written for this platform.
// All data below are invented for practice purposes.

const r = (stem: string, opts: string[], explanation: string): Q => sc(stem, opts, 0, explanation);

export const ACT_SCIENCE: Q[] = [
  ...withPassage(
    "Data Representation: Light and Plant Growth\n\nA student grew identical bean seedlings under different amounts of daily light and measured the average height of each group after 30 days. All other conditions (water, soil, temperature) were kept the same.\n\nTable 1\nLight per day (hours) | Average height (cm)\n4 | 5\n8 | 11\n12 | 18\n16 | 18",
    [
      r("According to Table 1, the seedlings grown under 8 hours of light per day had an average height of", ["11 cm", "5 cm", "18 cm", "8 cm"], "Read directly from the table."),
      r("Which statement best describes the relationship between light and height from 4 to 12 hours?", ["Height increased as light increased", "Height decreased as light increased", "Height did not change", "Height changed randomly"], "Heights rise 5, 11, 18."),
      r("Based on the data, the average height for seedlings grown under 10 hours of light would most likely be", ["between 11 cm and 18 cm", "less than 5 cm", "more than 18 cm", "exactly 8 cm"], "10 hours lies between 8 and 12 hours, so the height should fall between 11 and 18 cm."),
      r("The results for 12 and 16 hours suggest that", ["something other than light limited growth beyond 12 hours", "light has no effect on height", "16 hours is harmful", "the measurements were wrong"], "The height did not increase from 12 to 16 hours."),
      r("In this experiment, the dependent variable is", ["average height", "hours of light", "amount of water", "soil type"], "The height is the outcome that was measured."),
    ],
  ),
  ...withPassage(
    "Research Summary: Enzyme Activity\n\nA biology class measured the rate at which an enzyme broke down a substrate at different temperatures. Each trial used the same amount of enzyme and substrate.\n\nTable 1\nTemperature (C) | Rate (units per minute)\n10 | 2\n20 | 5\n30 | 10\n40 | 14\n50 | 6\n60 | 0",
    [
      r("Of the temperatures tested, at which was the enzyme's rate highest?", ["40 C", "30 C", "50 C", "60 C"], "The highest rate was 14 units per minute at 40 C."),
      r("How much did the rate increase from 20 C to 30 C?", ["5 units per minute", "10 units per minute", "2 units per minute", "3 units per minute"], "10 - 5 = 5."),
      r("At 60 C, the rate was 0. Which of the following best explains this?", ["The enzyme was likely damaged by the heat", "The substrate was used up at 40 C", "Enzymes work better when hot", "The enzyme was not present"], "High temperatures denature enzymes and stop their activity."),
      r("Based on the data, the rate at 45 C would most likely be", ["between 6 and 14 units per minute", "greater than 14 units per minute", "less than 2 units per minute", "exactly 10 units per minute"], "45 C lies between 40 C (14) and 50 C (6)."),
      r("Which of the following was kept constant in each trial?", ["The amounts of enzyme and substrate", "The temperature", "The rate", "The time of day"], "The setup states the same amounts were used."),
    ],
  ),
  ...withPassage(
    "Research Summary: Pendulums\n\nStudents measured the time for one complete swing (period) of a pendulum with a fixed mass at different string lengths.\n\nTable 1\nString length (m) | Period (s)\n0.25 | 1.0\n0.50 | 1.4\n1.00 | 2.0\n2.00 | 2.8",
    [
      r("According to Table 1, the period for a string length of 1.00 m was", ["2.0 s", "1.4 s", "2.8 s", "1.0 s"], "Read directly from the table."),
      r("When the string length increased from 0.25 m to 1.00 m (four times as long), the period", ["doubled", "quadrupled", "stayed the same", "halved"], "The period went from 1.0 s to 2.0 s."),
      r("Based on the pattern, the period for a length of 4.00 m would most likely be", ["4.0 s", "3.0 s", "5.6 s", "8.0 s"], "Quadrupling the length from 1.00 m to 4.00 m should double the period from 2.0 s to 4.0 s."),
      r("Which of the following was held constant in the experiment?", ["The mass of the pendulum", "The period", "The string length", "The number of students"], "The setup states a fixed mass was used."),
      r("Which best describes the graph of period versus length?", ["A curve that rises more slowly as length increases", "A straight line through the origin", "A horizontal line", "A curve that falls"], "Doubling the length does not double the period, so the relation is not linear."),
    ],
  ),
  ...withPassage(
    "Data Representation: Soil Types\n\nA gardener tested three soil types. For each, 100 g of dry soil was saturated with water, and then the water that drained out was allowed to run for a fixed time. The table shows the water retained and how long it took for drainage to stop.\n\nTable 1\nSoil | Water retained (mL) | Drainage time (min)\nSand | 12 | 2\nLoam | 35 | 8\nClay | 48 | 30",
    [
      r("Which soil retained the most water?", ["Clay", "Sand", "Loam", "All retained equal amounts"], "Clay retained 48 mL."),
      r("Which soil drained the fastest?", ["Sand", "Loam", "Clay", "Loam and clay tied"], "Sand's drainage time was 2 minutes."),
      r("Which statement describes the pattern in the data?", ["Soils that retained more water drained more slowly", "Soils that retained more water drained faster", "Water retention and drainage time are unrelated", "All soils drained in the same time"], "Retention rose from sand to clay and drainage time rose as well."),
      r("A plant that needs well-drained soil would most likely grow best in", ["sand", "clay", "loam with added clay", "any of the soils"], "Sand drains most quickly."),
      r("How much more water did loam retain than sand?", ["23 mL", "12 mL", "35 mL", "47 mL"], "35 - 12 = 23."),
    ],
  ),
  ...withPassage(
    "Data Representation: Solubility\n\nThe solubility of two compounds was measured in 100 mL of water at four temperatures.\n\nTable 1\nTemperature (C) | Compound A (g) | Compound B (g)\n20 | 10 | 35\n40 | 14 | 36\n60 | 20 | 37\n80 | 30 | 38",
    [
      r("At 60 C, how many grams of Compound A dissolved in 100 mL of water?", ["20 g", "14 g", "37 g", "30 g"], "Read directly from the table."),
      r("Which compound's solubility was more affected by the increase in temperature?", ["Compound A", "Compound B", "Both equally", "Neither"], "A rose by 20 g while B rose by 3 g."),
      r("At 80 C, how many more grams of Compound B than Compound A dissolved?", ["8 g", "3 g", "38 g", "10 g"], "38 - 30 = 8."),
      r("If 25 g of Compound B is stirred into 100 mL of water at 20 C, it will most likely", ["dissolve completely", "not dissolve at all", "dissolve only partly", "form a gas"], "Its solubility at 20 C is 35 g, which is more than 25 g."),
      r("Based on the trend, the solubility of Compound A at 100 C would most likely be", ["greater than 30 g", "less than 10 g", "exactly 14 g", "the same as Compound B"], "Solubility of A increases with temperature at an increasing rate."),
    ],
  ),
  ...withPassage(
    "Conflicting Viewpoints: The Dinosaur Extinction\n\nTwo scientists discuss the cause of a mass extinction 66 million years ago.\n\nScientist 1: A massive asteroid struck the Earth. The impact threw dust and debris into the atmosphere, blocking sunlight for months to years. Plants died, and animals that depended on them collapsed. A worldwide layer of rock containing a rare element common in asteroids appears at exactly the time of the extinction.\n\nScientist 2: Extended volcanic eruptions released enormous amounts of gas and ash over hundreds of thousands of years. The gases changed the climate and acidified the oceans, causing extinctions gradually. Some species began to decline well before the date of the asteroid impact, which is not what a sudden impact would predict.",
    [
      r("Which of the following statements would Scientist 1 most likely agree with?", ["The extinction happened relatively suddenly", "Extinctions began long before the event", "Volcanoes were the main cause", "Climate change played no role"], "Scientist 1 describes an abrupt impact effect."),
      r("Scientist 2 uses which of the following as evidence?", ["Some species declined before the date of the impact", "A rock layer with a rare element", "Dust blocking sunlight", "The size of the asteroid"], "Scientist 2 points to earlier declines."),
      r("The two scientists disagree about", ["the main cause of the extinction and how fast it happened", "whether an extinction occurred", "the age of the Earth", "whether plants died"], "One says impact and sudden; the other volcanoes and gradual."),
      r("Which observation, if found, would best support Scientist 1?", ["A rare element from asteroids found in rock worldwide at the extinction boundary", "Evidence of gradual climate change over millennia", "Fossils of species that disappeared 5 million years earlier", "Volcanic ash in every rock layer"], "It directly matches Scientist 1's evidence."),
      r("Both scientists would most likely agree that", ["the environment changed dramatically around the time of the extinction", "an asteroid was the sole cause", "volcanoes were the sole cause", "no plants were affected"], "Both describe major environmental changes."),
    ],
  ),
  ...withPassage(
    "Data Representation: Predator and Prey\n\nA wildlife team counted the rabbit and fox populations in a reserve each year for five years.\n\nTable 1\nYear | Rabbits | Foxes\n1 | 400 | 20\n2 | 600 | 25\n3 | 900 | 40\n4 | 500 | 60\n5 | 300 | 35",
    [
      r("In which year was the rabbit population highest?", ["Year 3", "Year 1", "Year 4", "Year 5"], "900 rabbits in Year 3."),
      r("In which year was the fox population highest?", ["Year 4", "Year 3", "Year 5", "Year 2"], "60 foxes in Year 4."),
      r("Between Years 3 and 4, the rabbit population decreased while the fox population increased. This is consistent with", ["foxes feeding on rabbits", "rabbits feeding on foxes", "a lack of food for foxes", "no relationship between them"], "More predators can reduce prey."),
      r("In which year was the rabbit population lowest?", ["Year 5", "Year 1", "Year 2", "Year 4"], "300 rabbits in Year 5."),
      r("In Year 1, there was about one fox for every how many rabbits?", ["20", "4", "40", "100"], "400 / 20 = 20."),
    ],
  ),
  ...withPassage(
    "Data Representation: pH of Solutions\n\nFive solutions were tested with a pH meter. Litmus paper turns red in acidic solutions (pH below 7) and blue in basic solutions (pH above 7).\n\nTable 1\nSolution | pH\n1 | 2\n2 | 4\n3 | 7\n4 | 9\n5 | 12",
    [
      r("Which solution is the most acidic?", ["Solution 1", "Solution 2", "Solution 3", "Solution 5"], "The lower the pH below 7, the more acidic."),
      r("Which solution is neutral?", ["Solution 3", "Solution 2", "Solution 4", "Solution 1"], "A pH of 7 is neutral."),
      r("Which solutions would turn blue litmus paper red?", ["Solutions 1 and 2", "Solutions 4 and 5", "Solution 3 only", "All solutions"], "Acidic solutions have pH below 7."),
      r("Each pH unit represents a tenfold change in hydrogen ion concentration. How many times greater is the hydrogen ion concentration in Solution 1 than in Solution 2?", ["100 times greater", "2 times greater", "10 times greater", "1,000 times greater"], "Solution 1 is 2 units lower in pH than Solution 2, so 10 x 10 = 100 times."),
      r("Which solutions are basic?", ["Solutions 4 and 5", "Solutions 1 and 2", "Solution 3", "Solutions 2 and 3"], "pH above 7 is basic."),
    ],
  ),
  ...withPassage(
    "Research Summary: Heat Conduction\n\nA student placed spoons of equal size, made of different materials, in identical cups of hot water. After 5 minutes, she measured the temperature increase at the top end of each spoon.\n\nTable 1\nMaterial | Temperature increase (C)\nCopper | 45\nAluminum | 41\nSteel | 30\nWood | 8",
    [
      r("Which material conducted heat best?", ["Copper", "Wood", "Steel", "Aluminum"], "It had the greatest temperature increase."),
      r("Which material was the poorest conductor?", ["Wood", "Steel", "Aluminum", "Copper"], "It had the smallest increase."),
      r("How much greater was the temperature increase for copper than for steel?", ["15 C", "4 C", "37 C", "45 C"], "45 - 30 = 15."),
      r("Which pair of materials had the most similar conduction?", ["Copper and aluminum", "Steel and wood", "Copper and wood", "Aluminum and wood"], "Their increases differ by only 4 C."),
      r("Which statement best explains why the cups, spoon sizes, and time were kept the same?", ["To make material the only variable that differed", "To make the water hotter", "To measure the spoons' weight", "Because they are cheaper"], "Controlling other variables isolates the effect of material."),
    ],
  ),
  ...withPassage(
    "Data Representation: Rock Layers\n\nThe diagram of a cliff shows five undisturbed layers of sedimentary rock. Layer 1 is at the top and Layer 5 is at the bottom. The table shows which fossils were found in each layer.\n\nTable 1\nLayer | Fossils found\n1 | Species W\n2 | Species W, Species X\n3 | Species X\n4 | Species X, Species Y\n5 | Species Y",
    [
      r("Assuming the layers are undisturbed, which layer is the oldest?", ["Layer 5", "Layer 1", "Layer 3", "Layer 2"], "In undisturbed layers, the bottom layer is oldest."),
      r("Which species is found only in the oldest layer and the layer above it?", ["Species Y", "Species X", "Species W", "None of the species"], "Species Y appears in Layers 4 and 5."),
      r("Species W and Species Y both appear in", ["no layers", "Layer 1", "Layer 3", "Layer 5"], "The table shows no layer containing both."),
      r("Which of the following is the best conclusion?", ["Species Y lived earlier than Species W", "Species W lived earlier than Species Y", "Species X never coexisted with the others", "All species lived at the same time"], "Y appears in lower (older) layers than W."),
      r("Species X coexisted with", ["Species W and Species Y", "Species W only", "Species Y only", "neither species"], "X shares layers 2 with W and 4 with Y."),
    ],
  ),
  ...withPassage(
    "Research Summary: Voltage and Current\n\nA student connected a resistor to a variable power supply and recorded the current for several voltages.\n\nTable 1\nVoltage (V) | Current (A)\n2 | 0.5\n4 | 1.0\n6 | 1.5\n8 | 2.0",
    [
      r("According to Table 1, what was the current when the voltage was 6 V?", ["1.5 A", "1.0 A", "2.0 A", "0.5 A"], "Read directly from the table."),
      r("Which statement describes the relationship between voltage and current?", ["Current is directly proportional to voltage", "Current decreases as voltage increases", "Current is unrelated to voltage", "Current squares as voltage doubles"], "Doubling voltage doubles current."),
      r("Using resistance = voltage / current, what is the resistance of the resistor?", ["4 ohms", "0.25 ohms", "2 ohms", "8 ohms"], "2 V / 0.5 A = 4 ohms."),
      r("Based on the pattern, what current would be expected at 10 V?", ["2.5 A", "2.0 A", "3.0 A", "5.0 A"], "Each 2 V adds 0.5 A."),
      r("A second resistor drew 0.5 A at 4 V. Compared with the first resistor, its resistance is", ["greater", "smaller", "equal", "impossible to determine"], "Its resistance is 4 / 0.5 = 8 ohms, which is greater than 4 ohms."),
    ],
  ),
  ...withPassage(
    "Research Summary: Salt and Seed Germination\n\nA student soaked bean seeds in salt solutions of different concentrations and recorded the percentage of seeds that germinated after one week. Each group contained 100 seeds.\n\nTable 1\nSalt concentration (%) | Seeds germinated (%)\n0.0 | 96\n0.5 | 88\n1.0 | 64\n1.5 | 30\n2.0 | 4",
    [
      r("What percentage of seeds germinated at a salt concentration of 1.0%?", ["64%", "88%", "30%", "96%"], "Read directly from the table."),
      r("As the salt concentration increased, the percentage of seeds that germinated", ["decreased", "increased", "stayed the same", "increased then decreased"], "The values fall from 96 to 4."),
      r("At which concentration did fewer than half of the seeds germinate for the first time?", ["1.5%", "1.0%", "2.0%", "0.5%"], "At 1.5% only 30% germinated, the first value below 50%."),
      r("The group with a salt concentration of 0.0% served as the", ["control group", "experimental variable", "independent variable", "prediction"], "It shows normal germination without salt."),
      r("At a concentration of 2.5%, the percentage of seeds germinating would most likely be", ["close to 0%", "greater than 30%", "about 50%", "100%"], "The trend is a steady drop toward zero."),
    ],
  ),
  ...withPassage(
    "Research Summary: Melting Ice with Salt\n\nA student placed 100 g of ice at 0 C in each of four identical containers at room temperature, added different amounts of salt, and measured the time for the ice to melt completely.\n\nTable 1\nSalt added (g) | Time to melt (min)\n0 | 40\n5 | 32\n10 | 27\n15 | 25",
    [
      r("Which amount of salt melted the ice fastest?", ["15 g", "0 g", "5 g", "10 g"], "It has the shortest time."),
      r("How much faster did the ice melt with 5 g of salt than with no salt?", ["8 minutes", "5 minutes", "32 minutes", "13 minutes"], "40 - 32 = 8."),
      r("Which describes the trend in the reduction of melting time with each additional 5 g of salt?", ["The reduction got smaller each time", "The reduction got larger each time", "The reduction stayed the same", "There was no reduction"], "The reductions were 8, 5 and 2 minutes."),
      r("Which of the following was held constant?", ["The mass of ice and room temperature", "The amount of salt", "The time to melt", "The size of the salt crystals only"], "The setup states equal ice mass and the same room."),
      r("The time to melt with 20 g of salt would most likely be", ["about 24 to 25 minutes", "about 10 minutes", "about 40 minutes", "about 30 minutes"], "The gains are levelling off, so 20 g likely gives a time slightly under 25 minutes."),
    ],
  ),
  ...withPassage(
    "Data Representation: A Cart on a Ramp\n\nA cart was released from rest at the top of a ramp, and its speed was recorded each second.\n\nTable 1\nTime (s) | Speed (m/s)\n0 | 0\n1 | 2\n2 | 4\n3 | 6\n4 | 8",
    [
      r("What was the speed of the cart at 3 seconds?", ["6 m/s", "4 m/s", "8 m/s", "3 m/s"], "Read directly from the table."),
      r("What was the acceleration of the cart?", ["2 m/s per second", "1 m/s per second", "4 m/s per second", "8 m/s per second"], "Speed increases 2 m/s each second."),
      r("Given a constant acceleration from rest, what distance did the cart cover in the first 4 seconds? (Distance = average speed x time.)", ["16 m", "32 m", "8 m", "4 m"], "Average speed is (0 + 8)/2 = 4 m/s, and 4 x 4 = 16 m."),
      r("If the pattern continued, the speed at 5 seconds would be", ["10 m/s", "9 m/s", "12 m/s", "16 m/s"], "8 + 2 = 10."),
      r("Which best describes the motion of the cart?", ["Speeding up at a steady rate", "Moving at constant speed", "Slowing down", "Speeding up at an increasing rate"], "The speed increases by the same amount each second."),
    ],
  ),
  ...withPassage(
    "Conflicting Viewpoints: Formation of the Moon\n\nTwo students discuss how the Moon formed.\n\nStudent 1: A Mars-sized body collided with the early Earth. The debris from the collision, made of material from both bodies, gathered in orbit and formed the Moon. This explains why the Moon's rocks are chemically very similar to Earth's outer layers and why the Moon has a small iron core.\n\nStudent 2: The Moon formed elsewhere in the solar system and was captured by Earth's gravity as it passed nearby. This explains the Moon's orbit and why it is different in some details from Earth. However, capture would require the Moon to lose a great deal of energy, and it is unclear how that happened.",
    [
      r("According to Student 1, the Moon is made of", ["material from Earth and the colliding body", "material only from Mars", "material from the Sun", "only Earth's iron core"], "The debris came from both bodies."),
      r("Which observation supports Student 1's view?", ["The chemical similarity of Moon rocks to Earth's outer layers", "The Moon's orbit", "Capture requires a loss of energy", "The Moon's distance from the Sun"], "Student 1 uses the chemical similarity as evidence."),
      r("Student 2 admits which of the following is unresolved?", ["How the Moon could lose enough energy to be captured", "How large the Moon is", "Why Earth has an atmosphere", "How the Sun formed"], "Student 2 says it is unclear how the energy loss happened."),
      r("Both students assume that", ["the Moon's origin can be explained by a physical event", "the Moon is younger than Earth", "the Moon has no core", "Mars formed the Moon"], "Both propose physical events (collision or capture)."),
      r("Which finding would most weaken Student 1's view?", ["Moon rocks with a chemical makeup very different from Earth's", "Moon rocks similar to Earth's", "Evidence of an early impact on Earth", "A small iron core in the Moon"], "Chemical similarity is Student 1's evidence."),
    ],
  ),
  ...withPassage(
    "Research Summary: Fertilizer and Crop Yield\n\nA farmer applied different amounts of fertilizer to four identical plots of wheat and measured the yield at harvest.\n\nTable 1\nFertilizer (kg per hectare) | Yield (tonnes per hectare)\n0 | 2.1\n20 | 3.0\n40 | 3.6\n60 | 3.7",
    [
      r("What yield resulted from 40 kg of fertilizer per hectare?", ["3.6 tonnes", "3.0 tonnes", "3.7 tonnes", "2.1 tonnes"], "Read directly from the table."),
      r("By how much did the yield increase when fertilizer went from 0 to 20 kg per hectare?", ["0.9 tonnes", "1.5 tonnes", "0.6 tonnes", "0.1 tonnes"], "3.0 - 2.1 = 0.9."),
      r("Which best describes the effect of adding fertilizer from 40 to 60 kg per hectare?", ["Little change in yield", "A large increase in yield", "A decrease of 1 tonne", "No yield"], "The yield rose only 0.1 tonnes."),
      r("Which hypothesis is best supported by the data?", ["Beyond a certain amount, extra fertilizer adds little to yield", "Fertilizer always doubles the yield", "Fertilizer reduces yield", "Fertilizer has no effect"], "Yield gains shrink as more fertilizer is added."),
      r("Which increase in fertilizer produced the largest gain in yield per kilogram added?", ["0 to 20 kg", "20 to 40 kg", "40 to 60 kg", "They were equal"], "The gain was 0.9 tonnes for the first 20 kg, then 0.6, then 0.1."),
    ],
  ),
];
