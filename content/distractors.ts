import type { Category } from "./types";

/*
 * Wrong-answer pools, one per category. Same style as the right answers (short, Title case).
 * It's fine for a pool to contain a right answer from another profile: at run time any pool
 * entry that matches the answer, or shares a word with anything on that profile, is skipped.
 * Teams are invented. No brands.
 */
export const distractors: Record<Category, string[]> = {
  pet: [
    "Biscuit", "Mochi", "Pepper", "Noodle", "Toffee", "Pickle", "Coco", "Bruno", "Ginger", "Peanut",
    "Muffin", "Ladoo", "Waffles", "Pixel", "Bubbles", "Rusty", "Kaju", "Simba", "Captain", "Jelly",
  ],
  city: [
    "Pune", "Jaipur", "Indore", "Kochi", "Lucknow", "Chandigarh", "Mysuru", "Bhopal", "Nagpur", "Surat",
    "Dehradun", "Vizag", "Guwahati", "Coimbatore", "Ahmedabad", "Raipur", "Ranchi", "Vadodara",
  ],
  trip: [
    "Goa", "Manali", "Ooty", "Shimla", "Rishikesh", "Udaipur", "Darjeeling", "Munnar", "Gokarna", "Leh",
    "Coorg", "Hampi", "Kasol", "Varkala", "Shillong", "Alleppey", "Jaisalmer",
  ],
  food: [
    "Pani puri", "Dosa", "Momos", "Biryani", "Pav bhaji", "Rajma chawal", "Pasta", "Dumplings", "Idli",
    "Vada pav", "Samosa", "Chole bhature", "Paneer tikka", "Lemon rice", "Poha", "Khichdi", "Dhokla",
  ],
  drink: [
    "Iced latte", "Masala chai", "Cold coffee", "Lemonade", "Green tea", "Mango lassi", "Hot chocolate",
    "Filter coffee", "Coconut water", "Jaljeera", "Nimbu pani", "Buttermilk", "Iced tea", "Rose milk",
    "Sugarcane juice",
  ],
  hobby: [
    "Pottery", "Salsa", "Chess", "Yoga", "Origami", "Karate", "Swimming", "Painting", "Crochet",
    "Bouldering", "Kathak", "Badminton", "Calligraphy", "Archery", "Surfing", "Knitting", "Bharatanatyam",
  ],
  colour: [
    "Yellow", "Red", "Teal", "Purple", "Orange", "Pink", "Green", "Blue", "Maroon", "Lilac", "Mustard",
    "Navy", "Mint", "Black", "White", "Grey",
  ],
  team: [
    "Thunder Owls", "Red Hawks", "Night Wolves", "Golden Geckos", "Sky Sharks", "Blue Comets",
    "Storm Riders", "Iron Pandas", "Fire Foxes", "River Rhinos", "Neon Tigers", "Silver Stags",
  ],
  gadget: [
    "Headphones", "Mechanical keyboard", "Fitness band", "Projector", "Smartwatch", "Drone", "E-reader",
    "Record player", "Tablet", "Ring light", "Bluetooth speaker", "Action camera", "Instant camera",
    "Game console", "Stylus",
  ],
  animal: [
    "Cat", "Dog", "Parrot", "Hamster", "Rabbit", "Duck", "Tortoise", "Goldfish", "Squirrel", "Guinea pig",
    "Budgie", "Turtle",
  ],
  music: [
    "Violin", "Ukulele", "Saxophone", "Tabla", "Guitar", "Flute", "Drums", "Sitar", "Cello",
    "Harmonica", "Trumpet", "Harmonium", "Veena",
  ],
};
